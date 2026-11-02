const SHOWS = [
  {
    id: "morning-rise",
    name: "Morning Rise",
    category: "News",
    host: "Moses & Lydia",
    description: "A bright and uplifting morning blend of local news, weather, devotions, and district updates.",
    rating: 4.9,
    episodes: 26,
    icon: "☀️",
    accent: "from-amber-100 to-orange-100",
    slug: "morning-rise"
  },
  {
    id: "community-news",
    name: "Community News",
    category: "News",
    host: "BWE Reporting Team",
    description: "The latest district stories, public notices, and community updates from Bweyale and Kiryandongo.",
    rating: 4.8,
    episodes: 31,
    icon: "📰",
    accent: "from-red-100 to-rose-100",
    slug: "community-news"
  },
  {
    id: "cultural-roots",
    name: "Cultural Roots",
    category: "Culture",
    host: "Teddy Achen",
    description: "Traditional music, heritage stories, and cultural conversations that keep local identity alive.",
    rating: 4.7,
    episodes: 18,
    icon: "🎶",
    accent: "from-violet-100 to-fuchsia-100",
    slug: "cultural-roots"
  },
  {
    id: "wellness-warriors",
    name: "Wellness Warriors",
    category: "Health",
    host: "BWE Health Desk",
    description: "Healthy habits, family care, and practical wellness advice for everyday life in the community.",
    rating: 4.7,
    episodes: 15,
    icon: "💪",
    accent: "from-emerald-100 to-green-100",
    slug: "wellness-warriors"
  },
  {
    id: "youth-voices",
    name: "Youth Voices",
    category: "Culture",
    host: "Young Presenters",
    description: "A lively platform for youth talent, ideas, challenges, and fresh voices from the district.",
    rating: 4.6,
    episodes: 20,
    icon: "🎤",
    accent: "from-sky-100 to-cyan-100",
    slug: "youth-voices"
  },
  {
    id: "entertainment-express",
    name: "Entertainment Express",
    category: "Entertainment",
    host: "BWE Studio",
    description: "Music, lifestyle, and feel-good entertainment that connects audiences with local fun and culture.",
    rating: 4.8,
    episodes: 22,
    icon: "🎧",
    accent: "from-pink-100 to-rose-100",
    slug: "entertainment-express"
  },
  {
    id: "business-update",
    name: "Business Update",
    category: "Business",
    host: "Market Watch",
    description: "Economic opportunities, market trends, and local business stories that help communities grow.",
    rating: 4.5,
    episodes: 17,
    icon: "📈",
    accent: "from-blue-100 to-indigo-100",
    slug: "business-update"
  },
  {
    id: "education-corner",
    name: "Education Corner",
    category: "Education",
    host: "School & Learning Desk",
    description: "Learning resources, school stories, and opportunities for students, parents, and communities.",
    rating: 4.6,
    episodes: 13,
    icon: "📚",
    accent: "from-yellow-100 to-orange-100",
    slug: "education-corner"
  }
];

const state = {
  searchQuery: '',
  category: 'All',
  sortBy: 'rating'
};

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function filterShows() {
  const search = normalizeText(state.searchQuery);

  return SHOWS.filter((show) => {
    const matchesCategory = state.category === 'All' || show.category === state.category;
    const haystack = `${show.name} ${show.host} ${show.description} ${show.category}`.toLowerCase();
    const matchesQuery = !search || haystack.includes(search);
    return matchesCategory && matchesQuery;
  });
}

function sortShows(list) {
  const sorted = [...list];

  if (state.sortBy === 'name') {
    return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (state.sortBy === 'episodes') {
    return sorted.sort((a, b) => b.episodes - a.episodes);
  }

  return sorted.sort((a, b) => b.rating - a.rating);
}

function renderShows() {
  const container = document.getElementById('showsContainer');
  const resultsInfo = document.getElementById('resultsInfo');
  const noResults = document.getElementById('noResults');

  if (!container || !resultsInfo || !noResults) return;

  const filtered = sortShows(filterShows());

  container.innerHTML = filtered.map((show) => `
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
  `).join('');

  const quickViewButtons = container.querySelectorAll('[data-show-id]');
  quickViewButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.getAttribute('data-show-id');
      const show = SHOWS.find((item) => item.id === id);
      if (!show) return;
      alert(`${show.name}\nHost: ${show.host}\nCategory: ${show.category}\nRating: ${show.rating.toFixed(1)}/5\n${show.description}`);
    });
  });

  resultsInfo.textContent = `${filtered.length} show${filtered.length === 1 ? '' : 's'} found`;
  noResults.classList.toggle('hidden', filtered.length > 0);
}

function updateCategoryButtons() {
  document.querySelectorAll('.category-filter').forEach((button) => {
    const isActive = button.textContent.trim() === state.category;
    button.classList.toggle('active', isActive);
    button.classList.toggle('btn-primary', isActive);
    button.classList.toggle('btn-secondary', !isActive);
  });
}

function filterByCategory(event, category) {
  state.category = category;
  updateCategoryButtons();
  renderShows();
}

function sortShowsFromSelect() {
  const select = document.getElementById('sortSelect');
  if (!select) return;
  state.sortBy = select.value;
  renderShows();
}

function setupShowPage() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (event) => {
      state.searchQuery = event.target.value;
      renderShows();
    });
  }

  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', sortShowsFromSelect);
  }

  updateCategoryButtons();
  renderShows();
}

window.filterByCategory = filterByCategory;
window.sortShows = sortShowsFromSelect;

document.addEventListener('DOMContentLoaded', setupShowPage);
