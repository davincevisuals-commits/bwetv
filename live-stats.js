(function () {
  'use strict';

  const viewerCount = document.getElementById('live-viewer-count');
  const communityCount = document.getElementById('community-member-count');
  const visitCount = document.getElementById('site-visit-count');
  const status = document.getElementById('live-stats-status');
  const player = document.getElementById('livePlayer');
  const communityPage = Boolean(document.getElementById('communitySection'));
  if (!viewerCount && !visitCount && !communityPage) return;

  function setStatus(message, isError) {
    if (!status) return;
    status.textContent = message;
    status.dataset.state = isError ? 'error' : 'ready';
  }

  function handleError(error) {
    console.error('BWE live stats error:', error);
    setStatus('Live stats are temporarily unavailable.', true);
  }

  function countViewerSessions(snapshot) {
    let count = 0;
    snapshot.forEach((userSnapshot) => {
      userSnapshot.forEach((sessionSnapshot) => {
        if (sessionSnapshot.val() === true) count += 1;
      });
    });
    viewerCount.textContent = String(count);
  }

  function countCommunityMembers(snapshot) {
    let count = 0;
    snapshot.forEach((userSnapshot) => {
      if (userSnapshot.hasChildren()) count += 1;
    });
    communityCount.textContent = String(count);
  }

  // Deferred scripts run before the page's DOMContentLoaded handler initializes Firebase.
  if (window.initializeFirebase) window.initializeFirebase();

  let auth, db;
  try {
    auth = window.firebase.auth();
    db = window.firebase.database();
  } catch (error) {
    handleError(error);
    return;
  }
  const viewerRef = viewerCount ? db.ref('presence/viewers') : null;
  const communityRef = communityCount ? db.ref('presence/community') : null;
  const viewerTracker = createPresenceTracker(db, 'viewers', handleError);
  const communityTracker = createPresenceTracker(db, 'community', handleError);

  const visitsRef = db.ref('stats/visits');
  if (visitCount) {
    visitsRef.on('value', (snapshot) => {
      visitCount.textContent = Number(snapshot.val() || 0).toLocaleString();
    }, handleError);
  }

  // Count one visit per browser session, once Firebase has an authenticated user.
  let visitRecorded = false;
  function recordVisit() {
    if (visitRecorded) return;
    try {
      if (sessionStorage.getItem('bwetv-visit-counted')) { visitRecorded = true; return; }
    } catch (error) {}
    visitRecorded = true;
    visitsRef.transaction((current) => (Number(current) || 0) + 1).then((result) => {
      if (!result.committed) { visitRecorded = false; return; }
      try { sessionStorage.setItem('bwetv-visit-counted', '1'); } catch (error) {}
    }).catch((error) => { visitRecorded = false; handleError(error); });
  }

  if (viewerRef) viewerRef.on('value', countViewerSessions, handleError);
  if (communityRef) communityRef.on('value', countCommunityMembers, handleError);

  db.ref('.info/connected').on('value', (snapshot) => {
    const connected = snapshot.val() === true;
    viewerTracker.setConnected(connected);
    communityTracker.setConnected(connected);
    setStatus(connected ? 'Live stats update in real time.' : 'Reconnecting to live stats…', !connected);
  }, handleError);

  // Sign members out after a period of inactivity (shared across tabs via localStorage).
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
      auth.signOut().catch(handleError);
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
    if (user) recordVisit();
    else if (visitCount) auth.signInAnonymously().catch(handleError);
    viewerTracker.setUser(user && viewerCount ? user.uid : null);
    const memberId = user && !user.isAnonymous ? user.uid : null;
    communityTracker.setActive(Boolean(memberId));
    communityTracker.setUser(memberId);
  });

  if (player) {
    player.addEventListener('playing', () => {
      viewerTracker.setActive(true);
    });
    ['pause', 'ended', 'error', 'emptied'].forEach((eventName) => {
      player.addEventListener(eventName, () => viewerTracker.setActive(false));
    });
  }

  function createPresenceTracker(database, category, onError) {
    const state = { userId: null, ref: null, active: false, connected: false };
    let updates = Promise.resolve();

    function enqueueSync() {
      const currentRef = state.ref;
      if (!currentRef) return;

      updates = updates.then(async () => {
        if (!state.connected) return;
        if (currentRef !== state.ref || !state.active) {
          await currentRef.onDisconnect().cancel();
          await currentRef.remove();
          return;
        }

        await currentRef.onDisconnect().remove();
        if (currentRef !== state.ref || !state.connected || !state.active) {
          await currentRef.onDisconnect().cancel();
          await currentRef.remove();
          return;
        }
        await currentRef.set(true);
      }).catch(onError);
    }

    return {
      setUser(userId) {
        if (state.userId === userId) return;
        const previousRef = state.ref;
        state.userId = userId;
        state.ref = userId ? database.ref(`presence/${category}/${userId}`).push() : null;
        if (previousRef) {
          updates = updates.then(async () => {
            if (!state.connected) return;
            await previousRef.onDisconnect().cancel();
            await previousRef.remove();
          }).catch(onError);
        }
        enqueueSync();
      },
      setActive(active) {
        if (state.active === active) return;
        state.active = active;
        enqueueSync();
      },
      setConnected(connected) {
        if (state.connected === connected) return;
        state.connected = connected;
        enqueueSync();
      }
    };
  }
})();
