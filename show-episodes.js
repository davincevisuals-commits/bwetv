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

  const showIds = {
    "Morning Rise": "morning-rise",
    "Cultural Roots": "cultural-roots",
    "Wellness Warriors": "wellness-warriors",
    "Youth Voices": "youth-voices",
    "Entertainment Express": "entertainment-express",
    "Business Update": "business-update"
  };

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
    const url = String(episode.videoUrl || "");
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : "";
  }

  function showKey(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function dateValue(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (value.seconds) return value.seconds * 1000;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function dateText(value) {
    const timestamp = dateValue(value);
    return timestamp
      ? new Date(timestamp).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric" })
      : "";
  }

  function renderEpisodeList(card, showName, episodes) {
    const existing = card.querySelector(".show-episodes");
    if (existing) existing.remove();
    if (!episodes.length) return;

    const section = document.createElement("section");
    section.className = "show-episodes mt-5 border-t border-gray-200 pt-4";
    section.innerHTML = `<h4 class="mb-3 text-lg font-bold text-gray-900">Episodes</h4>`;

    episodes.forEach((episode) => {
      const id = getYouTubeId(episode);
      const title = episode.title || "Untitled episode";
      const label = [episode.seasonNumber ? `S${episode.seasonNumber}` : "", episode.episodeNumber ? `E${episode.episodeNumber}` : ""]
        .filter(Boolean)
        .join("");
      const thumbnail = id ? `https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : "";
      const watchUrl = id ? `https://www.youtube.com/watch?v=${encodeURIComponent(id)}` : "";
      const item = document.createElement("article");
      item.className = "mb-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50";
      item.innerHTML = `
        ${id ? `<a href="${escapeText(watchUrl)}" target="_blank" rel="noopener noreferrer" class="block"><img src="${escapeText(thumbnail)}" alt="${escapeText(title)}" class="h-36 w-full object-cover" loading="lazy"></a>` : ""}
        <div class="p-3">
          <p class="text-xs font-semibold uppercase tracking-wide text-red-600">${escapeText(label || showName)}</p>
          <h5 class="font-bold text-gray-900">${escapeText(title)}</h5>
          ${dateText(episode.publishedAt) ? `<p class="mt-1 text-xs text-gray-500">Published ${escapeText(dateText(episode.publishedAt))}</p>` : ""}
          ${id ? `<a href="${escapeText(watchUrl)}" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block text-sm font-semibold text-red-600 hover:underline">Watch episode on YouTube →</a>` : ""}
        </div>
      `;
      section.appendChild(item);
    });

    card.appendChild(section);
  }

  async function loadShowEpisodes() {
    const container = document.getElementById("showsContainer");
    if (!container || !window.firebase) return;

    try {
      if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
      const snapshot = await window.firebase.firestore()
        .collection("episodes")
        .where("status", "==", "published")
        .limit(50)
        .get();

      const grouped = {};
      snapshot.forEach((document) => {
        const episode = { id: document.id, ...document.data() };
        const key = showKey(episode.showId);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(episode);
      });

      container.querySelectorAll("article.show-card").forEach((card) => {
        const heading = card.querySelector("h3");
        const showName = heading ? heading.textContent.trim() : "";
        const key = showIds[showName] || showKey(showName);
        const episodes = (grouped[key] || []).sort((a, b) => dateValue(b.publishedAt) - dateValue(a.publishedAt));
        renderEpisodeList(card, showName, episodes);
      });
    } catch (error) {
      console.error("Unable to load show episodes.", error);
    }
  }

  function start() {
    // content.js renders the show cards during DOMContentLoaded.
    window.setTimeout(loadShowEpisodes, 0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
