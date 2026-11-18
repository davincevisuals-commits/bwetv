const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

test("chat signs in as a guest after a member signs out", async () => {
  const callbacks = [];
  const sent = [];
  const member = { uid: "member", isAnonymous: false };
  const guest = { uid: "guest", isAnonymous: true };
  const auth = {
    currentUser: member,
    onAuthStateChanged(callback) {
      callbacks.push(callback);
      return () => {};
    },
    async signInAnonymously() {
      this.currentUser = guest;
      callbacks.forEach((callback) => callback(guest));
      return { user: guest };
    }
  };
  const query = { on() {}, off() {} };
  const messages = {
    limitToLast: () => query,
    async push(message) { sent.push(message); }
  };
  const elements = {
    liveChat: { replaceChildren() {} },
    chatInput: { value: "Hello", addEventListener() {} },
    chatBtn: { addEventListener() {} },
    chatStatus: { style: {} }
  };
  const window = {
    firebase: {
      auth: () => auth,
      database: () => ({ ref: (name) => name === ".info/connected" ? query : messages })
    },
    addEventListener() {}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "..", "shared-live-chat.js"), "utf8"), {
    window,
    document: {
      getElementById: (id) => elements[id] || null,
      createElement: () => ({ dataset: {} })
    },
    localStorage: { getItem: () => null, setItem() {} },
    console
  });
  const chat = window.BWELiveChat.init();
  callbacks.forEach((callback) => callback(member));
  await new Promise((resolve) => setImmediate(resolve));
  auth.currentUser = null;
  callbacks.slice(1).forEach((callback) => callback(null));
  await new Promise((resolve) => setImmediate(resolve));
  chat.sendMessage();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(sent.length, 1);
  assert.equal(sent[0].uid, "guest");
});
