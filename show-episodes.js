/* Render published Firestore episodes beneath their matching show cards. */
(function () {
  "use strict";

  const firebaseConfig = {
    apiKey: "AIzaSyCg9fxgrXlEuKW_m5MvDnG26Uf6lLdiYik",
    authDomain: "bwetv-ug.firebaseapp.com",
    projectId: "bwetv-ug",
    storageBucket: "bwetv-ug.firebasestorage.app",
    messagingSenderId: "481870926362",
    appId: "1:481870926362:web:f406a0f135449ccfaa77a3"
  };

  const firebaseScripts = [
    "https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore-compat.js"
  ];

  const showAliases = {
    "morning-rise": ["morning-rise", "morning rise"],
    "cultural-roots": ["cultural-roots", "cultural roots"],
    "wellness-warriors": ["wellness-warriors", "wellness warriors"],
    "youth-voices": ["youth-voices", "youth voices"],
    "entertainment-express": ["entertainment-express", "entertainment express"],
    "business-update": ["business-update", "business update"],
    "community-news": ["community-news", "community news"]
  };

  function escapeText(value) {
    return String(value ?? "").replace(/[&<>\'\"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[character]));
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (window.firebase) return resolve();
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function ensureFirebase() {
    for (const src of firebaseScripts) {
      if (!window.firebase || typeof window.firebase.firestore !== "function") {
        await loadScript(src);
      }
    }
    if (!window.firebase) throw new Error("Firebase SDK could not be loaded");
    if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
    return window.firebase.firestore();
  }

  function youtubeId(episode) {
    if (episode.videoId) return String(episode.videoId).trim();
    const match = String(episode.videoUrl || "").match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
    );
    return match ? match[1] : "";
  }

  function key(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function timestamp(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (value.seconds) return value.seconds * 1000;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function dateText(value) {
    const time = timestamp(value);
    return time ? new Date(time).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric" }) : "";
  }

  function renderEpisodes(card, showName, episodes) {
    if (!episodes.length) return;
    const section = document.createElement("section");
    section.className = "show-episodes mt-5 border-t border-gray-200 pt-4";
    section.innerHTML = `<h4 class="mb-3 text-lg font-bold text-gray-900">Episodes</h4>`;

    episodes.forEach((episode) => {
      const id = youtubeId(episode);
      const title = episode.title || "Untitled episode";
      const number = [episode.seasonNumber ? `S${episode.seasonNumber}` : "", episode.episodeNumber ? `E${episode.episodeNumber}` : ""].filter(Boolean).join("");
      const watchUrl = id ? `https://www.youtube.com/watch?v=${encodeURIComponent(id)}` : "";
      const item = document.createElement("article");
      item.className = "mb-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50";
      item.innerHTML = `
        ${id ? `<a href="${escapeText(watchUrl)}" target="_blank" rel="noopener noreferrer"><img src="https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg" alt="${escapeText(title)}" class="h-36 w-full object-cover" loading="lazy"></a>` : ""}
        <div class="p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-red-600">${escapeText(number || showName)}</p>
          <h5 class="font-bold text-gray-900">${escapeText(title)}</h5>
          ${dateText(episode.publishedAt) ? `<p class="mt-1 text-xs text-gray-500">Published ${escapeText(dateText(episode.publishedAt))}</p>` : ""}
          ${id ? `<a href="${escapeText(watchUrl)}" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block text-sm font-semibold text-red-600 hover:underline">Watch episode on YouTube →</a>` : ""}
        </div>`;
      section.appendChild(item);
    });
    card.appendChild(section);
  }

  function createMissingShowCard(container, showName, episodes) {
    const card = document.createElement("article");
    card.className = "show-card relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm";
    card.innerHTML = `
      <span class="mb-4 inline-flex rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">News</span>
      <div class="mb-4 text-4xl" aria-hidden="true">📰</div>
      <h3 class="mb-2 text-2xl font-bold text-gray-900">${escapeText(showName)}</h3>
      <p class="mb-4 text-sm text-gray-600">Community news and local updates from Bweyale and Kiryandongo.</p>
    `;
    renderEpisodes(card, showName, episodes);
    container.appendChild(card);
  }

  async function loadShowEpisodes() {
    const container = document.getElementById("showsContainer");
    if (!container) return;

    try {
      const db = await ensureFirebase();
      const snapshot = await db.collection("episodes").where("status", "==", "published").limit(50).get();
      const episodes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const usedKeys = new Set();

      container.querySelectorAll("article.show-card").forEach((card) => {
        const heading = card.querySelector("h3");
        const showName = heading ? heading.textContent.trim() : "";
        const showKey = key(showName);
        usedKeys.add(showKey);
        const aliases = showAliases[showKey] || [showKey, showName.toLowerCase()];
        const matching = episodes.filter((episode) => {
          const episodeShow = String(episode.showId || episode.show || "").trim().toLowerCase();
          return aliases.includes(episodeShow) || key(episodeShow) === showKey;
        }).sort((a, b) => timestamp(b.publishedAt) - timestamp(a.publishedAt));
        renderEpisodes(card, showName, matching);
      });

      const unmatched = {};
      episodes.forEach((episode) => {
        const episodeKey = key(episode.showId || episode.show);
        if (episodeKey && !usedKeys.has(episodeKey)) {
          if (!unmatched[episodeKey]) unmatched[episodeKey] = [];
          unmatched[episodeKey].push(episode);
        }
      });

      Object.entries(unmatched).forEach(([episodeKey, items]) => {
        const showName = episodeKey === "community-news" ? "Community News" : (items[0].showId || "More Episodes");
        createMissingShowCard(container, showName, items.sort((a, b) => timestamp(b.publishedAt) - timestamp(a.publishedAt)));
      });
    } catch (error) {
      console.error("Unable to load show episodes.", error);
    }
  }

  function start() {
    window.setTimeout(loadShowEpisodes, 100);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
