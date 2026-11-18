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

test("schedule identifies current and next programs within broadcast hours", () => {
  const morning = runScript("content.js", { Date: dateAt("2026-11-06T04:30:00Z") });
  assert.equal(vm.runInContext("getCurrentProgram(getProgramsForDay('Today')).title", morning), "Morning Rise");
  assert.equal(vm.runInContext("getNextProgram(getProgramsForDay('Today')).title", morning), "Good Morning Kiryandongo");
  const evening = runScript("content.js", { Date: dateAt("2026-11-06T18:00:00Z") });
  assert.equal(vm.runInContext("getCurrentProgram(getProgramsForDay('Today')).title", evening), "Weekend Preview");
});

test("viewer schedule uses the saved lineup and labels tomorrow after today's programs", () => {
  let now = "2026-11-09T18:00:00Z";
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
  }
  const nodes = { viewerProgramNow: {}, viewerProgramNext: {} };
  const document = { getElementById: (id) => nodes[id] || null, querySelectorAll: () => [], addEventListener() {} };
  const context = runScript("content.js", { document, Date: Clock });
  context.window.applyBWESchedule({
    Monday: [
      { time: "21:00", title: "Evening", host: "", summary: "", type: "" },
      { time: "22:00", title: "Late", host: "", summary: "", type: "" }
    ],
    Tuesday: [{ time: "07:30", title: "Tomorrow", host: "", summary: "", type: "" }]
  });
  assert.equal(nodes.viewerProgramNow.textContent, "Evening · 9:00 PM");
  assert.equal(nodes.viewerProgramNext.textContent, "10:00 PM · Late");
  now = "2026-11-09T20:30:00Z";
  vm.runInContext("renderViewerSchedule()", context);
  assert.equal(nodes.viewerProgramNow.textContent, "No program scheduled for this time.");
  assert.equal(nodes.viewerProgramNext.textContent, "Tomorrow, 7:30 AM · Tomorrow");
  context.window.applyBWESchedule({ Tuesday: [] });
  assert.equal(nodes.viewerProgramNext.textContent, "No upcoming program listed.");
});

test("program times display AM and PM while retaining 24-hour schedule values", () => {
  const context = runScript("content.js");
  for (const [time, expected] of [
    ["00:00", "12:00 AM"],
    ["09:00", "9:00 AM"],
    ["12:00", "12:00 PM"],
    ["21:00", "9:00 PM"],
    ["23:30", "11:30 PM"]
  ]) {
    context.time = time;
    assert.equal(vm.runInContext("formatProgramTime(time)", context), expected);
  }
  assert.equal(vm.runInContext("getProgramsForDay('Monday')[0].time", context), "07:30");
});

test("homepage and schedule show AM and PM for saved programs", () => {
  const nodes = {
    "featured-programs": { dataset: {}, innerHTML: "", querySelectorAll: () => [] },
    scheduleContainer: { innerHTML: "" },
    currentShowInfo: { innerHTML: "" },
    weekOverview: { innerHTML: "", querySelectorAll: () => [] }
  };
  const document = {
    getElementById: (id) => nodes[id] || null,
    querySelectorAll: () => [],
    addEventListener() {}
  };
  const context = runScript("content.js", { document, Date: dateAt("2026-11-09T18:00:00Z") });
  context.window.applyBWESchedule({
    Monday: [
      { time: "09:00", title: "Morning", host: "Host", summary: "Morning show", type: "Talk" },
      { time: "21:00", title: "Evening", host: "Host", summary: "Evening show", type: "Talk" }
    ]
  });
  assert.match(nodes["featured-programs"].innerHTML, /9:00 PM/);
  assert.match(nodes.currentShowInfo.innerHTML, /Evening/);
  assert.doesNotMatch(nodes.currentShowInfo.innerHTML, /Morning/);
  assert.match(nodes.scheduleContainer.innerHTML, /9:00 AM/);
  assert.match(nodes.scheduleContainer.innerHTML, /9:00 PM/);
  assert.match(nodes.weekOverview.innerHTML, /9:00 AM/);
});

test("every default lineup runs from 07:30 to 23:30 and has an evening program at 21:00", () => {
  const context = runScript("content.js");
  vm.runInContext(`
    for (const day of DAYS_OF_WEEK) {
      const programs = getProgramsForDay(day);
      if (getProgramWindow(programs, 0).start !== 450) throw new Error(day + ' starts late');
      if (getProgramWindow(programs, programs.length - 1).end !== 1410) throw new Error(day + ' ends early');
      for (let minute = 450; minute < 1410; minute += 1) {
        if (!programs.some((_, index) => getProgramStatus(programs, index, minute) === 'live')) {
          throw new Error(day + ' has a gap at ' + minute);
        }
      }
      if (!programs.some((program, index) => getProgramStatus(programs, index, 1260) === 'live' && !/breakfast|morning/i.test(program.title))) {
        throw new Error(day + ' has no evening program at 21:00');
      }
    }
  `, context);
});

test("broadcast boundaries and sparse saved schedules never extend breakfast into the evening", () => {
  for (const [iso, expected] of [
    ["2026-11-09T04:29:00Z", null],
    ["2026-11-09T04:30:00Z", "Bweyale Breakfast"],
    ["2026-11-09T20:29:00Z", "Cultural Roots"],
    ["2026-11-09T20:30:00Z", null]
  ]) {
    const context = runScript("content.js", { Date: dateAt(iso) });
    assert.equal(vm.runInContext("getCurrentProgram(getProgramsForDay('Today'))?.title || null", context), expected);
  }
  const context = runScript("content.js", { Date: dateAt("2026-11-09T18:00:00Z") });
  vm.runInContext(`PROGRAM_DATA.Monday = [
    { time: "07:30", title: "Bweyale Breakfast" },
    { time: "22:00", title: "Late show" }
  ]`, context);
  assert.equal(vm.runInContext("getCurrentProgram(getProgramsForDay('Today'))", context), null);
  assert.equal(vm.runInContext("getNextProgram(getProgramsForDay('Today')).title", context), "Late show");
  assert.equal(vm.runInContext("pickFeaturedPrograms(getProgramsForDay('Today'), 1260, 3)[0].program.title", context), "Late show");
  vm.runInContext(`PROGRAM_DATA.Tuesday = [{ time: "23:30", title: "Outside hours" }]`, context);
  assert.equal(vm.runInContext("pickFeaturedPrograms(PROGRAM_DATA.Tuesday, -1, 3).length", context), 0);
});

test("admin can load estimated slots without saving or changing stream status", () => {
  const nodes = new Map();
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {
      value: "", checked: false, listeners: {},
      addEventListener(type, handler) { this.listeners[type] = handler; }
    });
    return nodes.get(id);
  }
  const document = {
    getElementById: node,
    addEventListener(type, handler) { if (type === "DOMContentLoaded") this.ready = handler; }
  };
  let confirmed = false;
  const window = { BWEScheduleDefaults: { Monday: [{ time: "07:30", title: "Breakfast" }] }, firebase: { auth() {} } };
  runScript("admin-content.js", { document, window, confirm: () => confirmed });
  document.ready();
  node("scheduleJsonInput").value = "existing unsaved edits";
  node("streamEnabledInput").checked = false;
  node("loadEstimatedScheduleButton").listeners.click();
  assert.equal(node("scheduleJsonInput").value, "existing unsaved edits");
  confirmed = true;
  node("loadEstimatedScheduleButton").listeners.click();
  assert.deepEqual(JSON.parse(node("scheduleJsonInput").value), window.BWEScheduleDefaults);
  assert.equal(node("streamEnabledInput").checked, false);
  assert.match(node("dashboardStatus").textContent, /Review it and save/);
});

test("live status respects broadcast hours, missing program details, and the manual stream setting", () => {
  let now = "2026-11-09T18:00:00Z";
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
  }
  const label = { dataset: {}, textContent: "" };
  const info = { textContent: "" };
  const document = {
    getElementById: (id) => id === "live-program-label" ? label : id === "live-program-info" ? info : null,
    addEventListener() {}
  };
  const context = runScript("content.js", { document, Date: Clock });
  vm.runInContext("renderLiveProgramStatus()", context);
  assert.equal(label.textContent, "Streaming now");
  assert.match(info.textContent, /^Cultural Roots/);
  vm.runInContext(`PROGRAM_DATA.Monday = [{ time: "07:30", title: "Bweyale Breakfast" }]`, context);
  vm.runInContext("renderLiveProgramStatus()", context);
  assert.equal(info.textContent, "Program details are not available for this time");
  now = "2026-11-09T20:30:00Z";
  vm.runInContext("renderLiveProgramStatus()", context);
  assert.equal(label.textContent, "Outside broadcast hours");
  label.dataset.streamEnabled = "false";
  vm.runInContext("renderLiveProgramStatus()", context);
  assert.equal(label.textContent, "Stream offline");
  assert.equal(info.textContent, "The stream is currently offline");
});

test("homepage identifies tomorrow's programs after the final show ends", () => {
  const container = { dataset: {}, innerHTML: "", querySelectorAll: () => [] };
  const document = { getElementById: (id) => id === "featured-programs" ? container : null, addEventListener() {} };
  const context = runScript("content.js", { document, Date: dateAt("2026-11-15T20:30:00Z") });
  vm.runInContext("renderFeaturedPrograms()", context);
  assert.match(container.innerHTML, /No more programs today\. Coming up tomorrow:/);
  assert.match(container.innerHTML, /Tomorrow, 7:30 AM/);
  assert.match(container.innerHTML, /Bweyale Breakfast/);
  assert.doesNotMatch(container.innerHTML, /On now/);
});

test("schedule page refreshes live status and day when time passes", () => {
  let now = "2026-11-06T18:00:00Z";
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
  }
  const nodes = {
    scheduleContainer: { innerHTML: "" },
    scheduleTitle: { textContent: "" },
    currentShowInfo: { innerHTML: "" }
  };
  const listeners = {};
  const document = {
    hidden: false,
    getElementById: (id) => nodes[id] || null,
    querySelectorAll: () => [],
    addEventListener: (type, handler) => { listeners[type] = handler; }
  };
  let refresh;
  runScript("content.js", { document, Date: Clock, setInterval: (handler) => { refresh = handler; } });
  listeners.DOMContentLoaded();
  assert.match(nodes.currentShowInfo.innerHTML, /Weekend Preview/);
  now = "2026-11-06T20:30:00Z";
  refresh();
  assert.match(nodes.currentShowInfo.innerHTML, /Outside broadcast hours/);
  assert.doesNotMatch(nodes.currentShowInfo.innerHTML, /Weekend Preview/);
  now = "2026-11-06T21:10:00Z";
  listeners.visibilitychange();
  assert.equal(nodes.scheduleTitle.textContent, "Saturday Schedule");
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

test("show cards embed their published episodes and retain YouTube links", async () => {
  function element(tagName) {
    return {
      tagName, children: [], textContent: "", className: "",
      setAttribute() {},
      appendChild(child) { this.children.push(child); },
      append(...children) { this.children.push(...children); }
    };
  }
  const heading = { textContent: "Morning Rise" };
  const card = element("article");
  card.dataset = { showId: "morning-rise" };
  card.querySelector = (selector) => selector === "h3" ? heading : null;
  const container = { querySelectorAll: () => [card] };
  let ready;
  const document = {
    createElement: element,
    getElementById: () => container,
    addEventListener(type, handler) { if (type === "DOMContentLoaded") ready = handler; }
  };
  const records = [
    { showId: "morning-rise", title: "First", videoId: "AbCdEf12345", publishedAt: 4 },
    { showId: "morning-rise", title: "Second", videoUrl: "https://youtu.be/ZyXwVu98765", publishedAt: 3 },
    { showId: "morning-rise", title: "No video", publishedAt: 2 },
    { showId: "morning-rise", title: "Older", videoId: "12345678901", publishedAt: 1 },
    { showId: "another-show", title: "Different show", videoId: "12345678902", publishedAt: 5 }
  ];
  const firebase = {
    apps: [{}],
    firestore: () => ({
      collection: () => ({
        where(field, operator, value) {
          assert.deepEqual([field, operator, value], ["status", "==", "published"]);
          return { get: async () => ({ docs: records.map((record) => ({ data: () => record })) }) };
        }
      })
    })
  };
  class MutationObserver { observe() {} }
  runScript("linked-show-episodes.js", { document, window: { firebase, location: { origin: "https://bwetv.live" } }, MutationObserver });
  ready();
  await new Promise((resolve) => setImmediate(resolve));
  const section = card.children[0];
  assert.equal(section.children.length, 4);
  const [first, second, noVideo] = section.children.slice(1);
  assert.equal(first.children[0].tagName, "iframe");
  assert.equal(first.children[0].src, "https://www.youtube.com/embed/AbCdEf12345?enablejsapi=1&origin=https%3A%2F%2Fbwetv.live");
  assert.equal(first.children[0].title, "First");
  assert.equal(first.children[0].loading, "lazy");
  assert.equal(first.children[0].referrerPolicy, "strict-origin-when-cross-origin");
  assert.equal(first.children[1].children.at(-1).href, "https://www.youtube.com/watch?v=AbCdEf12345");
  assert.equal(second.children[0].src, "https://www.youtube.com/embed/ZyXwVu98765?enablejsapi=1&origin=https%3A%2F%2Fbwetv.live");
  assert.equal(noVideo.children[0].tagName, "div");
});

test("published episodes use a lazy-loaded YouTube embed", async () => {
  const nodes = new Map();
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, {
        value: "", addEventListener() {}, textContent: "", innerHTML: ""
      });
      return nodes.get(id);
    }
  };
  const firebase = {
    apps: [{}],
    firestore() {
      return {
        collection() {
          return {
            where() {
              return {
                async get() {
                  return {
                    docs: [{
                      id: "episode",
                      data: () => ({ videoId: "AbCdEf12345", title: 'Episode "one"' })
                    }]
                  };
                }
              };
            }
          };
        }
      };
    }
  };
  runScript("firestore-catalog.js", { document, window: { firebase, location: { origin: "https://bwetv.live" } } });
  await new Promise((resolve) => setImmediate(resolve));
  const card = nodes.get("episodesContainer").innerHTML;
  assert.match(card, /<iframe/);
  assert.match(card, /src="https:\/\/www\.youtube\.com\/embed\/AbCdEf12345\?enablejsapi=1&amp;origin=https%3A%2F%2Fbwetv\.live"/);
  assert.match(card, /title="Episode &quot;one&quot;"/);
  assert.match(card, /loading="lazy"/);
  assert.doesNotMatch(card, /href="https:\/\/www\.youtube\.com\/watch/);
});

test("home page loads the same HLS-capable player as the schedule", () => {
  assert.match(read("index.html"), /https:\/\/vjs\.zencdn\.net\/7\.20\.3\/video\.min\.js/);
  assert.match(read("schedule.html"), /https:\/\/vjs\.zencdn\.net\/7\.20\.3\/video\.min\.js/);
});

test("homepage download link points to the official Android APK page", () => {
  const homepage = read("index.html");
  assert.match(homepage, /href="download\.html"[^>]*>Download Android app/);
  assert.match(read("download.html"), /releases\/latest\/download\/bwetv-android\.apk/);
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
    addEventListener(type, handler) { if (type === "DOMContentLoaded") this.ready = handler; },
    dispatchEvent() {}
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
  class CustomEvent {
    constructor(type, options) { this.type = type; this.detail = options.detail; }
  }
  runScript("admin.js", { document, window: { firebase }, CustomEvent });
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
