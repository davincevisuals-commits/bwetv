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

  const showAliases = {
    "morning-rise": ["morning-rise", "morning rise"],
    "cultural-roots": ["cultural-roots", "cultural roots"],
    "wellness-warriors": ["wellness-warriors", "wellness warriors"],
    "youth-voices": ["youth-voices", "youth voices"],
    "entertainment-express": ["entertainment-express", "entertainment express"],
    "business-update": ["business-update", "business update"],
    "community-news": ["community-news", "community news"]
  };

  function normalize(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function episodeGroupKey(episode) {
    const explicit = String(episode.showId || episode.show || "").trim();
    if (explicit) return normalize(explicit);

    const title = String(episode.title || "").toLowerCase();
    if (title.includes("community")) return "community-news";

    return "community-news";
  }

  function escapeText(value) {
    return String(value ?? "").replace(/[&<>\'\"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[character]));
  }

  function getYouTubeId(episode) {
    if (episode.videoId) return String(episode.videoId).trim();
    const match = String(episode.videoUrl || "").match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : "";
  }

  function toEpoch(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (value.seconds) return value.seconds * 1000;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function formatDate(value) {
    const timestamp = toEpoch(value);
    return timestamp ? new Date(timestamp).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric" }) : "";
  }

  function renderEpisodeList(card, showName, episodes) {
    if (!episodes.length || card.querySelector(".show-episodes")) return;

    const section = document.createElement("section");
    section.className = "show-episodes mt-5 border-t border-gray-200 pt-4";
    section.innerHTML = `<h4 class="mb-3 text-lg font-bold text-gray-900">Episodes</h4>`;

    episodes.forEach((episode) => {
      const id = getYouTubeId(episode);
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
          ${formatDate(episode.publishedAt) ? `<p class="mt-1 text-xs text-gray-500">Published ${escapeText(formatDate(episode.publishedAt))}</p>` : ""}
          ${id ? `<a href="${escapeText(watchUrl)}" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block text-sm font-semibold text-red-600 hover:underline">Watch episode on YouTube →</a>` : ""}
        </div>
      `;
      section.appendChild(item);
    });

    card.appendChild(section);
  }

  function createMissingShowCard(container, label, episodes) {
    const card = document.createElement("article");
    card.className = "show-card relative overflow-hidden rounded-xl border border-gray-100 bg-white p-6 shadow-sm";
    card.innerHTML = `
      <span class="mb-4 inline-flex rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-600">News</span>
      <div class="mb-4 text-4xl" aria-hidden="true">📰</div>
      <h3 class="mb-2 text-2xl font-bold text-gray-900">${escapeText(label)}</h3>
      <p class="mb-4 text-sm text-gray-600">Community news and local updates from Bweyale and Kiryandongo.</p>
    `;
    renderEpisodeList(card, label, episodes);
    container.appendChild(card);
  }

  async function loadShowEpisodes() {
    const container = document.getElementById("showsContainer");
    if (!container) return;

    if (!window.firebase || typeof window.firebase.firestore !== "function") {
      console.warn("Firebase SDK unavailable; skipping show episodes.");
      return;
    }

    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
      }

      const db = window.firebase.firestore();
      const snapshot = await db.collection("episodes").where("status", "==", "published").limit(50).get();
      const episodes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const grouped = {};

      episodes.forEach((episode) => {
        const key = episodeGroupKey(episode);
        (grouped[key] ||= []).push(episode);
      });

      const rendered = new Set();

      container.querySelectorAll("article.show-card").forEach((card) => {
        const heading = card.querySelector("h3");
        const showName = heading ? heading.textContent.trim() : "";
        const showKey = normalize(showName);
        rendered.add(showKey);

        const aliases = showAliases[showKey] || [showKey, showName.toLowerCase()];
        const matching = Object.entries(grouped)
          .filter(([group]) => aliases.includes(group) || group === showKey)
          .flatMap(([, items]) => items)
          .sort((a, b) => toEpoch(b.publishedAt) - toEpoch(a.publishedAt));

        renderEpisodeList(card, showName, matching);
      });

      Object.entries(grouped).forEach(([group, items]) => {
        if (!rendered.has(group)) {
          const label = group === "community-news" ? "Community News" : (items[0].showId || "More Episodes");
          createMissingShowCard(container, label, items.sort((a, b) => toEpoch(b.publishedAt) - toEpoch(a.publishedAt)));
        }
      });
    } catch (error) {
      console.error("Unable to load show episodes.", error);
    }
  }

  document.addEventListener("DOMContentLoaded", loadShowEpisodes);
})();
