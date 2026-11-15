const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("every page with a mobile menu loads exactly one shared handler", () => {
  for (const file of fs.readdirSync(root).filter((name) => name.endsWith(".html"))) {
    const html = read(file);
    if (!html.includes('id="mobileMenuBtn"')) continue;
    assert.equal((html.match(/src="mobile-menu\.js"/g) || []).length, 1, file);
    assert.doesNotMatch(html, /mobileMenuBtn\.addEventListener/, file);
  }
});

test("mobile menu opens, closes and supports Escape", () => {
  const handlers = {};
  const attributes = { "aria-expanded": "false", "aria-label": "Open navigation menu" };
  const classes = new Set(["hidden"]);
  let focused = false;
  const button = {
    addEventListener: (type, handler) => { handlers[`button:${type}`] = handler; },
    getAttribute: (name) => attributes[name],
    setAttribute: (name, value) => { attributes[name] = value; },
    focus: () => { focused = true; }
  };
  const menu = {
    addEventListener: (type, handler) => { handlers[`menu:${type}`] = handler; },
    classList: { toggle: (name, force) => force ? classes.add(name) : classes.delete(name) }
  };
  vm.runInNewContext(read("mobile-menu.js"), {
    document: { getElementById: (id) => id === "mobileMenuBtn" ? button : menu }
  });

  handlers["button:click"]();
  assert.equal(classes.has("hidden"), false);
  assert.equal(attributes["aria-expanded"], "true");
  assert.equal(attributes["aria-label"], "Close navigation menu");
  handlers["button:click"]();
  assert.equal(classes.has("hidden"), true);
  assert.equal(attributes["aria-expanded"], "false");
  handlers["button:click"]();
  handlers["menu:keydown"]({ key: "Escape" });
  assert.equal(classes.has("hidden"), true);
  assert.equal(attributes["aria-expanded"], "false");
  assert.equal(attributes["aria-label"], "Open navigation menu");
  assert.equal(focused, true);
});
