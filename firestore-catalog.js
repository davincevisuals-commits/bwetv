/* Firestore-backed episode catalogue for the static GitHub Pages frontend. */
(function () {
  const fallbackEpisodes = [
    {
      id: "demo-episode",
      showId: "morning-rise",
      seasonNumber: 1,
      episodeNumber: 1,
      title: "Add your first YouTube episode",
      description: "Create an episode document in Firestore and replace the videoId with your YouTube video ID.",
      videoId: "dQw4w9WgXcQ",
      status: "published"
    }
  ];

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

  function escapeText(value) {
    return String(value || "").replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[char]));
  }

  function youtubeId(episode) {
    if (episode.videoId) return episode.videoId;
    const match = String(episode.videoUrl || "").match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
    return match ? match[1] : "";
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    const selectedShow = showFilter.value.trim().toLowerCase();
    const visible = episodes.filter((episode) => {
      const haystack = `${episode.title || ""} ${episode.description || ""} ${episode.showId || ""}`.toLowerCase();
      return (!query || haystack.includes(query)) && (!selectedShow || String(episode.showId || "").toLowerCase() === selectedShow);
    });

    container.innerHTML = visible.map((episode) => {
      const id = youtubeId(episode);
      const player = id
        ? `<div class="aspect-w-16 aspect-h-9 overflow-hidden rounded-t-xl bg-black"><iframe class="h-56 w-full" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}" title="${escapeText(episode.title)}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
        : `<div class="flex h-56 items-center justify-center rounded-t-xl bg-gray-900 text-white">Video unavailable</div>`;
      const season = episode.seasonNumber ? `S${episode.seasonNumber}` : "";
      const number = episode.episodeNumber ? `E${episode.episodeNumber}` : "";
      return `<article class="overflow-hidden rounded-xl bg-white shadow-sm">${player}<div class="p-5"><p class="text-sm font-semibold text-red-600">${escapeText(episode.showId)} ${season}${number}</p><h2 class="mt-1 text-xl font-bold">${escapeText(episode.title)}</h2><p class="mt-2 text-sm text-gray-600">${escapeText(episode.description)}</p></div></article>`;
    }).join("");
    status.textContent = `${visible.length} published episode${visible.length === 1 ? "" : "s"}`;
  }

  async function loadEpisodes() {
    try {
      if (!window.firebase.apps.length) window.firebase.initializeApp(config);
      const snapshot = await window.firebase.firestore().collection("episodes")
        .where("status", "==", "published").orderBy("publishedAt", "desc").limit(50).get();
      episodes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (!episodes.length) episodes = fallbackEpisodes;
    } catch (error) {
      console.error("Unable to load Firestore episodes", error);
      episodes = fallbackEpisodes;
      status.textContent = "Firestore is not available; showing the setup example.";
    }
    render();
  }

  search.addEventListener("input", render);
  showFilter.addEventListener("input", render);
  loadEpisodes();
})();
