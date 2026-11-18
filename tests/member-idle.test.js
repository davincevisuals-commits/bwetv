const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "member-idle.js"), "utf8");

function createHarness(storage = new Map()) {
  let now = 1_000_000;
  let checkIdle;
  let authChanged;
  const events = {};
  const errors = [];
  let signOuts = 0;
  const auth = {
    currentUser: null,
    onAuthStateChanged(callback) { authChanged = callback; },
    async signOut() { signOuts++; }
  };
  class Clock extends Date {
    static now() { return now; }
  }
  vm.runInNewContext(source, {
    window: {
      firebase: { auth: () => auth },
      addEventListener(name, callback) { events[name] = callback; }
    },
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value)
    },
    Date: Clock,
    setInterval(callback) { checkIdle = callback; },
    console: { error: (...args) => errors.push(args) }
  });
  return {
    auth, events, checkIdle, errors,
    signIn(user) { auth.currentUser = user; authChanged(user); },
    advance(ms) { now += ms; },
    get signOuts() { return signOuts; }
  };
}

test("members are signed out after 30 minutes without activity", () => {
  const h = createHarness();
  h.signIn({ uid: "member", isAnonymous: false });
  h.advance(30 * 60 * 1000);
  h.checkIdle();
  assert.equal(h.signOuts, 0);
  h.advance(60 * 1000);
  h.checkIdle();
  assert.equal(h.signOuts, 1);
});

test("activity from another tab extends the session and guests are not signed out", () => {
  const storage = new Map();
  const first = createHarness(storage);
  const second = createHarness(storage);
  first.signIn({ uid: "member", isAnonymous: false });
  first.advance(29 * 60 * 1000);
  second.advance(29 * 60 * 1000);
  second.events.keydown();
  first.advance(2 * 60 * 1000);
  first.checkIdle();
  assert.equal(first.signOuts, 0);
  first.signIn({ uid: "guest", isAnonymous: true });
  first.advance(31 * 60 * 1000);
  first.checkIdle();
  assert.equal(first.signOuts, 0);
});
