/* Keep published Firestore episodes attached to their matching show cards,
   including when search, category filters, or sorting redraw the catalog. */
(() => {
  "use strict";

  const firebaseConfig = {
    apiKey: "AIzaSyCg9fxgrXlEuKW_m5MvDnG26Uf6lLdiYik",
    authDomain: "bwetv-ug.firebaseapp.com",
    projectId: "bwetv-ug",
    storageBucket: "bwetv-ug.firebasestorage.app",
    messagingSenderId: "481870926362",
    appId: "1:481870926362:web:f406a0f135449ccfaa77a3"
  };

  const aliases = {
    "morning-rise": ["morning-rise", "morning rise"],
    "community-news": ["community-news", "community news"],
    "cultural-roots": ["cultural-roots", "cultural roots"],
    "wellness-warriors": ["wellness-warriors", "wellness warriors"],
    "youth-voices": ["youth-voices", "youth voices"],
    "entertainment-express": ["entertainment-express", "entertainment express"],
    "business-update": ["business-update", "business update"],
    "education-corner": ["education-corner", "education corner"]
  };

  let publishedEpisodes = [];

  function slug(value) {
    return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function timestamp(value) {
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (value.seconds) return value.seconds * 1000;
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  function youtubeId(episode) {
    if (episode.videoId) return String(episode.videoId).trim();
    const match = String(episode.videoUrl || "").match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
    return match ? match[1] : "";
  }

  function episodeMatchesShow(episode, showName) {
    const showSlug = slug(showName);
    const accepted = new Set([showSlug, ...(aliases[showSlug] || []).map(slug)]);
    const references = [episode.showId, episode.show, episode.showName, episode.showTitle, episode.program]
      .filter(Boolean)
      .map(slug);
    return references.some((reference) => accepted.has(reference));
  }

  function createEpisodeSection(showName, episodes) {
    const section = document.createElement("section");
    section.className = "show-episodes mt-5 border-t border-gray-200 pt-4";

    const heading = document.createElement("h4");
    heading.className = "mb-3 text-lg font-bold text-gray-900";
    heading.textContent = "Published episodes";
    section.appendChild(heading);

    if (!episodes.length) {
      const empty = document.createElement("p");
      empty.className = "text-sm text-gray-500";
      empty.textContent = "No recent episodes yet.";
      section.appendChild(empty);
      return section;
    }

    episodes.slice(0, 3).forEach((episode) => {
      const item = document.createElement("article");
      item.className = "mb-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50";
      const title = String(episode.title || "Untitled episode");
      const id = youtubeId(episode);

      if (id) {
        const link = document.createElement("a");
        link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        const image = document.createElement("img");
        image.src = `https://img.youtube.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`;
        image.alt = title;
        image.loading = "lazy";
        image.className = "h-28 w-full object-cover";
        link.appendChild(image);
        item.appendChild(link);
      }

      const details = document.createElement("div");
      details.className = "p-3";
      const number = document.createElement("p");
      number.className = "text-[10px] font-bold uppercase tracking-[0.2em] text-red-600";
      number.textContent = episode.episodeNumber ? `E${episode.episodeNumber}` : "Episode";
      const titleNode = document.createElement("h5");
      titleNode.className = "mt-1 text-sm font-bold text-gray-900";
      titleNode.textContent = title;
      details.append(number, titleNode);

      const published = timestamp(episode.publishedAt || episode.createdAt);
      if (published) {
        const date = document.createElement("p");
        date.className = "mt-1 text-xs text-gray-500";
        date.textContent = new Date(published).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric" });
        details.appendChild(date);
      }
      if (id) {
        const watch = document.createElement("a");
        watch.href = `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`;
        watch.target = "_blank";
        watch.rel = "noopener noreferrer";
        watch.className = "mt-2 inline-block text-sm font-semibold text-red-600 hover:underline";
        watch.textContent = "Watch episode";
        details.appendChild(watch);
      }
      item.appendChild(details);
      section.appendChild(item);
    });

    return section;
  }

  function renderLinkedEpisodes() {
    const container = document.getElementById("showsContainer");
    if (!container) return;

    container.querySelectorAll(".show-card").forEach((card) => {
      const heading = card.querySelector("h3");
      if (!heading) return;
      const showName = heading.textContent.trim();
      const matches = publishedEpisodes
        .filter((episode) => episodeMatchesShow(episode, showName))
        .sort((a, b) => timestamp(b.publishedAt || b.createdAt) - timestamp(a.publishedAt || a.createdAt));

      const previous = card.querySelector(".show-episodes");
      if (previous) previous.remove();
      card.appendChild(createEpisodeSection(showName, matches));
    });
  }

  async function loadPublishedEpisodes() {
    if (!window.firebase || typeof window.firebase.firestore !== "function") return;

    try {
      if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
      const snapshot = await window.firebase.firestore()
        .collection("episodes")
        .where("status", "==", "published")
        .limit(50)
        .get();
      publishedEpisodes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderLinkedEpisodes();
    } catch (error) {
      console.error("Unable to load episodes for the show catalog.", error);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("showsContainer");
    if (!container) return;

    const observer = new MutationObserver(renderLinkedEpisodes);
    observer.observe(container, { childList: true });
    loadPublishedEpisodes();
  });
})();
