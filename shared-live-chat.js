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
      chatStatus.style.color = isError ? '#b91c1c' : '#5a4a38';
    }

    function updateButtonState() {
      const value = normalizeMessage(chatInput.value);
      chatButton.disabled = !value || value.length > maxLength;
    }

    function renderMessages(snapshot) {
      const messages = snapshot ? Object.values(snapshot.val() || {}) : [];
      const sorted = messages.sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));

      chatContainer.innerHTML = '';

      if (!sorted.length) {
        chatContainer.innerHTML = '<div class="rounded-lg bg-white p-4 text-sm text-gray-600 shadow-sm">No messages yet. Start the conversation.</div>';
        return;
      }

      sorted.forEach((message) => {
        if (!message || typeof message !== 'object') return;
        chatContainer.appendChild(buildMessageNode(message, userName, userId));
      });

      chatContainer.scrollTop = chatContainer.scrollHeight;
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

    const db = getDatabase();
    if (!db) {
      setStatus('Live chat unavailable: Firebase database is not loaded.', true);
      return null;
    }

    const chatRef = db.ref(chatPath).limitToLast(limit);

    chatRef.on('value', (snapshot) => {
      renderMessages(snapshot);
      setStatus('Connected');
    });

    function sendMessage() {
      const text = normalizeMessage(chatInput.value);
      if (!text || text.length > maxLength) {
        return;
      }

      const payload = {
        text,
        user: userName,
        userId,
        timestamp: Date.now()
      };

      setStatus('Sending...');
      chatButton.disabled = true;

      chatRef.push(payload)
        .then(() => {
          chatInput.value = '';
          updateButtonState();
          setStatus('Connected');
        })
        .catch((error) => {
          console.error('BWE chat send error:', error);
          setStatus('Send failed. Please try again.', true);
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
        chatRef.off('value');
      } catch (error) {}
    });

    return { chatRef, sendMessage };
  }

  window.BWELiveChat = { init: setupSharedChat };
})();
