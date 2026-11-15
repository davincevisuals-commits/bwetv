const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

function createHarness() {
  const operations = [];
  const callbacks = {};
  const playerEvents = {};
  const errors = [];
  let failRemove = false;
  const viewerCount = { textContent: "" };
  const status = { textContent: "", dataset: {} };
  const player = { addEventListener(event, callback) { playerEvents[event] = callback; } };
  const elements = {
    "live-viewer-count": viewerCount,
    "live-stats-status": status,
    livePlayer: player
  };
  const sessionRef = {
    onDisconnect() {
      return {
        async remove() { operations.push("register-disconnect"); },
        async cancel() { operations.push("cancel-disconnect"); }
      };
    },
    async remove() {
      operations.push("remove");
      if (failRemove) throw new Error("remove failed");
    },
    async set(value) { operations.push(`set:${value}`); }
  };
  const db = {
    ref(name) {
      if (name === "presence/viewers/user") return { push: () => sessionRef };
      return {
        on(event, callback) { callbacks[name] = callback; },
        transaction() { throw new Error("Unexpected visit transaction"); }
      };
    }
  };
  const auth = {
    onAuthStateChanged(callback) { callbacks.auth = callback; }
  };
  const context = {
    document: { getElementById: (id) => elements[id] || null },
    window: {
      firebase: { auth: () => auth, database: () => db },
      addEventListener() {}
    },
    console: { error: (...args) => errors.push(args) },
    localStorage: { getItem: () => null, setItem() {} },
    sessionStorage: { getItem: () => "1", setItem() {} },
    setInterval() {}
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, "..", "live-stats.js"), "utf8"),
    context
  );
  return {
    operations, callbacks, playerEvents, errors, viewerCount,
    failRemove() { failRemove = true; }
  };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

async function startPlaying(harness) {
  harness.callbacks.auth({ uid: "user", isAnonymous: true });
  harness.callbacks[".info/connected"]({ val: () => true });
  harness.playerEvents.playing();
  await flush();
}

test("viewer count reflects an empty or populated presence snapshot", () => {
  const h = createHarness();
  h.callbacks["presence/viewers"]({ forEach() {} });
  assert.equal(h.viewerCount.textContent, "0");
  h.callbacks["presence/viewers"]({
    forEach(callback) {
      callback({ forEach(session) {
        session({ val: () => true });
        session({ val: () => true });
        session({ val: () => false });
      } });
    }
  });
  assert.equal(h.viewerCount.textContent, "2");
});

test("pausing removes the session before cancelling disconnect cleanup", async () => {
  const h = createHarness();
  await startPlaying(h);
  assert.ok(h.operations.includes("register-disconnect"));
  assert.equal(h.operations.at(-1), "set:true");
  h.operations.length = 0;
  h.playerEvents.pause();
  await flush();
  assert.deepEqual(h.operations, ["remove", "cancel-disconnect"]);
});

test("a failed removal leaves disconnect cleanup registered", async () => {
  const h = createHarness();
  await startPlaying(h);
  h.operations.length = 0;
  h.failRemove();
  h.playerEvents.pause();
  await flush();
  assert.deepEqual(h.operations, ["remove"]);
  assert.equal(h.errors.length, 1);
});
