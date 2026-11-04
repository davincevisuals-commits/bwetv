(function () {
  'use strict';
  const PAYPAL_EMAIL = 'oyoovincentoyoo1725@gmail.com';
  const MOMO_NUMBER = '+256 (0) 774231123';
  const MOMO_DIAL = '0774231123';
  const MAX_POST = 500;
  const POST_COOLDOWN_MS = 15000;
  const POSTS_KEY = 'bwetv-community-posts';
  const $ = (id) => document.getElementById(id);

  const el = {
    loginSection: $('loginSection'), communitySection: $('communitySection'),
    email: $('emailInput'), password: $('passwordInput'), status: $('communityStatus'),
    loginBtn: $('loginBtn'), signupBtn: $('signupBtn'), anonBtn: $('anonBtn'), signOutBtn: $('signOutBtn'),
    resetBtn: $('resetBtn'), togglePw: $('togglePassword'),
    viewer: $('currentViewer'), nameInput: $('profileNameInput'),
    postInput: $('postInput'), postBtn: $('postBtn'), postStatus: $('postStatus'), counter: $('postCounter'),
    posts: $('postsContainer'), preview: $('profilePreview'), pic: $('profilePicInput'),
    newsletterForm: $('newsletterForm'), newsletterStatus: $('newsletterStatus'),
    paypal: $('donatePaypalBtn'), momo: $('donateMtnBtn')
  };

  const config = {
    apiKey: 'AIzaSyCg9fxgrXlEuKW_m5MvDnG26Uf6lLdiYik',
    authDomain: 'bwetv-ug.firebaseapp.com',
    projectId: 'bwetv-ug'
  };

  let auth = null, db = null, currentUser = null, lastPostAt = 0, unsubscribe = null;
  try {
    if (window.firebase) {
      if (!firebase.apps.length) firebase.initializeApp(config);
      auth = firebase.auth();
      db = firebase.firestore();
    }
  } catch (e) { auth = null; db = null; }

  function setStatus(msg, isError) {
    el.status.textContent = msg;
    el.status.className = 'mt-4 text-sm ' + (isError ? 'text-red-600' : 'text-gray-600');
  }

  function friendlyError(e) {
    const map = {
      'auth/invalid-email': 'That email address is not valid.',
      'auth/user-not-found': 'No account found for that email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/invalid-credential': 'Incorrect email or password.',
      'auth/email-already-in-use': 'An account with that email already exists.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.'
    };
    return map[e && e.code] || 'Something went wrong. Please try again.';
  }

  function showCommunity(user) {
    currentUser = user;
    const name = user.displayName || (user.email ? user.email.split('@')[0] : 'Guest');
    el.viewer.textContent = name;
    el.nameInput.value = name;
    loadProfilePhoto(user);
    el.loginSection.classList.add('hidden');
    el.communitySection.classList.remove('hidden');
    startPosts();
  }

  function showLogin() {
    currentUser = null;
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    el.loginSection.classList.remove('hidden');
    el.communitySection.classList.add('hidden');
  }

  function loadProfilePhoto(user) {
    if (!db || !user || user.uid === 'local') return;
    db.collection('profiles').doc(user.uid).get().then((d) => {
      if (d.exists && d.data().photoData) el.preview.src = d.data().photoData;
    }).catch(() => {});
  }

  // Resize to a small square JPEG so it fits in a Firestore document.
  function resizeImage(file, size) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = c.height = size;
        const side = Math.min(img.width, img.height);
        c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
      img.src = url;
    });
  }

  function formatTime(ts) {
    const d = ts && ts.toDate ? ts.toDate() : (ts ? new Date(ts) : null);
    return d && !isNaN(d) ? d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  }

  function renderPosts(posts) {
    el.posts.textContent = '';
    if (!posts.length) {
      const empty = document.createElement('div');
      empty.className = 'rounded border border-dashed border-gray-300 p-4 text-sm text-gray-500';
      empty.textContent = 'No community posts yet. Start the conversation.';
      el.posts.appendChild(empty);
      return;
    }
    posts.forEach((post) => {
      const card = document.createElement('div');
      card.className = 'rounded border border-gray-200 bg-gray-50 p-4';
      const head = document.createElement('div');
      head.className = 'mb-1 flex items-center justify-between gap-3';
      const name = document.createElement('strong');
      name.className = 'text-gray-900';
      name.textContent = post.name || 'Guest';
      const right = document.createElement('span');
      right.className = 'flex items-center gap-3 text-xs text-gray-500';
      const time = document.createElement('span');
      time.textContent = formatTime(post.createdAt);
      right.appendChild(time);
      if (currentUser && post.userId === currentUser.uid) {
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'font-semibold text-red-600';
        del.textContent = 'Delete';
        del.setAttribute('aria-label', 'Delete your post');
        del.addEventListener('click', () => deletePost(post));
        right.appendChild(del);
      }
      head.append(name, right);
      const body = document.createElement('p');
      body.className = 'whitespace-pre-wrap text-gray-800';
      body.textContent = post.text || '';
      card.append(head, body);
      el.posts.appendChild(card);
    });
  }

  function localPosts() {
    try { return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]'); } catch (e) { return []; }
  }

  function startPosts() {
    if (unsubscribe) { unsubscribe(); unsubscribe = null; }
    if (!db) { renderPosts(localPosts().slice().reverse()); return; }
    unsubscribe = db.collection('posts').orderBy('createdAt', 'desc').limit(50).onSnapshot(
      (snap) => renderPosts(snap.docs.map((d) => Object.assign({ id: d.id }, d.data()))),
      () => { el.postStatus.textContent = 'Could not load posts right now.'; renderPosts(localPosts().slice().reverse()); }
    );
  }

  function deletePost(post) {
    if (!db || !post.id) return;
    db.collection('posts').doc(post.id).delete().catch(() => { el.postStatus.textContent = 'Could not delete that post.'; });
  }

  function submitPost() {
    const text = el.postInput.value.trim();
    if (!text) { el.postStatus.textContent = 'Write a quick update before posting.'; return; }
    if (text.length > MAX_POST) { el.postStatus.textContent = 'Posts are limited to ' + MAX_POST + ' characters.'; return; }
    const wait = POST_COOLDOWN_MS - (Date.now() - lastPostAt);
    if (wait > 0) { el.postStatus.textContent = 'Please wait ' + Math.ceil(wait / 1000) + 's before posting again.'; return; }
    const name = el.nameInput.value.trim() || 'Guest';

    if (db && currentUser) {
      el.postBtn.disabled = true;
      db.collection('posts').add({
        userId: currentUser.uid, name, text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        lastPostAt = Date.now();
        el.postInput.value = '';
        updateCounter();
        el.postStatus.textContent = 'Your community update has been posted.';
      }).catch(() => {
        el.postStatus.textContent = 'Could not post. Please try again.';
      }).then(() => { el.postBtn.disabled = false; });
    } else {
      const posts = localPosts();
      posts.push({ name, text, createdAt: Date.now() });
      localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
      lastPostAt = Date.now();
      el.postInput.value = '';
      updateCounter();
      el.postStatus.textContent = 'Posted (saved on this device only).';
      renderPosts(posts.slice().reverse());
    }
  }

  function updateCounter() {
    el.counter.textContent = el.postInput.value.length + '/' + MAX_POST;
  }

  function credentials() {
    return { email: el.email.value.trim(), password: el.password.value };
  }

  el.loginBtn.addEventListener('click', function () {
    const c = credentials();
    if (!c.email || !c.password) { setStatus('Please enter your email and password.', true); return; }
    if (!auth) { setStatus('Sign in is unavailable right now. Try Guest.', true); return; }
    auth.signInWithEmailAndPassword(c.email, c.password)
      .then(() => setStatus('Logged in successfully.'))
      .catch((e) => setStatus(friendlyError(e), true));
  });

  el.signupBtn.addEventListener('click', function () {
    const c = credentials();
    if (!c.email || c.password.length < 6) {
      setStatus('Create an account with a valid email and password of at least 6 characters.', true);
      return;
    }
    if (!auth) { setStatus('Sign up is unavailable right now. Try Guest.', true); return; }
    auth.createUserWithEmailAndPassword(c.email, c.password)
      .then((cred) => {
        setStatus('Account created successfully.');
        if (cred.user.sendEmailVerification) cred.user.sendEmailVerification().catch(() => {});
      })
      .catch((e) => setStatus(friendlyError(e), true));
  });

  el.anonBtn.addEventListener('click', function () {
    if (!auth) { showCommunity({ uid: 'local', displayName: 'Guest' }); return; }
    try { sessionStorage.setItem('bwetv-community-guest', '1'); } catch (e) {}
    auth.signInAnonymously()
      .then((cred) => { setStatus('You are now browsing as a guest.'); if (cred && cred.user) showCommunity(cred.user); })
      .catch(() => showCommunity({ uid: 'local', displayName: 'Guest' }));
  });

  el.resetBtn.addEventListener('click', function () {
    const email = el.email.value.trim();
    if (!email) { setStatus('Enter your email above, then click Forgot password.', true); return; }
    if (!auth) { setStatus('Password reset is unavailable right now.', true); return; }
    auth.sendPasswordResetEmail(email)
      .then(() => setStatus('Password reset email sent. Check your inbox.'))
      .catch((e) => setStatus(friendlyError(e), true));
  });

  el.togglePw.addEventListener('click', function () {
    const show = el.password.type === 'password';
    el.password.type = show ? 'text' : 'password';
    el.togglePw.textContent = show ? 'Hide' : 'Show';
    el.togglePw.setAttribute('aria-pressed', String(show));
  });

  [el.email, el.password].forEach((i) => i.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.loginBtn.click();
  }));

  el.signOutBtn.addEventListener('click', function () {
    el.email.value = ''; el.password.value = ''; el.postInput.value = '';
    updateCounter();
    if (auth) auth.signOut().catch(() => {});
    showLogin();
    setStatus('You have signed out.');
  });

  el.postBtn.addEventListener('click', submitPost);
  el.postInput.addEventListener('input', updateCounter);

  el.newsletterForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const value = $('newsletterEmail').value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) { el.newsletterStatus.textContent = 'Please enter a valid email address.'; return; }
    if (!db) { el.newsletterStatus.textContent = 'Subscriptions are unavailable right now.'; return; }
    // Email is the document ID, so repeat sign-ups don't create duplicates.
    db.collection('newsletter').doc(value).set({
      email: value,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
      el.newsletterStatus.textContent = 'Thanks! You are subscribed to BWE TV updates.';
      el.newsletterForm.reset();
    }).catch(() => { el.newsletterStatus.textContent = 'Could not subscribe. Please try again later.'; });
  });

  el.paypal.addEventListener('click', function () {
    setStatus('Opening PayPal in a new tab. Thank you for supporting BWE TV!');
    window.open('https://www.paypal.com/donate/?business=' + encodeURIComponent(PAYPAL_EMAIL) + '&item_name=' + encodeURIComponent('Support BWE TV') + '&currency_code=USD', '_blank', 'noopener');
  });

  el.momo.addEventListener('click', function () {
    const box = $('momoDetails');
    box.classList.toggle('hidden');
    setStatus('Send your support via MTN MoMo to ' + MOMO_NUMBER + '.');
  });

  $('copyMomoBtn').addEventListener('click', function () {
    const btn = this;
    const done = () => { btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = 'Copy number'; }, 2000); };
    if (navigator.clipboard) navigator.clipboard.writeText(MOMO_DIAL).then(done).catch(() => {});
  });

  el.pic.addEventListener('change', function (event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    resizeImage(file, 128).then((data) => {
      el.preview.src = data;
      if (db && currentUser && currentUser.uid !== 'local') {
        return db.collection('profiles').doc(currentUser.uid).set({ photoData: data, name: el.nameInput.value.trim() || 'Guest' }, { merge: true });
      }
    }).catch(() => { el.postStatus.textContent = 'Could not save that picture.'; });
  });

  el.nameInput.addEventListener('input', function () {
    const name = el.nameInput.value.trim() || 'Guest';
    el.viewer.textContent = name;
    // Don't persist the placeholder when the field is empty or mid-edit.
    if (!el.nameInput.value.trim()) return;
    if (auth && auth.currentUser && auth.currentUser.updateProfile) {
      auth.currentUser.updateProfile({ displayName: name }).catch(() => {});
    }
  });

  $('mobileMenuBtn').addEventListener('click', function () {
    const nav = $('mobileMenu');
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    nav.classList.toggle('hidden');
  });

  document.querySelectorAll('[data-nav-link]').forEach(function (link) {
    if (link.getAttribute('href') === location.pathname.split('/').pop()) link.classList.add('nav-link-active');
  });

  updateCounter();
  if (auth) {
    auth.onAuthStateChanged((user) => {
      // The live chat page signs in anonymously; only treat it as a guest login if chosen here.
      let chosenGuest = false;
      try { chosenGuest = sessionStorage.getItem('bwetv-community-guest') === '1'; } catch (e) {}
      if (user && (!user.isAnonymous || chosenGuest)) showCommunity(user); else showLogin();
    });
  } else {
    showLogin();
  }
})();
