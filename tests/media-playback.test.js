const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "..", "media-playback.js"), "utf8");

function setup({ youtube = false } = {}) {
  const listeners = {};
  const media = [];
  const iframes = [];
  const players = new Map();
  const button = {
    textContent: "", attributes: {}, addEventListener(type, handler) { this[type] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; }
  };
  const prime = {
    firstChild: null,
    appendChild(child) { this.firstChild = child; },
    replaceChildren() { this.firstChild = null; }
  };
  const document = {
    body: {},
    head: { appendChild() {} },
    getElementById(id) { return id === "primeRadioPlayer" ? prime : id === "primeRadioToggle" ? button : null; },
    querySelector() { return youtube ? {} : null; },
    querySelectorAll(selector) { return selector === "audio, video" ? media : iframes.filter((iframe) => iframe.isConnected); },
    addEventListener(type, handler) { listeners[type] = handler; },
    createElement() { return { setAttribute() {} }; }
  };
  let mutation;
  class MutationObserver {
    constructor(callback) { mutation = callback; }
    observe() {}
  }
  const window = {
    YT: {
      PlayerState: { PLAYING: 1 },
      Player: function (iframe, options) {
        this.paused = 0;
        this.destroyed = false;
        this.pauseVideo = () => { this.paused++; };
        this.destroy = () => { this.destroyed = true; };
        this.getPlayerState = () => -1;
        this.events = options.events;
        players.set(iframe, this);
      }
    }
  };
  vm.runInNewContext(source, { document, window, MutationObserver, console });
  function audio(tagName = "AUDIO", muted = false) {
    const node = {
      tagName, muted, paused: true,
      pause() { this.paused = true; },
      play() { this.paused = false; listeners.play({ target: this }); }
    };
    media.push(node);
    return node;
  }
  return { audio, button, prime, iframes, players, window, mutation: () => mutation() };
}

test("starting a radio or live video pauses other audible media and closes Prime", () => {
  const app = setup();
  const first = app.audio();
  const second = app.audio();
  const live = app.audio("VIDEO");
  const decoration = app.audio("VIDEO", true);
  first.play();
  decoration.play();
  second.play();
  assert.equal(first.paused, true);
  assert.equal(decoration.paused, false);
  app.button.click();
  assert.equal(second.paused, true);
  assert.equal(app.button.attributes["aria-expanded"], "true");
  assert.ok(app.prime.firstChild);
  live.play();
  assert.equal(app.prime.firstChild, null);
  assert.equal(app.button.attributes["aria-expanded"], "false");
  second.play();
  assert.equal(live.paused, true);
  assert.equal(app.window.BWEMediaPlayback.isActive(live), false);
});

test("starting a YouTube player pauses other players, including dynamically added ones", () => {
  const app = setup({ youtube: true });
  const first = { isConnected: true };
  const second = { isConnected: true };
  app.iframes.push(first, second);
  app.window.onYouTubeIframeAPIReady();
  const firstPlayer = app.players.get(first);
  const secondPlayer = app.players.get(second);
  firstPlayer.events.onReady({ target: firstPlayer });
  secondPlayer.events.onReady({ target: secondPlayer });
  firstPlayer.events.onStateChange({ data: 1 });
  assert.equal(secondPlayer.paused, 1);
  secondPlayer.events.onStateChange({ data: 1 });
  assert.equal(firstPlayer.paused, 1);
  const third = { isConnected: true };
  app.iframes.push(third);
  app.mutation();
  const thirdPlayer = app.players.get(third);
  thirdPlayer.getPlayerState = () => 1;
  thirdPlayer.events.onReady({ target: thirdPlayer });
  assert.equal(firstPlayer.paused, 2);
  assert.equal(secondPlayer.paused, 2);
  first.isConnected = false;
  app.mutation();
  assert.equal(firstPlayer.destroyed, true);
  firstPlayer.events.onStateChange({ data: 1 });
  assert.equal(secondPlayer.paused, 2);
});
