(function () {
  const DEFAULT_CHAT_PATH = "channels/live-chat/messages";
  const DEFAULT_LIMIT = 60;
  const DEFAULT_MAX_LENGTH = 300;

  function formatTime(ts) {
    const time = Number(ts) || Date.now();
    const d = new Date(time);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function getStoredName() {
    try {
      const saved = localStorage.getItem("bwetv-chat-name");
      if (saved) return saved;
    } catch (error) {}

    const name = "Guest" + String(Math.random()).toString().slice(2, 6);
    try {
      localStorage.setItem("bwetv-chat-name", name);
    } catch (error) {}
    return name;
  }

  function getStoredUserId() {
    try {
      const saved = localStorage.getItem("bwetv-chat-user");
      if (saved) return saved;
    } catch (error) {}

    const id = "guest-" + Date.now() + Math.random().toString(16).slice(2, 8);
    try {
      localStorage.setItem("bwetv-chat-user", id);
    } catch (error) {}
    return id;
  }

  function normalizeMessage(text) {
    return String(text || "")
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
      .trim();
  }

  function isNearBottom(el) {
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }

  function initLiveChat(options = {}) {
    const chatContainer = document.getElementById(options.chatContainerId || "liveChat" || "chatMessages" || "chatContainer");
    const chatInput = document.getElementById(options.chatInputId || "chatInput");
    const chatButton = document.getElementById(options.chatButtonId || options.chatBtnId || "chatBtn");
    const chatStatus = document.getElementById(options.chatStatusId || "chatStatus");
    const rtdb = options.rtdb || (window.firebase && window.firebase.database ? window.firebase.database() : null);

    if (!chatContainer || !chatInput || !chatButton || !rtdb) {
      return null;
    }

    const maxLength = options.maxLength || DEFAULT_MAX_LENGTH;
    const chatPath = options.chatPath || DEFAULT_CHAT_PATH;
    const limit = options.limit || DEFAULT_LIMIT;
    const userName = getStoredName();
    const userId = getStoredUserId();
    const roomRef = rtdb.ref(chatPath);
    const messagesRef = roomRef.limitToLast(limit);

    function setStatus(text) {
      if (chatStatus) {
        chatStatus.textContent = text;
      }
    }

    function scrollToBottom() {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function updateButtonState() {
      const value = normalizeMessage(chatInput.value);
      chatButton.disabled = !value || value.length > maxLength;
    }

    function renderMessage(message) {
      if (!message || typeof message !== "object") return;

      const author = message.user || message.author || "Guest";
      const text = message.text || "";
      const timestamp = message.timestamp || Date.now();
      const isMe = author === userName || message.userId === userId;

      const row = document.createElement("div");
      row.className = "mb-3 flex " + (isMe ? "justify-end" : "justify-start");

      const bubble = document.createElement("div");
      bubble.className = "max-w-[85%] rounded-xl border px-3 py-2 shadow-sm " + (
        isMe ? "border-red-200 bg-red-600 text-white" : "border-gray-200 bg-white text-gray-900"
      );

      const meta = document.createElement("div");
      meta.className = "mb-1 text-[11px] font-medium " + (isMe ? "text-red-100" : "text-gray-500");
      meta.textContent = author + " • " + formatTime(timestamp);

      const body = document.createElement("div");
      body.className = "text-sm whitespace-pre-wrap break-words";
      body.textContent = text;

      bubble.appendChild(meta);
      bubble.appendChild(body);
      row.appendChild(bubble);
      chatContainer.appendChild(row);

      if (isNearBottom(chatContainer)) {
        scrollToBottom();
      }
    }

    function sendMessage() {
      const value = normalizeMessage(chatInput.value);
      if (!value || value.length > maxLength) {
        return;
      }

      const payload = {
        text: value,
        user: userName,
        userId,
        timestamp: Date.now()
      };

      setStatus("Sending...");
      chatButton.disabled = true;

      roomRef.push(payload)
        .then(() => {
          chatInput.value = "";
          updateButtonState();
          setStatus("Connected");
          scrollToBottom();
        })
        .catch((error) => {
          console.error("Chat send error:", error);
          setStatus("Send failed. Please try again.");
          updateButtonState();
        });
    }

    function attachExistingMessages() {
      const existingMessages = Array.from(chatContainer.querySelectorAll(".bwe-chat-message"));
      if (existingMessages.length) {
        existingMessages.forEach((node) => node.remove());
      }

      messagesRef.once("value").then((snapshot) => {
        const data = snapshot.val() || {};
        const items = Object.entries(data).sort((a, b) => Number(a[1].timestamp || 0) - Number(b[1].timestamp || 0));
        items.forEach(([_, message]) => renderMessage(message));
        scrollToBottom();
      }).catch(() => {
        setStatus("Connected");
      });
    }

    roomRef.on("value", (snapshot) => {
      const data = snapshot.val() || {};
      const hasMessages = Object.keys(data).length > 0;
      if (!hasMessages) {
        chatContainer.innerHTML = '<div class="rounded-lg bg-white p-4 text-sm text-gray-600 shadow-sm">No messages yet. Start the conversation.</div>';
      }
    });

    messagesRef.on("child_added", (snapshot) => {
      const message = snapshot.val();
      if (!message) return;
      renderMessage(message);
      scrollToBottom();
    });

    chatInput.addEventListener("input", updateButtonState);
    chatButton.addEventListener("click", (event) => {
      event.preventDefault();
      sendMessage();
    });

    chatInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });

    updateButtonState();
    setStatus("Connected");
    attachExistingMessages();

    return {
      sendMessage,
      destroy() {
        roomRef.off();
        messagesRef.off();
      }
    };
  }

  window.BWELiveChat = { init: initLiveChat };
})();
