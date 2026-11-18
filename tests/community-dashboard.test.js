const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup() {
  const nodes = new Map();
  function node(id) {
    if (!nodes.has(id)) nodes.set(id, {
      textContent: '', value: '', classList: { add() {}, remove() {}, toggle() {} },
      attributes: {}, listeners: {}, children: [],
      addEventListener(type, fn) { this.listeners[type] = fn; },
      setAttribute(key, value) { this.attributes[key] = value; },
      appendChild(child) { this.children.push(child); },
      append(...children) { this.children.push(...children); },
      getAttribute() { return ''; }
    });
    return nodes.get(id);
  }
  const document = {
    getElementById: node, querySelectorAll: () => [],
    createElement: () => node(Symbol())
  };
  let authChanged, snapshot, snapshotError;
  const auth = { onAuthStateChanged(fn) { authChanged = fn; } };
  const db = { collection(name) {
    if (name === 'profiles') return { doc: () => ({ get: () => Promise.resolve({ exists: false }) }) };
    return { orderBy: () => ({ limit: () => ({ onSnapshot(success, error) {
      snapshot = success; snapshotError = error; return () => {};
    } }) }) };
  } };
  const firebase = { apps: [{}], auth: () => auth, firestore: () => db };
  const context = {
    document, window: { firebase }, firebase, console,
    sessionStorage: { getItem: () => null, removeItem() {} },
    localStorage: { getItem: () => null },
    location: { pathname: '/community.html' }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../community.js'), 'utf8'), context);
  return { node, authChanged: (user) => authChanged(user), snapshot: (posts) => snapshot({ docs: posts.map((post) => ({ id: post.id, data: () => post })) }), snapshotError: () => snapshotError() };
}

test('my posts filters the live feed by user and resets after sign-out', () => {
  const app = setup();
  app.authChanged({ uid: 'a', displayName: 'Alice', isAnonymous: false });
  app.snapshot([{ id: '1', userId: 'a', name: 'Alice', text: 'Mine' }, { id: '2', userId: 'b', name: 'Bob', text: 'Other' }]);
  const posts = app.node('postsContainer');
  posts.children = [];
  app.node('myPostsBtn').listeners.click();
  assert.equal(posts.children.length, 1);
  assert.equal(posts.children[0].children[1].textContent, 'Mine');
  assert.equal(app.node('myPostsBtn').attributes['aria-pressed'], 'true');
  assert.match(app.node('postsFilterInfo').textContent, /latest 50/);
  app.authChanged(null);
  app.authChanged({ uid: 'b', displayName: 'Bob', isAnonymous: false });
  posts.children = [];
  app.snapshot([{ id: '2', userId: 'b', name: 'Bob', text: 'Other' }]);
  assert.equal(app.node('allPostsBtn').attributes['aria-pressed'], 'true');
});

test('post feed failures are disclosed rather than shown as an empty community', () => {
  const app = setup();
  app.authChanged({ uid: 'a', isAnonymous: false });
  app.snapshotError();
  assert.match(app.node('postsFilterInfo').textContent, /Could not load community posts/);
});
