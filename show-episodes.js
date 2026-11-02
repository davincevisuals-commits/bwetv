const SHOWS = [
  { id: "morning-rise", name: "Morning Rise", category: "News", host: "Moses & Lydia", description: "A bright and uplifting morning mix of local news, weather, devotions, and district updates.", rating: 4.9, episodes: 26, icon: "☀️", accent: "from-amber-100 to-orange-100" },
  { id: "community-news", name: "Community News", category: "News", host: "BWE Reporting Team", description: "The latest district stories, public notices, and community updates from Bweyale and Kiryandongo.", rating: 4.8, episodes: 31, icon: "📰", accent: "from-red-100 to-rose-100" },
  { id: "cultural-roots", name: "Cultural Roots", category: "Culture", host: "Teddy Achen", description: "Traditional music, heritage stories, and cultural conversations that keep local identity alive.", rating: 4.7, episodes: 18, icon: "🎶", accent: "from-violet-100 to-fuchsia-100" },
  { id: "wellness-warriors", name: "Wellness Warriors", category: "Health", host: "BWE Health Desk", description: "Healthy habits, family care, and practical wellness advice for everyday life in the community.", rating: 4.7, episodes: 15, icon: "💪", accent: "from-emerald-100 to-green-100" },
  { id: "youth-voices", name: "Youth Voices", category: "Culture", host: "Young Presenters", description: "A lively platform for youth talent, ideas, challenges, and fresh voices from the district.", rating: 4.6, episodes: 20, icon: "🎤", accent: "from-sky-100 to-cyan-100" },
  { id: "entertainment-express", name: "Entertainment Express", category: "Entertainment", host: "BWE Studio", description: "Music, lifestyle, and feel-good entertainment that connects audiences with local fun and culture.", rating: 4.8, episodes: 22, icon: "🎧", accent: "from-pink-100 to-rose-100" },
  { id: "business-update", name: "Business Update", category: "Business", host: "Market Watch", description: "Economic opportunities, market trends, and local business stories that help communities grow.", rating: 4.5, episodes: 17, icon: "📈", accent: "from-blue-100 to-indigo-100" },
  { id: "education-corner", name: "Education Corner", category: "Education", host: "School & Learning Desk", description: "Learning resources, school stories, and opportunities for students, parents, and communities.", rating: 4.6, episodes: 13, icon: "📚", accent: "from-yellow-100 to-orange-100" }
];

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
  "community-news": ["community-news", "community news"],
  "cultural-roots": ["cultural-roots", "cultural roots"],
  "wellness-warriors": ["wellness-warriors", "wellness warriors"],
  "youth-voices": ["youth-voices", "youth voices"],
  "entertainment-express": ["entertainment-express", "entertainment express"],
  "business-update": ["business-update", "business update"],
  "education-corner": ["education-corner", "education corner"]
};

const showCatalogState = {
  searchQuery: "",
  category: "All",
  sortBy: "rating"
};

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeSlug(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function getFilteredShows() {
  const query = normalizeText(showCatalogState.searchQuery);
  return SHOWS.filter((show) => {
    const matchesCategory = showCatalogState.category === "All" || show.category === showCatalogState.category;
    const haystack = `${show.name} ${show.host} ${show.description} ${show.category}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesCategory && matchesQuery;
  });
}

function sortShowsList(items) {
  const list = [...items];
  if (showCatalogState.sortBy === "name") return list.sort((a, b) => a.name.localeCompare(b.name));
  if (showCatalogState.sortBy === "episodes") return list.sort((a, b) => b.episodes - a.episodes);
  return list.sort((a, b) => b.rating - a.rating);
}

function createShowCard(show) {
  return `
    <article class="show-card overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div class="bg-gradient-to-br ${show.accent} p-6">
        <div class="mb-3 text-4xl" aria-hidden="true">${show.icon}</div>
        <div class="flex items-center justify-between gap-3">
          <span class="rounded-full bg-white/80 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-800">${show.category}</span>
          <span class="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">★ ${show.rating.toFixed(1)}</span>
        </div>
      </div>
      <div class="p-5">
        <div class="mb-3 flex items-start justify-between gap-3">
          <h3 class="text-2xl font-bold text-gray-900">${show.name}</h3>
          <span class="rounded-full border border-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-600">${show.episodes} eps</span>
        </div>
        <p class="mb-3 text-sm font-semibold text-red-600">Hosted by ${show.host}</p>
        <p class="mb-4 text-sm leading-6 text-gray-700">${show.description}</p>
        <div class="flex flex-wrap gap-2">
          <a href="schedule.html" class="btn btn-primary text-sm">Watch schedule</a>
          <button type="button" class="btn btn-secondary text-sm" data-show-id="${show.id}">Quick view</button>
        </div>
      </div>
    </article>
  `;
}

function renderShowCatalog() {
  const container = document.getElementById("showsContainer");
  const resultsInfo = document.getElementById("resultsInfo");
  const noResults = document.getElementById("noResults");

  if (!container || !resultsInfo || !noResults) return;

  const filtered = sortShowsList(getFilteredShows());
  container.innerHTML = filtered.map(createShowCard).join("");

  const quickViewButtons = container.querySelectorAll("[data-show-id]");
  quickViewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const showId = button.getAttribute("data-show-id");
      const selected = SHOWS.find((show) => show.id === showId);
      if (!selected) return;
      alert(`${selected.name}\nHost: ${selected.host}\nCategory: ${selected.category}\nRating: ${selected.rating.toFixed(1)}/5\n${selected.description}`);
    });
  });

  resultsInfo.textContent = `${filtered.length} show${filtered.length === 1 ? "" : "s"} found`;
  noResults.classList.toggle("hidden", filtered.length > 0);
}

function updateCategoryButtons() {
  document.querySelectorAll(".category-filter").forEach((button) => {
    const label = button.textContent.trim();
    const active = label === showCatalogState.category;
    button.classList.toggle("active", active);
    button.classList.toggle("btn-primary", active);
    button.classList.toggle("btn-secondary", !active);
  });
}

function filterByCategory(event, category) {
  showCatalogState.category = category;
  updateCategoryButtons();
  renderShowCatalog();
}

function sortShows() {
  const select = document.getElementById("sortSelect");
  if (!select) return;
  showCatalogState.sortBy = select.value;
  renderShowCatalog();
}

function setupShowCatalog() {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      showCatalogState.searchQuery = event.target.value;
      renderShowCatalog();
    });
  }

  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    sortSelect.addEventListener("change", sortShows);
  }

  updateCategoryButtons();
  renderShowCatalog();
}

function getYouTubeId(episode) {
  if (episode.videoId) return String(episode.videoId).trim();
  const match = String(episode.videoUrl || "").match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return match ? match[1] : "";
}

function toEpoch(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value && value.seconds) return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatEpisodeDate(value) {
  const stamp = toEpoch(value);
  return stamp ? new Date(stamp).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric" }) : "";
}

function buildEpisodesHtml(episodes) {
  if (!episodes || !episodes.length) {
    return `<p class="mt-3 text-sm text-gray-500">No recent episodes yet.</p>`;
  }

  return episodes.slice(0, 3).map((episode) => {
    const videoId = getYouTubeId(episode);
    const title = episode.title || "Untitled episode";
    const date = formatEpisodeDate(episode.publishedAt || episode.createdAt);
    const watchUrl = videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : "#";

    return `
      <div class="mb-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        ${videoId ? `<a href="${watchUrl}" target="_blank" rel="noopener noreferrer"><img src="https://img.youtube.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg" alt="${title}" class="h-28 w-full object-cover" /></a>` : ""}
        <div class="p-3">
          <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">${episode.episodeNumber ? `E${episode.episodeNumber}` : "Episode"}</p>
          <h4 class="mt-1 text-sm font-bold text-gray-900">${title}</h4>
          ${date ? `<p class="mt-1 text-xs text-gray-500">${date}</p>` : ""}
          ${videoId ? `<a href="${watchUrl}" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block text-sm font-semibold text-red-600 hover:underline">Watch episode</a>` : ""}
        </div>
      </div>
    `;
  }).join("");
}

async function loadRealEpisodes() {
  const container = document.getElementById("showsContainer");
  if (!container) return;

  const hasFirebase = window.firebase && typeof window.firebase.firestore === "function";
  if (!hasFirebase) {
    renderShowCatalog();
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
      const rawShow = episode.showId || episode.show || episode.title || "";
      const slug = normalizeSlug(rawShow) || normalizeSlug(episode.title || "community-news");
      const group = slug || "community-news";
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(episode);
    });

    const cards = [...container.querySelectorAll(".show-card")];
    cards.forEach((card) => {
      const heading = card.querySelector("h3");
      const name = heading ? heading.textContent.trim() : "";
      const slug = normalizeSlug(name);
      const aliases = showAliases[slug] || [slug, name.toLowerCase()];
      const matched = Object.entries(grouped)
        .filter(([group]) => aliases.includes(group) || group === slug)
        .flatMap(([, items]) => items)
        .sort((a, b) => toEpoch(b.publishedAt || b.createdAt) - toEpoch(a.publishedAt || a.createdAt));

      const section = document.createElement("section");
      section.className = "show-episodes mt-5 border-t border-gray-200 pt-4";
      section.innerHTML = `<h4 class="mb-3 text-lg font-bold text-gray-900">Episodes</h4>${buildEpisodesHtml(matched)}`;
      const existing = card.querySelector(".show-episodes");
      if (existing) existing.remove();
      card.appendChild(section);
    });

    const resultsInfo = document.getElementById("resultsInfo");
    if (resultsInfo) {
      resultsInfo.textContent = `${SHOWS.length} shows available`;
    }
  } catch (error) {
    console.error("Unable to load real episodes.", error);
    renderShowCatalog();
  }
}

window.filterByCategory = filterByCategory;
window.sortShows = sortShows;

document.addEventListener("DOMContentLoaded", () => {
  setupShowCatalog();
  loadRealEpisodes();
});
