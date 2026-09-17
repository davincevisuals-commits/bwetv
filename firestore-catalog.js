/* Firestore-backed episode catalogue for the static GitHub Pages frontend. */
(function () {
  "use strict";

  const config = window.FIREBASE_CONFIG || {
    apiKey: "AIzaSyCg9fxgrXlEuKW_m5MvDnG26Uf6lLdiYik",
    authDomain: "bwetv-ug.firebaseapp.com",
    projectId: "bwetv-ug",
    storageBucket: "bwetv-ug.firebasestorage.app",
    messagingSenderId: "481870926362",
    appId: "1:481870926362:web:f406a0f135449ccfaa77a3",
    databaseURL: "https://bwetv-ug-default-rtdb.firebaseio.com/"
  };

  const container = document.getElementById("episodesContainer");
  const status = document.getElementById("episodeStatus");
  const search = document.getElementById("episodeSearch");
  const showFilter = document.getElementById("showFilter");

  let episodes = [];

  if (!container || !status || !search || !showFilter) {
    console.error("Episode catalogue elements were not found in the page.");
    return;
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
    if (episode.videoId) {
      return String(episode.videoId).trim();
    }

    if (!episode.videoUrl) {
      return "";
    }

    const value = String(episode.videoUrl).trim();

    const match = value.match(
      /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtu\.be\/)([\w-]{11})/
    );

    return match ? match[1] : "";
  }

  function getPublishedTime(episode) {
    const publishedAt = episode.publishedAt;

    if (!publishedAt) {
      return 0;
    }

    if (typeof publishedAt.toMillis === "function") {
      return publishedAt.toMillis();
    }

    if (publishedAt.seconds) {
      return publishedAt.seconds * 1000;
    }

    const parsed = new Date(publishedAt).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function formatPublishedDate(episode) {
    const timestamp = getPublishedTime(episode);

    if (!timestamp) {
      return "";
    }

    return new Date(timestamp).toLocaleDateString("en-UG", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function createEpisodeCard(episode) {
    const youtubeVideoId = getYouTubeId(episode);
    const showId = episode.showId || "BWE TV";
    const title = episode.title || "Untitled episode";
    const description = episode.description || "";
    const season = episode.seasonNumber ? `S${episode.seasonNumber}` : "";
    const number = episode.episodeNumber ? `E${episode.episodeNumber}` : "";
    const episodeNumber = `${season}${number}`.trim();
    const publishedDate = formatPublishedDate(episode);
    const watchUrl = youtubeVideoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeVideoId)}` : "";
    const thumbnailUrl = youtubeVideoId ? `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg` : "";

    const player = youtubeVideoId
      ? `
        <a href="${escapeText(watchUrl)}" target="_blank" rel="noopener noreferrer" class="group relative block overflow-hidden rounded-t-xl bg-black">
          <img
            src="${escapeText(thumbnailUrl)}"
            alt="${escapeText(title)}"
            class="h-56 w-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
          <div class="absolute left-4 top-4 flex items-center gap-2 rounded bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
            <span class="inline-block h-3 w-3 rounded-full bg-white"></span>
            YouTube
          </div>
          <div class="absolute inset-x-0 bottom-0 flex justify-center pb-4">
            <span class="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm">
              Watch on YouTube
            </span>
          </div>
        </a>
      `
      : `
        <div class="flex h-56 items-center justify-center rounded-t-xl bg-gray-900 text-white">
          Video unavailable
        </div>
      `;

    const label = [showId, episodeNumber].filter(Boolean).join(" ");

    return `
      <article class="overflow-hidden rounded-xl bg-white shadow-sm">
        ${player}

        <div class="p-5">
          <p class="text-sm font-semibold text-red-600">
            ${escapeText(label)}
          </p>

          <h2 class="mt-1 text-xl font-bold text-gray-900">
            ${escapeText(title)}
          </h2>

          ${
            description
              ? `<p class="mt-2 text-sm text-gray-600">${escapeText(description)}</p>`
              : ""
          }

          ${
            publishedDate
              ? `<p class="mt-3 text-xs text-gray-500">Published ${escapeText(publishedDate)}</p>`
              : ""
          }
        </div>
      </article>
    `;
  }

  function renderEpisodes() {
    const query = search.value.trim().toLowerCase();
    const selectedShow = showFilter.value.trim().toLowerCase();

    const visibleEpisodes = episodes.filter((episode) => {
      const searchableText = [
        episode.title,
        episode.description,
        episode.showId
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesShow =
        !selectedShow ||
        String(episode.showId || "").toLowerCase() === selectedShow;

      return matchesSearch && matchesShow;
    });

    if (!visibleEpisodes.length) {
      container.innerHTML = `
        <div class="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
          No published episodes match your search.
        </div>
      `;
    } else {
      container.innerHTML = visibleEpisodes
        .map(createEpisodeCard)
        .join("");
    }

    status.textContent =
      `${visibleEpisodes.length} published episode` +
      `${visibleEpisodes.length === 1 ? "" : "s"}`;
  }

  function sortEpisodes() {
    episodes.sort((first, second) => {
      return getPublishedTime(second) - getPublishedTime(first);
    });
  }

  async function loadEpisodes() {
    if (!window.firebase) {
      status.textContent = "Firebase SDK could not be loaded.";
      console.error("window.firebase is unavailable.");
      return;
    }

    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(config);
      }

      const firestore = window.firebase.firestore();

      /*
       * Deliberately do not use orderBy("publishedAt") here.
       * Sorting in JavaScript avoids requiring a composite Firestore index
       * for status + publishedAt.
       */
      const snapshot = await firestore
        .collection("episodes")
        .where("status", "==", "published")
        .limit(50)
        .get();

      episodes = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data()
      }));

      sortEpisodes();

      if (!episodes.length) {
        status.textContent =
          "No published episodes were found in the Firestore episodes collection.";
        container.innerHTML = `
          <div class="rounded-xl bg-white p-6 text-gray-600 shadow-sm">
            No published episodes are available yet.
          </div>
        `;
        return;
      }

      renderEpisodes();
    } catch (error) {
      console.error("Unable to load Firestore episodes.", error);

      const errorCode = error && error.code ? error.code : "unknown-error";
      const errorMessage = error && error.message
        ? error.message
        : "Unknown Firestore error.";

      status.textContent = `Unable to load episodes: ${errorCode}`;

      container.innerHTML = `
        <div class="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
          <h2 class="font-bold">Episode catalogue unavailable</h2>
          <p class="mt-2 text-sm">
            Check the browser console for the complete Firebase error.
          </p>
          <p class="mt-2 break-words text-xs">
            ${escapeText(errorMessage)}
          </p>
        </div>
      `;
    }
  }

  search.addEventListener("input", renderEpisodes);
  showFilter.addEventListener("input", renderEpisodes);

  loadEpisodes();
})();
