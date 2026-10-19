/**
 * content.js — BWE TV
 * Time-aware program selection + image support for program cards.
 *
 * This file replaces the previous content.js and provides:
 * - PROGRAMS array (editable schedule entries)
 * - Time-aware selection of the current on-air program using a site timezone offset
 * - Image support (use `image` paths under assets/images/)
 * - Renders #programsContainer and #currentShowInfo
 */

// Timezone offset (hours) relative to UTC. Set to Kampala/East Africa: +3
const SITE_TZ_OFFSET = 3;

// ─────────────────────────────────────────────────────────────────---------
// PROGRAM DATA — edit these entries to match your real schedule.
// Use 24-hour format for start/end (e.g. "14:30") or include AM/PM (e.g. "2:30 PM").
// Provide `image` paths relative to site root (e.g. "assets/images/bweyale-hero.svg").
// ─────────────────────���───────────────────────────────────────────---------
const PROGRAMS = [
  {
    id: "local-news",
    title: "Local News",
    start: "10:00",
    end: "11:00",
    description: "Latest news and updates from our community.",
    category: "News",
    image: "assets/images/bweyale-hero.svg"
  },
  {
    id: "community-hour",
    title: "Community Hour",
    start: "11:00",
    end: "12:00",
    description: "Local voices, interviews, and community stories.",
    category: "Talk",
    image: "assets/images/logo 1.png"
  },
  {
    id: "kids-corner",
    title: "Kids Corner",
    start: "15:00",
    end: "16:00",
    description: "Educational and fun programming for children.",
    category: "Kids",
    image: "assets/images/logo 2.png"
  }
];

// ─────────────────────────────────────────────────────────────────---------
// Time helpers
// ─────────────────────────────────────────────────────────────────---------
function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  // Match patterns like "14:30" or "2:30 PM"
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!m) return null;
  let hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ampm = m[3] ? m[3].toUpperCase() : null;
  if (ampm) {
    if (ampm === 'PM' && hh < 12) hh += 12;
    if (ampm === 'AM' && hh === 12) hh = 0;
  }
  return hh * 60 + mm;
}

function getLocalMinutesSinceMidnight() {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const localMs = utcMs + (SITE_TZ_OFFSET * 3600000);
  const local = new Date(localMs);
  return local.getHours() * 60 + local.getMinutes();
}

// ─────────────────────────────────────────────────────────────────---------
// Program selection
// ─────────────────────────────────────────────────────────────────---------
function findCurrentProgram() {
  const nowM = getLocalMinutesSinceMidnight();
  for (let p of PROGRAMS) {
    const s = parseTimeToMinutes(p.start);
    const e = parseTimeToMinutes(p.end);
    if (s == null || e == null) continue;
    let end = e;
    // handle programs that cross midnight
    if (end <= s) end += 24 * 60;
    let now = nowM;
    // if now is before start but program crosses midnight, consider adding 24h to now when appropriate
    if (now < s && end > 24 * 60) now += 24 * 60; // rare case
    if (now >= s && now < end) return p;
  }
  return null;
}

function findNextProgram() {
  const nowM = getLocalMinutesSinceMidnight();
  // flatten with start minutes normalized (0-2*24h) to handle overnight
  const items = PROGRAMS.map(p => {
    const s = parseTimeToMinutes(p.start);
    if (s == null) return null;
    return { p, s };
  }).filter(Boolean).sort((a, b) => a.s - b.s);

  // find first with start >= now
  for (let it of items) {
    if (it.s >= nowM) return it.p;
  }
  // otherwise return first program tomorrow
  return items.length ? items[0].p : null;
}

// ─────────────────────────────────────────────────────────────────---------
// Rendering
// ─────────────────────────────────────────────────────────────────---------
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"'`]/g, function (s) {
    return ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '`': '&#96;'
    })[s];
  });
}

function programCardHtml(p, isCurrent) {
  const imgMarkup = p.image ?
    `<div class="mb-3 h-24 overflow-hidden rounded"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>` :
    `<div class="mb-3 h-20 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500" aria-hidden="true">${escapeHtml(p.category || '')}</div>`;

  const onAirBadge = isCurrent ? `<div class="text-xs font-bold inline-block px-2 py-1 rounded bg-red-600 text-white">On Air</div>` : '';

  return (`
    <div class="program-card rounded-xl p-4 shadow" ${isCurrent ? 'aria-current="true"' : ''}>
      ${imgMarkup}
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-lg font-bold">${escapeHtml(p.title)}</h3>
        ${onAirBadge}
      </div>
      <div class="text-sm text-gray-700">${escapeHtml(p.start)} ${p.end ? '— ' + escapeHtml(p.end) : ''}</div>
      <p class="text-sm text-gray-600 mt-2">${escapeHtml(p.description || '')}</p>
    </div>
  `);
}

function renderPrograms() {
  const container = document.getElementById('programsContainer');
  if (!container) return;

  if (!Array.isArray(PROGRAMS) || PROGRAMS.length === 0) {
    container.innerHTML = '<p class="text-sm" style="color:#5a4a38;">No programs scheduled today.</p>';
    return;
  }

  const current = findCurrentProgram();

  // sort by parsed start minutes
  const sorted = PROGRAMS.slice().sort((a, b) => {
    const sa = parseTimeToMinutes(a.start) || 0;
    const sb = parseTimeToMinutes(b.start) || 0;
    return sa - sb;
  });

  container.innerHTML = sorted.map(p => programCardHtml(p, current && current.id === p.id)).join('');
}

function renderCurrentShow() {
  const el = document.getElementById('currentShowInfo');
  if (!el) return;

  const current = findCurrentProgram();
  if (current) {
    el.innerHTML = `
      <p class="text-lg font-semibold">${escapeHtml(current.title)} (${escapeHtml(current.start)})</p>
      <p class="text-sm text-gray-700">${escapeHtml(current.description || '')}</p>
    `;
    return;
  }

  const next = findNextProgram();
  if (next) {
    el.innerHTML = `
      <p class="text-lg font-semibold">Next: ${escapeHtml(next.title)} (${escapeHtml(next.start)})</p>
      <p class="text-sm text-gray-700">${escapeHtml(next.description || '')}</p>
    `;
    return;
  }

  el.innerHTML = '<p class="text-lg font-semibold">No shows available</p>';
}

// Initialize on DOMContentLoaded so defer/placement doesn't matter
document.addEventListener('DOMContentLoaded', function () {
  try {
    renderPrograms();
    renderCurrentShow();
    // Optional: refresh current show every minute to keep "On Air" accurate
    setInterval(() => {
      renderPrograms();
      renderCurrentShow();
    }, 60 * 1000);
  } catch (err) {
    console.error('content.js render error:', err);
  }
});
