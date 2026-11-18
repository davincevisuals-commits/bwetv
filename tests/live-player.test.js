const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

function setup(useVideoJs = true) {
  let now = "2026-11-18T04:29:00Z";
  class Clock extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
  }
  const listeners = {};
  const playerListeners = {};
  const videoListeners = {};
  const retryListeners = {};
  const nodes = {
    container: { hidden: true },
    message: { hidden: false },
    text: { textContent: "" },
    retry: { hidden: true, addEventListener(type, fn) { retryListeners[type] = fn; } },
    label: { dataset: {}, textContent: "" },
    info: { textContent: "" }
  };
  const shell = { querySelector(selector) {
    return {
      "[data-live-player-container]": nodes.container,
      "[data-live-player-message]": nodes.message,
      "[data-live-player-message-text]": nodes.text,
      "[data-live-player-retry]": nodes.retry
    }[selector];
  } };
  const video = {
    children: [], loads: 0, pauses: 0, error: null,
    closest: () => shell,
    addEventListener(type, fn) { videoListeners[type] = fn; },
    replaceChildren(...children) { this.children = children; },
    removeAttribute() {},
    load() { this.loads += 1; },
    pause() { this.pauses += 1; }
  };
  const player = {
    starts: [], resets: 0, pauses: 0, loads: 0,
    on(type, fn) { playerListeners[type] = fn; },
    error(value) { if (arguments.length) return; return { code: 4 }; },
    src(value) { this.starts.push(value); },
    load() { this.loads += 1; },
    pause() { this.pauses += 1; },
    reset() { this.resets += 1; }
  };
  const document = {
    hidden: false,
    querySelector: (selector) => selector === "[data-live-player]" ? video : null,
    querySelectorAll: () => [],
    getElementById: (id) => id === "live-program-label" ? nodes.label : id === "live-program-info" ? nodes.info : null,
    createElement: () => ({}),
    addEventListener(type, fn) { (listeners[type] ||= []).push(fn); }
  };
  const window = {};
  if (useVideoJs) window.videojs = () => player;
  let interval;
  const context = vm.createContext({
    window, document, Date: Clock,
    setInterval(fn) { interval = fn; },
    console: { error() {} }
  });
  vm.runInContext(read("content.js"), context);
  vm.runInContext(read("live-player.js"), context);
  const ready = () => listeners.DOMContentLoaded.at(-1)();
  return { nodes, video, player, window, playerListeners, videoListeners, retryListeners, ready,
    tick(value) { now = value; interval(); },
    visible(value) { now = value; listeners.visibilitychange.at(-1)(); } };
}

for (const page of ["index.html", "schedule.html"]) {
  test(`${page} uses the shared off-air player without preloading a stream`, () => {
    const html = read(page);
    assert.match(html, /data-live-player-container hidden/);
    assert.match(html, /data-live-player-message-text/);
    assert.match(html, /src="live-player\.js\?/);
    const video = html.match(/<video[^>]*data-live-player[^>]*>[\s\S]*?<\/video>/)[0];
    assert.match(video, /preload="none"/);
    assert.doesNotMatch(video, /<source|data-setup/);
  });
}

test("player switches at Kampala broadcast boundaries and respects manual offline", () => {
  const t = setup();
  t.ready();
  assert.match(t.nodes.text.textContent, /off air.*7:30 AM Uganda time/i);
  assert.equal(t.nodes.container.hidden, true);
  assert.equal(t.player.starts.length, 0);
  t.tick("2026-11-18T04:30:00Z");
  assert.equal(t.nodes.container.hidden, false);
  assert.equal(t.nodes.message.hidden, true);
  assert.equal(t.player.starts.length, 1);
  t.tick("2026-11-18T20:30:00Z");
  assert.equal(t.nodes.container.hidden, true);
  assert.match(t.nodes.text.textContent, /off air/i);
  assert.equal(t.player.pauses, 1);
  assert.equal(t.player.resets, 1);
  t.window.BWELivePlayer.setStreamEnabled(false);
  t.visible("2026-11-19T04:30:00Z");
  assert.equal(t.player.starts.length, 1);
  assert.match(t.nodes.text.textContent, /currently offline/);
  t.window.BWELivePlayer.setStreamEnabled(true);
  assert.equal(t.player.starts.length, 2);
});

test("player shows retryable errors and uses updated stream URLs", () => {
  const t = setup();
  t.ready();
  t.window.BWELivePlayer.setStreamUrl("https://example.com/live.m3u8");
  t.tick("2026-11-18T04:30:00Z");
  assert.equal(t.player.starts[0][0].src, "https://example.com/live.m3u8");
  t.playerListeners.error();
  assert.match(t.nodes.text.textContent, /temporarily unavailable/i);
  assert.equal(t.nodes.label.textContent, "Stream unavailable");
  assert.equal(t.nodes.retry.hidden, false);
  t.tick("2026-11-18T05:00:00Z");
  assert.equal(t.player.starts.length, 1);
  t.retryListeners.click();
  assert.equal(t.player.starts.length, 2);
  assert.equal(t.nodes.label.textContent, "Streaming now");
  assert.equal(t.nodes.container.hidden, false);
  t.playerListeners.error();
  t.tick("2026-11-18T20:30:00Z");
  assert.match(t.nodes.text.textContent, /off air/i);
  assert.equal(t.nodes.retry.hidden, true);
});

test("native player handles playback errors and off-air transitions", () => {
  const t = setup(false);
  t.ready();
  t.tick("2026-11-18T04:30:00Z");
  assert.equal(t.video.children[0].src, "https://stream.bwetv.live/hls/bwetv/index.m3u8");
  t.videoListeners.error();
  assert.match(t.nodes.text.textContent, /temporarily unavailable/i);
  t.retryListeners.click();
  assert.equal(t.nodes.container.hidden, false);
  t.tick("2026-11-18T20:30:00Z");
  assert.equal(t.video.children.length, 0);
  assert.match(t.nodes.text.textContent, /off air/i);
});

test("published stream URL and manual offline setting reach the shared player", async () => {
  const calls = [];
  let ready;
  const label = { dataset: {} };
  const document = {
    body: { dataset: {}, hasAttribute: () => false },
    documentElement: { style: { setProperty() {} } },
    querySelector: () => null,
    querySelectorAll: (selector) => selector === ".live-status-bar strong" ? [label] : [],
    addEventListener(type, fn) { if (type === "DOMContentLoaded") ready = fn; }
  };
  const db = {
    collection(name) {
      return { doc(id) {
        if (name === "analytics") return { set: async () => {} };
        const data = id === "site" ? { liveStreamUrl: "https://example.com/live.m3u8" } : { streamEnabled: false };
        return { get: async () => ({ exists: true, data: () => data }) };
      } };
    }
  };
  const window = {
    firebase: { apps: [{}], firestore: () => db },
    BWELivePlayer: {
      setStreamUrl: (url) => calls.push(["url", url]),
      setStreamEnabled: (enabled) => calls.push(["enabled", enabled])
    },
    refreshBWELiveProgramStatus: () => calls.push(["refresh"])
  };
  const context = vm.createContext({ window, document, console, sessionStorage: { getItem: () => null, setItem() {} } });
  vm.runInContext(read("site-content.js"), context);
  ready();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls, [["url", "https://example.com/live.m3u8"], ["enabled", false], ["refresh"]]);
  assert.equal(label.dataset.streamEnabled, "false");
});
