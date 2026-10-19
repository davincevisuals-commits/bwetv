/**
 * content.js — BWE TV
 * Restores Programs data and renders the program list + current show info.
 * Replaces the broken/unterminated PROGRAMS array that caused the site to fail.
 */

// ─────────────────────────────────────────────────────────────────---------
// Sample program data (edit or replace with real schedule entries)
// ─────────────────────────────────────────────────────────────────---------
const PROGRAMS = [
  {
    id: "local-news",
    title: "Local News",
    start: "10:00 AM",
    end: "11:00 AM",
    description: "Latest news and updates from our community.",
    category: "News"
  },
  {
    id: "community-hour",
    title: "Community Hour",
    start: "11:00 AM",
    end: "12:00 PM",
    description: "Local voices, interviews, and community stories.",
    category: "Talk"
  },
  {
    id: "kids-corner",
    title: "Kids Corner",
    start: "3:00 PM",
    end: "4:00 PM",
    description: "Educational and fun programming for children.",
    category: "Kids"
  }
];

// ─────────────────────────────────────────────────────────────────---------
// Rendering helpers
// ─────────────────────────────────────────────────────────────────---------
function renderPrograms() {
  const container = document.getElementById('programsContainer');
  if (!container) return;

  if (!Array.isArray(PROGRAMS) || PROGRAMS.length === 0) {
    container.innerHTML = '<p class="text-sm" style="color:#5a4a38;">No programs scheduled today.</p>';
    return;
  }

  container.innerHTML = PROGRAMS.map(p => {
    return (`
      <div class="program-card rounded-xl p-4 shadow">
        <div class="mb-3 h-20 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-500" aria-hidden="true">${escapeHtml(p.category || '')}</div>
        <h3 class="text-lg font-bold">${escapeHtml(p.title)}</h3>
        <div class="text-sm text-gray-700">${escapeHtml(p.start)} — ${escapeHtml(p.end || '')}</div>
        <p class="text-sm text-gray-600 mt-2">${escapeHtml(p.description || '')}</p>
      </div>
    `);
  }).join('');
}

function renderCurrentShow() {
  const el = document.getElementById('currentShowInfo');
  if (!el) return;

  if (!Array.isArray(PROGRAMS) || PROGRAMS.length === 0) {
    el.innerHTML = '<p class="text-lg font-semibold">No shows available</p>';
    return;
  }

  // Simple approach: show the first program as "current". Replace with time-based logic if needed.
  const current = PROGRAMS[0];
  el.innerHTML = `<p class="text-lg font-semibold">${escapeHtml(current.title)} (${escapeHtml(current.start)})</p>`;
}

// Basic HTML escaping to avoid accidental injection when editing content.js
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

// Initialize on DOMContentLoaded so defer/placement doesn't matter
document.addEventListener('DOMContentLoaded', function () {
  try {
    renderPrograms();
    renderCurrentShow();
  } catch (err) {
    // Log errors but avoid breaking other scripts
    console.error('content.js render error:', err);
  }
});
