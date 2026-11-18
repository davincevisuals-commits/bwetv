(function () {
  'use strict';

  if (window.initializeFirebase) window.initializeFirebase();

  let auth;
  try {
    auth = window.firebase.auth();
  } catch (error) {
    console.error('BWE member idle sign-out error:', error);
    return;
  }

  const IDLE_LIMIT_MS = 30 * 60 * 1000;
  const ACTIVITY_KEY = 'bwetv-last-activity';
  const readActivity = () => {
    try { return Number(localStorage.getItem(ACTIVITY_KEY)) || 0; } catch (error) { return 0; }
  };
  const markActivity = () => {
    try { localStorage.setItem(ACTIVITY_KEY, String(Date.now())); } catch (error) {}
  };
  const signOutIfIdle = () => {
    const user = auth.currentUser;
    const last = readActivity();
    if (user && !user.isAnonymous && last && Date.now() - last > IDLE_LIMIT_MS) {
      auth.signOut().catch((error) => console.error('BWE member idle sign-out error:', error));
    }
  };
  let lastMark = 0;
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach((eventName) => {
    window.addEventListener(eventName, () => {
      const now = Date.now();
      if (now - lastMark < 15000) return;
      lastMark = now;
      markActivity();
    }, { passive: true });
  });
  setInterval(signOutIfIdle, 60000);

  auth.onAuthStateChanged((user) => {
    if (user && !user.isAnonymous) {
      const signedInAt = Date.parse(user.metadata && user.metadata.lastSignInTime) || 0;
      if (Date.now() - signedInAt < 60000) markActivity();
      signOutIfIdle();
      if (auth.currentUser && !readActivity()) markActivity();
    }
  });
})();
