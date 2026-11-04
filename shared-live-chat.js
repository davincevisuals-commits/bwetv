(function () {
  const DEFAULT_CHAT_PATH = 'channels/live-chat/messages';
  const DEFAULT_LIMIT = 50;
  const DEFAULT_MAX_LENGTH = 260;

  function getStoredName() {
    try {
      const saved = localStorage.getItem('bwetv-chat-name');
      if (saved) return saved;
    } catch (error) {}

    const name = 'Guest' + String(Math.random()).toString().slice(2, 6);
    try {
      localStorage.setItem('bwetv-chat-name', name);
    } catch (error) {}
    return name;
  }

  function getStoredUserId() {
    try {
      const saved = localStorage.getItem('bwetv-chat-user');
      if (saved) return saved;
    } catch (error) {}

    const id = 'guest-' + Date.now() + Math.random().toString(16).slice(2, 8);
    try {
      localStorage.setItem('bwetv-chat-user', id);
    } catch (error) {}
    return id;
  }

  function normalizeMessage(text) {
    return String(text || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  }

  function formatTime(ts) {
    const timestamp = Number(ts) || Date.now();
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function buildMessageNode(message, userName, userId) {
    const row = document.createElement('div');
    const isMe = message.user === userName || message.userId === userId;
    row.className = 'mb-3 flex ' + (isMe ? 'justify-end' : 'justify-start');

    const bubble = document.createElement('div');
    bubble.className = 'max-w-[85%] rounded-xl border px-3 py-2 shadow-sm ' + (
      isMe ? 'border-red-200 bg-red-600 text-white' : 'border-gray-200 bg-white text-gray-900'
    );

    const meta = document.createElement('div');
    meta.className = 'mb-1 text-[11px] font-medium ' + (isMe ? 'text-red-100' : 'text-gray-500');
    meta.textContent = (message.user || message.author || 'Guest') + ' • ' + formatTime(message.timestamp || Date.now());

    const body = document.createElement('div');
    body.className = 'text-sm whitespace-pre-wrap break-words';
    body.textContent = message.text || '';

    bubble.appendChild(meta);
    bubble.appendChild(body);
    row.appendChild(bubble);
    return row;
  }

  function isNearBottom(element) {
    return element.scrollHeight - element.scrollTop - element.clientHeight < 80;
  }

  function setupSharedChat(options = {}) {
    const chatContainer = document.getElementById(options.chatContainerId || 'liveChat');
    const chatInput = document.getElementById(options.chatInputId || 'chatInput');
    const chatButton = document.getElementById(options.chatButtonId || 'chatBtn');
    const chatStatus = document.getElementById(options.chatStatusId || 'chatStatus');
    const chatForm = document.getElementById(options.chatFormId || 'chatForm');
    const chatPath = options.chatPath || DEFAULT_CHAT_PATH;
    const maxLength = options.maxLength || DEFAULT_MAX_LENGTH;
    const limit = options.limit || DEFAULT_LIMIT;

    if (!chatContainer || !chatInput || !chatButton || !chatStatus) {
      return null;
    }

    const userName = getStoredName();
    const userId = getStoredUserId();

    function setStatus(message, isError = false) {
      chatStatus.textContent = message;
      chatStatus.style.color = isError ? '#fca5a5' : '#d6c9a8';
    }

    function updateButtonState() {
      const value = normalizeMessage(chatInput.value);
      chatButton.disabled = !value || value.length > maxLength;
    }

    const renderedMessages = new Map();

    function showEmptyState() {
      if (renderedMessages.size) return;
      const emptyState = document.createElement('div');
      emptyState.dataset.chatEmpty = 'true';
      emptyState.className = 'rounded-lg bg-white p-4 text-sm text-gray-600 shadow-sm';
      emptyState.textContent = 'No messages yet. Start the conversation.';
      chatContainer.replaceChildren(emptyState);
    }

    function addMessage(snapshot) {
      const message = snapshot.val();
      if (!message || typeof message !== 'object' || renderedMessages.has(snapshot.key)) return;

      const shouldScroll = isNearBottom(chatContainer);
      if (!renderedMessages.size) chatContainer.replaceChildren();

      const node = buildMessageNode(message, userName, userId);
      renderedMessages.set(snapshot.key, node);
      chatContainer.appendChild(node);

      if (shouldScroll) chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function removeMessage(snapshot) {
      const node = renderedMessages.get(snapshot.key);
      if (!node) return;

      node.remove();
      renderedMessages.delete(snapshot.key);
      showEmptyState();
    }

    function getDatabase() {
      if (window.initializeFirebase) {
        window.initializeFirebase();
      }
      if (window.firebase && window.firebase.database) {
        return window.firebase.database();
      }
      return null;
    }

    function getAuth() {
      if (window.initializeFirebase) {
        window.initializeFirebase();
      }
      if (window.firebase && window.firebase.auth) {
        return window.firebase.auth();
      }
      return null;
    }

    const db = getDatabase();
    const auth = getAuth();
    if (!db) {
      setStatus('Live chat unavailable: Firebase database is not loaded.', true);
      return null;
    }

    const ensureAuthenticated = () => {
      if (!auth) {
        return Promise.resolve();
      }
      if (auth.currentUser) {
        return Promise.resolve(auth.currentUser);
      }
      return auth.signInAnonymously().catch((error) => {
        console.error('BWE chat auth error:', error);
        setStatus('Live chat is blocked by Firebase auth rules. Enable anonymous auth and allow chat read/write access.', true);
        throw error;
      });
    };

    const messagesRef = db.ref(chatPath);
    const chatRef = messagesRef.limitToLast(limit);
    const connectionRef = db.ref('.info/connected');
    const updateConnectionStatus = (snapshot) => {
      setStatus(snapshot.val() ? 'Connected' : 'Connecting...');
    };

    if (auth) {
      auth.onAuthStateChanged((user) => {
        if (!user) {
          ensureAuthenticated().catch(() => {});
        }
      });
    }

    showEmptyState();
    chatRef.on('child_added', addMessage);
    chatRef.on('child_removed', removeMessage);
    connectionRef.on('value', updateConnectionStatus);

    function sendMessage() {
      const text = normalizeMessage(chatInput.value);
      if (!text || text.length > maxLength) {
        return;
      }

      const payload = {
        text,
        user: userName,
        author: userName,
        userId,
        timestamp: Date.now()
      };

      setStatus('Sending...');
      chatButton.disabled = true;

      ensureAuthenticated()
        .then(() => messagesRef.push(payload))
        .then(() => {
          chatInput.value = '';
          updateButtonState();
          setStatus('Connected');
        })
        .catch((error) => {
          console.error('BWE chat send error:', error);
          setStatus('Send failed. Please ensure Firebase auth is enabled and the chat rules allow access.', true);
          updateButtonState();
        });
    }

    chatInput.addEventListener('input', updateButtonState);
    chatButton.addEventListener('click', (event) => {
      event.preventDefault();
      sendMessage();
    });
    if (chatForm) {
      chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        sendMessage();
      });
    }
    chatInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });

    updateButtonState();
    setStatus('Connecting...');

    window.addEventListener('beforeunload', () => {
      try {
        chatRef.off('child_added', addMessage);
        chatRef.off('child_removed', removeMessage);
        connectionRef.off('value', updateConnectionStatus);
      } catch (error) {}
    });

    ensureAuthenticated().catch(() => {});

    return { chatRef, messagesRef, sendMessage };
  }

  window.BWELiveChat = { init: setupSharedChat };
})();
