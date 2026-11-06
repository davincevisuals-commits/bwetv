const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function runScript(file, extra = {}) {
  const context = {
    window: {},
    document: { addEventListener() {} },
    console,
    ...extra
  };
  vm.createContext(context);
  vm.runInContext(read(file), context, { filename: file });
  return context;
}

function dateAt(iso) {
  return class extends Date {
    constructor(...args) {
      super(...(args.length ? args : [iso]));
    }
  };
}

test("schedule uses Kampala's weekday and time regardless of device timezone", () => {
  const context = runScript("content.js", { Date: dateAt("2026-11-06T22:30:00Z") });
  assert.equal(vm.runInContext("getTodayLabel()", context), "Saturday");
  assert.equal(vm.runInContext("getBroadcastTime().minutes", context), 90);
  assert.equal(vm.runInContext("getCurrentProgram(getProgramsForDay('Today'))", context), null);
});

test("schedule identifies current and next programs and does not invent an overnight show", () => {
  const morning = runScript("content.js", { Date: dateAt("2026-11-06T03:30:00Z") });
  assert.equal(vm.runInContext("getCurrentProgram(getProgramsForDay('Today')).title", morning), "Morning Rise");
  assert.equal(vm.runInContext("getNextProgram(getProgramsForDay('Today')).title", morning), "Good Morning Kiryandongo");
  const evening = runScript("content.js", { Date: dateAt("2026-11-06T19:00:00Z") });
  assert.equal(vm.runInContext("getCurrentProgram(getProgramsForDay('Today'))", evening), null);
  assert.equal(vm.runInContext("getNextProgram(getProgramsForDay('Today'))", evening), null);
});

test("the previous day's last program can continue across midnight", () => {
  const context = runScript("content.js", { Date: dateAt("2026-11-06T21:15:00Z") });
  vm.runInContext(`PROGRAM_DATA.Friday = [{ time: "23:30", title: "Late show" }]`, context);
  assert.equal(vm.runInContext("getCurrentProgram(getProgramsForDay('Today')).title", context), "Late show");
});

test("show cards escape text and attributes while retaining the show ID", () => {
  const context = runScript("show-episodes.js");
  context.input = {
    id: 'id" onclick="bad()', name: "<img src=x onerror=bad()>", category: "<b>",
    host: "A & B", description: "<script>bad()</script>", icon: "<", accent: 'red" onclick="bad()',
    rating: 4, episodes: 2
  };
  const card = vm.runInContext("createShowCard(input)", context);
  assert.ok(card.includes('data-show-id="id&quot; onclick=&quot;bad()"'));
  assert.ok(card.includes("&lt;img src=x onerror=bad()&gt;"));
  assert.ok(card.includes("A &amp; B"));
  assert.ok(!card.includes("<script>bad()</script>"));
  assert.ok(!card.includes('class="bg-gradient-to-br red" onclick='));
});

test("home page loads the same HLS-capable player as the schedule", () => {
  assert.match(read("index.html"), /https:\/\/vjs\.zencdn\.net\/7\.20\.3\/video\.min\.js/);
  assert.match(read("schedule.html"), /https:\/\/vjs\.zencdn\.net\/7\.20\.3\/video\.min\.js/);
});

test("episode editor keeps draft and publish controls synchronized", async () => {
  const nodes = new Map();
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {
      value: "", checked: false, textContent: "", innerHTML: "",
      classList: { add() {}, remove() {}, toggle() {} },
      listeners: {}, addEventListener(type, handler) { this.listeners[type] = handler; },
      querySelectorAll() { return []; }, reset() {}
    });
    return nodes.get(id);
  }
  const document = {
    getElementById: node, querySelectorAll() { return []; },
    addEventListener(type, handler) { if (type === "DOMContentLoaded") this.ready = handler; }
  };
  let saved;
  const firestore = () => ({
    collection() {
      return {
        doc() { return { async set(data) { saved = data; } }; },
        orderBy() { return { async get() { return { docs: [] }; } }; }
      };
    }
  });
  firestore.Timestamp = { fromDate: (date) => date };
  firestore.FieldValue = { serverTimestamp: () => "timestamp" };
  const firebase = { apps: [{}], firestore, auth: () => ({ onAuthStateChanged() {} }) };
  runScript("admin.js", { document, window: { firebase } });
  document.ready();
  assert.equal(node("episodeStatusInput").value, "draft");
  assert.equal(node("episodeActiveInput").checked, false);
  node("episodeShowIdInput").value = "show";
  node("episodeTitleInput").value = "Episode";
  await node("episodeForm").listeners.submit({ preventDefault() {} });
  assert.equal(saved.status, "draft");
  node("episodeActiveInput").checked = true;
  node("episodeActiveInput").listeners.change({ target: node("episodeActiveInput") });
  assert.equal(node("episodeStatusInput").value, "published");
  node("episodeStatusInput").value = "draft";
  node("episodeStatusInput").listeners.change({ target: node("episodeStatusInput") });
  assert.equal(node("episodeActiveInput").checked, false);
});

test("admin dashboard allows verified moderators but rejects ordinary accounts", async () => {
  const nodes = new Map();
  function node(id) {
    if (!nodes.has(id)) {
      const classes = new Set(id === "dashboardPanel" ? ["hidden"] : []);
      nodes.set(id, {
        value: "", checked: false, textContent: "", innerHTML: "",
        classList: {
          add(name) { classes.add(name); }, remove(name) { classes.delete(name); },
          toggle(name, force) { if (force) classes.add(name); else classes.delete(name); },
          contains(name) { return classes.has(name); }
        },
        addEventListener() {}, querySelectorAll() { return []; }, reset() {}
      });
    }
    return nodes.get(id);
  }
  const events = [];
  const document = {
    getElementById: node, querySelectorAll() { return []; },
    addEventListener(type, handler) { if (type === "DOMContentLoaded") this.ready = handler; },
    dispatchEvent(event) { events.push(event); }
  };
  let authCallback;
  const auth = { currentUser: null, onAuthStateChanged(callback) { authCallback = callback; } };
  let role = "moderator";
  const firestore = () => ({
    collection() { return { doc() { return { async get() { return { data: () => role ? { role } : undefined }; } }; } }; }
  });
  const firebase = { apps: [{}], firestore, auth: () => auth };
  class CustomEvent {
    constructor(type, options) { this.type = type; this.detail = options.detail; }
  }
  runScript("admin.js", { document, window: { firebase }, CustomEvent });
  document.ready();
  auth.currentUser = { email: "staff@example.com", emailVerified: true };
  await authCallback(auth.currentUser);
  assert.equal(node("dashboardPanel").classList.contains("hidden"), false);
  assert.equal(events.at(-1).detail.role, "moderator");
  role = null;
  auth.currentUser = { email: "viewer@example.com", emailVerified: true };
  await authCallback(auth.currentUser);
  assert.equal(node("dashboardPanel").classList.contains("hidden"), true);
  assert.match(node("loginStatus").textContent, /does not have a staff role/);
});
