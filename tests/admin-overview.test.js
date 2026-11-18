const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const program = (time, title) => ({ time, title, host: "", summary: "", type: "" });
const tick = () => new Promise((resolve) => setImmediate(resolve));

function setup(data, iso = "2026-11-09T06:00:00Z") {
  const nodes = {};
  const listeners = {};
  const calls = [];
  function node(id) {
    if (!nodes[id]) nodes[id] = {
      textContent: "", children: [], listeners: {},
      addEventListener(type, fn) { this.listeners[type] = fn; },
      replaceChildren() { this.children = []; this.textContent = ""; },
      appendChild(child) { this.children.push(child); }
    };
    return nodes[id];
  }
  const document = {
    getElementById: node,
    createElement: () => ({ textContent: "" }),
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }
  };
  const db = {
    collection(name) {
      const query = {
        where(field, op, value) { calls.push([name, field, op, value]); return query; },
        doc(id) { return { get: (options) => get(`${name}/${id}`, options) }; },
        get: (options) => get(name, options)
      };
      return query;
    }
  };
  function get(name, options) {
    calls.push([name, options.source]);
    const value = data[name];
    if (value instanceof Error) return Promise.reject(value);
    if (value && typeof value.then === "function") return value;
    if (name.includes("/")) return Promise.resolve(value === undefined
      ? { exists: false } : { exists: true, data: () => value });
    const docs = (value || []).map((item) => ({ data: () => item }));
    return Promise.resolve({ docs, size: docs.length });
  }
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [iso])); }
  }
  const window = { firebase: { firestore: () => db } };
  const context = vm.createContext({ window, document, Date: FixedDate, Intl, console: { error() {} }, setInterval() {} });
  for (const file of ["content.js", "admin-overview.js"]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file });
  }
  // Only initialize the overview; content.js also registers a public-page initializer.
  listeners.DOMContentLoaded.at(-1)();
  return {
    nodes, calls, data,
    auth(role) { listeners["bwe-admin-auth"].forEach((fn) => fn({ detail: { user: role ? {} : null, role } })); },
    tab(tab) { listeners["bwe-admin-tab"].forEach((fn) => fn({ detail: { tab } })); },
    refresh() { node("refreshOverviewButton").listeners.click(); }
  };
}

test("overview counts all saved records and shows Kampala current and upcoming programs", async () => {
  const app = setup({
    shows: [{ active: true }, { active: false }],
    episodes: [{ status: "published" }, { status: "draft" }, {}],
    pages: [{ status: "draft" }, { status: "published" }],
    adBookings: [{}, {}],
    "settings/programSchedule": { streamEnabled: false, days: { Monday: [
      program("10:00", "<Upcoming>"), program("07:30", "Breakfast")
    ] } }
  });
  app.auth("editor");
  assert.equal(app.nodes.overviewShows.textContent, "Loading...");
  await tick();
  assert.equal(app.nodes.overviewShows.textContent, "2");
  assert.equal(app.nodes.overviewEpisodes.textContent, "3");
  assert.equal(app.nodes.overviewDraftShows.textContent, "1 draft shows.");
  assert.equal(app.nodes.overviewDraftEpisodes.textContent, "2 draft episodes.");
  assert.equal(app.nodes.overviewDraftPages.textContent, "1 draft pages.");
  assert.equal(app.nodes.overviewInquiries.textContent, "2");
  assert.equal(app.nodes.overviewStream.textContent, "Marked offline");
  assert.deepEqual(app.nodes.overviewSchedule.children.map((line) => line.textContent), [
    "Monday — saved schedule", "Current: 7:30 AM — Breakfast", "Upcoming: 10:00 AM — <Upcoming>"
  ]);
  assert.ok(app.calls.some((call) => call.join(",") === "adBookings,status,==,new"));
  assert.ok(app.calls.filter((call) => call.length === 2).every((call) => call[1] === "server"));
});

test("zero, unavailable, missing settings, and retry are distinct", async () => {
  const app = setup({ shows: new Error("offline"), adBookings: new Error("denied") });
  app.auth("admin");
  await tick();
  assert.match(app.nodes.overviewShows.textContent, /Unavailable/);
  assert.match(app.nodes.overviewNewInquiries.textContent, /Unavailable/);
  assert.equal(app.nodes.overviewEpisodes.textContent, "0");
  assert.equal(app.nodes.overviewStream.textContent, "Not set (site defaults online)");
  assert.match(app.nodes.overviewSchedule.children[0].textContent, /estimated default/);
  app.data.shows = [];
  app.data.adBookings = [];
  app.refresh();
  await tick();
  assert.equal(app.nodes.overviewShows.textContent, "0");
  assert.equal(app.nodes.overviewInquiries.textContent, "0");
});

test("schedule respects gaps, day rollover, invalid data and failed reads", async () => {
  const app = setup({ "settings/programSchedule": { streamEnabled: true, days: { Tuesday: [
    program("07:30", "Breakfast"), program("20:00", "Evening")
  ] } } }, "2026-11-09T22:30:00Z");
  app.auth("admin");
  await tick();
  assert.deepEqual(app.nodes.overviewSchedule.children.map((line) => line.textContent), [
    "Tuesday — saved schedule", "No program currently scheduled.",
    "Upcoming: 7:30 AM — Breakfast", "Upcoming: 8:00 PM — Evening"
  ]);
  app.data["settings/programSchedule"].days.Tuesday = [{ time: "bad", title: "Bad" }];
  app.refresh();
  await tick();
  assert.match(app.nodes.overviewSchedule.textContent, /invalid/);
  app.data["settings/programSchedule"] = new Error("offline");
  app.refresh();
  await tick();
  assert.match(app.nodes.overviewStream.textContent, /Unavailable/);
  assert.match(app.nodes.overviewSchedule.textContent, /Unavailable/);
});

test("moderators never load overview and late responses cannot leak across sign-out", async () => {
  let resolveShows;
  const pending = new Promise((resolve) => { resolveShows = resolve; });
  const app = setup({ shows: pending });
  app.auth("moderator");
  app.tab("overview");
  await tick();
  assert.equal(app.calls.length, 0);
  app.auth("editor");
  await tick();
  app.auth(null);
  resolveShows({ docs: [{ data: () => ({}) }] });
  await tick();
  assert.equal(app.nodes.overviewShows.textContent, "Loading...");
});

test("inquiry management includes older new inquiries and places them first", async () => {
  const nodes = {};
  function element() {
    return {
      value: "", style: {}, children: [], listeners: {},
      addEventListener(type, fn) { this.listeners[type] = fn; },
      setAttribute() {},
      append(...children) { this.children.push(...children); },
      appendChild(child) { this.children.push(child); },
      replaceChildren() { this.children = []; }
    };
  }
  const document = {
    getElementById(id) { return nodes[id] ||= element(); },
    createElement: element,
    querySelectorAll: () => [],
    addEventListener(type, fn) { if (type === "DOMContentLoaded") this.ready = fn; }
  };
  const docs = Array.from({ length: 51 }, (_, index) => ({
    data: () => ({ organization: `Request ${index}`, format: "digital", status: index === 50 ? "new" : "contacted" })
  }));
  const firestore = () => ({
    collection() { return { orderBy() { return { get: async () => ({ docs, empty: false }) }; } }; }
  });
  const window = { firebase: { firestore, auth() {} } };
  const context = vm.createContext({ window, document, console });
  vm.runInContext(fs.readFileSync(path.join(root, "admin-ops.js"), "utf8"), context);
  document.ready();
  nodes.refreshAdBookingsButton.listeners.click();
  await tick();
  assert.equal(nodes.adBookingList.children.length, 51);
  assert.equal(nodes.adBookingList.children[0].children[0].textContent, "Request 50 — digital");
});
