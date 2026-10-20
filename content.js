const SITE_TZ_OFFSET = 3;
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CHAT_STORAGE_KEY = "bwetv-live-chat";

const PROGRAMS = [
  { id: "morning-news", day: "Monday", title: "Morning News", start: "08:00", end: "09:00", category: "News", description: "Local stories, updates, and voices from Bweyale and nearby communities.", image: "assets/images/bweyale-hero.svg" },
  { id: "community-hour", day: "Monday", title: "Community Hour", start: "11:00", end: "12:00", category: "Talk", description: "A space for local voices, conversations, and community updates.", image: "assets/images/logo 1.png" },
  { id: "kids-corner", day: "Monday", title: "Kids Corner", start: "15:00", end: "16:00", category: "Kids", description: "Fun, educational, and age-appropriate content for children.", image: "assets/images/logo 1.png" },
  { id: "farm-focus", day: "Tuesday", title: "Farm Focus", start: "09:00", end: "10:00", category: "Agriculture", description: "Practical farming advice and local agricultural discussions.", image: "assets/images/bweyale-hero.svg" },
  { id: "community-hour", day: "Tuesday", title: "Community Hour", start: "11:00", end: "12:00", category: "Talk", description: "Open dialogue around local issues, opportunities, and everyday life.", image: "assets/images/logo 1.png" },
  { id: "culture-show", day: "Tuesday", title: "Culture Show", start: "18:00", end: "19:00", category: "Culture", description: "Music, heritage, and stories that celebrate local identity.", image: "assets/images/logo 2.png" },
  { id: "morning-news", day: "Wednesday", title: "Morning News", start: "08:00", end: "09:00", category: "News", description: "The latest local headlines and community reporting.", image: "assets/images/bweyale-hero.svg" },
  { id: "youth-voice", day: "Wednesday", title: "Youth Voice", start: "13:00", end: "14:00", category: "Youth", description: "Youth perspectives, creativity, and community leadership.", image: "assets/images/logo 2.png" },
  { id: "evening-chat", day: "Wednesday", title: "Evening Chat", start: "19:00", end: "20:00", category: "Talk", description: "A relaxed conversation show connecting community ideas and stories.", image: "assets/images/logo 1.png" },
  { id: "health-watch", day: "Thursday", title: "Health Watch", start: "09:30", end: "10:30", category: "Health", description: "Health awareness, wellness, and local care information.", image: "assets/images/bweyale-hero.svg" },
  { id: "community-hour", day: "Thursday", title: "Community Hour", start: "11:00", end: "12:00", category: "Talk", description: "A community forum for public conversation and engagement.", image: "assets/images/logo 1.png" },
  { id: "music-mix", day: "Thursday", title: "Music Mix", start: "17:00", end: "18:00", category: "Music", description: "A lively mix of local and regional music and entertainment.", image: "assets/images/logo 2.png" },
  { id: "morning-news", day: "Friday", title: "Morning News", start: "08:00", end: "09:00", category: "News", description: "Daily headlines and updates from the local community.", image: "assets/images/bweyale-hero.svg" },
  { id: "school-zone", day: "Friday", title: "School Zone", start: "10:00", end: "11:00", category: "Education", description: "Academic news, students, and school community stories.", image: "assets/images/logo 2.png" },
  { id: "weekend-preview", day: "Friday", title: "Weekend Preview", start: "18:00", end: "19:00", category: "Preview", description: "A preview of the weekend programs and community highlights.", image: "assets/images/logo 1.png" },
  { id: "day-break", day: "Saturday", title: "Day Break", start: "08:30", end: "09:30", category: "Lifestyle", description: "A relaxing start to the weekend with local perspectives and updates.", image: "assets/images/bweyale-hero.svg" },
  { id: "sports-hour", day: "Saturday", title: "Sports Hour", start: "12:00", end: "13:00", category: "Sports", description: "Community sports, competition, and local sporting stories.", image: "assets/images/logo 2.png" },
  { id: "family-night", day: "Saturday", title: "Family Night", start: "19:00", end: "20:30", category: "Entertainment", description: "Family-friendly entertainment and engaging community stories.", image: "assets/images/logo 1.png" },
  { id: "faith-focus", day: "Sunday", title: "Faith Focus", start: "08:00", end: "09:00", category: "Faith", description: "Community reflection, faith, and spiritual conversation.", image: "assets/images/logo 2.png" },
  { id: "family-hour", day: "Sunday", title: "Family Hour", start: "12:00", end: "13:00", category: "Family", description: "A warm and friendly family-centered program for the whole community.", image: "assets/images/logo 1.png" },
  { id: "week-in-review", day: "Sunday", title: "Week in Review", start: "18:00", end: "19:00", category: "Review", description: "A recap of major stories, events, and community highlights from the week.", image: "assets/images/bweyale-hero.svg" }
];

const COMMUNITY_POSTS = [
  { title: "Live community stories", meta: "Community Desk", body: "Neighbors are sharing local wins, updates, and exciting community events across Bweyale and the wider region.", tag: "Highlights" },
  { title: "Youth voices matter", meta: "Youth Focus", body: "Young people are building space for creative ideas, leadership, and community action through BWE TV programs.", tag: "Youth" },
  { title: "Farm and food conversations", meta: "Rural Life", body: "Community members are discussing practical ways to grow local food systems, jobs, and agricultural opportunities.", tag: "Agriculture" },
  { title: "Local faith and family connection", meta: "Community Life", body: "Families and faith communities are engaging in meaningful conversations about care, support, and belonging.", tag: "Family" }
];

function normalizeDayName(dayName) {
  if (!dayName) return "";
  const cleaned = String(dayName).trim();
  return DAY_NAMES.includes(cleaned) ? cleaned : cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
}

function getLocalDayName() {
  const adjusted = new Date(Date.now() + (new Date().getTimezoneOffset() * 60000) + (SITE_TZ_OFFSET * 60 * 60 * 1000));
  return DAY_NAMES[adjusted.getDay()];
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3] ? match[3].toUpperCase() : null;

  if (meridiem) {
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
  }

  return hours * 60 + minutes;
}

function getLocalMinutesSinceMidnight() {
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const localMs = utcMs + (SITE_TZ_OFFSET * 3600000);
  const local = new Date(localMs);
  return local.getHours() * 60 + local.getMinutes();
}

function getProgramsForDay(dayName) {
  const targetDay = normalizeDayName(dayName || getLocalDayName());
  return PROGRAMS.filter((program) => normalizeDayName(program.day) === targetDay);
}

function sortProgramList(programs) {
  return [...programs].sort((a, b) => {
    const aMinutes = parseTimeToMinutes(a.start) || 0;
    const bMinutes = parseTimeToMinutes(b.start) || 0;
    return aMinutes - bMinutes;
  });
}

function findCurrentProgram(dayName) {
  const programs = sortProgramList(getProgramsForDay(dayName));
  const nowMinutes = getLocalMinutesSinceMidnight();

  for (const program of programs) {
    const startMinutes = parseTimeToMinutes(program.start);
    const endMinutes = parseTimeToMinutes(program.end);
    if (startMinutes == null || endMinutes == null) continue;

    let endValue = endMinutes;
    if (endValue <= startMinutes) endValue += 24 * 60;

    let currentValue = nowMinutes;
    if (currentValue < startMinutes && endValue > 24 * 60) currentValue += 24 * 60;

    if (currentValue >= startMinutes && currentValue < endValue) return program;
  }

  return null;
}

function findNextProgram(dayName) {
  const programs = sortProgramList(getProgramsForDay(dayName));
  const nowMinutes = getLocalMinutesSinceMidnight();

  for (const program of programs) {
    const startMinutes = parseTimeToMinutes(program.start);
    if (startMinutes !== null && startMinutes >= nowMinutes) return program;
  }

  return programs[0] || null;
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"'`]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "`": "&#96;"
  }[character]));
}

function renderCurrentShowMessage() {
  const currentShowInfo = document.getElementById("currentShowInfo");
  if (!currentShowInfo) return;

  const current = findCurrentProgram();
  if (current) {
    currentShowInfo.innerHTML = `
      <p class="text-lg font-semibold">${escapeHtml(current.title)} (${escapeHtml(current.start)} – ${escapeHtml(current.end)})</p>
      <p class="text-sm text-gray-700">${escapeHtml(current.description)}</p>
    `;
    return;
  }

  const next = findNextProgram();
  if (next) {
    currentShowInfo.innerHTML = `
      <p class="text-lg font-semibold">Next: ${escapeHtml(next.title)} (${escapeHtml(next.start)})</p>
      <p class="text-sm text-gray-700">${escapeHtml(next.description)}</p>
    `;
    return;
  }

  currentShowInfo.innerHTML = '<p class="text-lg font-semibold">No programs scheduled</p>';
}

function renderProgramCards(container, programs) {
  if (!container) return;

  if (!programs.length) {
    container.innerHTML = '<p class="text-sm text-gray-600">No programs are scheduled for this day.</p>';
    return;
  }

  const current = findCurrentProgram();
  const cards = sortProgramList(programs).map((program) => {
    const isCurrent = current && current.id === program.id && current.day === program.day;
    const imageMarkup = program.image
      ? `<div class="mb-3 h-24 overflow-hidden rounded"><img src="${escapeHtml(program.image)}" alt="${escapeHtml(program.title)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>`
      : `<div class="mb-3 h-20 rounded bg-gray-100 flex items-center justify-center text-sm text-gray-500">${escapeHtml(program.category || "Program")}</div>`;

    const badge = isCurrent ? '<span class="inline-block rounded bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">On Air</span>' : '';

    return `
      <article class="program-card rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200" aria-current="${isCurrent ? "true" : "false"}">
        ${imageMarkup}
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-lg font-bold text-gray-900">${escapeHtml(program.title)}</h3>
          ${badge}
        </div>
        <div class="mt-2 text-sm text-gray-700">${escapeHtml(program.start)} – ${escapeHtml(program.end)}</div>
        <p class="mt-2 text-sm text-gray-600">${escapeHtml(program.description)}</p>
      </article>
    `;
  }).join("");

  container.innerHTML = cards;
}

function renderHomePrograms() {
  const homeContainer = document.getElementById("programsContainer");
  if (!homeContainer) return;
  renderProgramCards(homeContainer, getProgramsForDay(getLocalDayName()));
}

function setScheduleDayButtons(selectedDay) {
  const buttons = document.querySelectorAll(".day-btn");
  buttons.forEach((button) => {
    const isSelected = button.dataset.day === selectedDay;
    button.classList.toggle("btn-primary", isSelected);
    button.classList.toggle("btn-secondary", !isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });
}

function renderSchedulePage(selectedDay) {
  const scheduleTitle = document.getElementById("scheduleTitle");
  const scheduleContainer = document.getElementById("scheduleContainer");
  if (!scheduleTitle || !scheduleContainer) return;

  const normalizedDay = normalizeDayName(selectedDay || getLocalDayName());
  const items = sortProgramList(getProgramsForDay(normalizedDay));

  scheduleTitle.textContent = `${normalizedDay} Schedule`;
  setScheduleDayButtons(normalizedDay);

  if (!items.length) {
    scheduleContainer.innerHTML = '<div class="rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-gray-600">No programming is available for this day yet.</div>';
    return;
  }

  scheduleContainer.innerHTML = items.map((program) => `
    <article class="schedule-item rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="text-xs font-bold uppercase tracking-wide text-red-600">${escapeHtml(program.category || "Program")}</div>
          <h3 class="text-xl font-bold text-gray-900">${escapeHtml(program.title)}</h3>
        </div>
        <div class="text-sm font-semibold text-gray-700">${escapeHtml(program.start)} – ${escapeHtml(program.end)}</div>
      </div>
      <p class="mt-3 text-sm text-gray-600">${escapeHtml(program.description)}</p>
    </article>
  `).join("");
}

function selectDay(event, dayName) {
  event.preventDefault();
  renderSchedulePage(dayName);
}

function setReminder() {
  const selectedDay = document.getElementById("scheduleTitle")?.textContent?.replace(" Schedule", "") || getLocalDayName();
  const programs = getProgramsForDay(selectedDay);
  const next = programs[0] || null;

  const reminderText = next
    ? `Reminder saved: ${next.title} starts at ${next.start} on ${selectedDay}.`
    : `Reminder saved for ${selectedDay}.`;

  localStorage.setItem("bwetv-reminder", JSON.stringify({ day: selectedDay, timestamp: Date.now() }));
  window.alert(reminderText);
}

function shareSchedule() {
  const selectedDay = document.getElementById("scheduleTitle")?.textContent?.replace(" Schedule", "") || getLocalDayName();
  const schedule = getProgramsForDay(selectedDay); 
  const text = schedule.length
    ? `BWE TV ${selectedDay} schedule:\n${schedule.map((item) => `${item.start} – ${item.end}: ${item.title}`).join("\n")}`
    : `BWE TV ${selectedDay} schedule is currently unavailable.`;

  if (navigator.share) {
    navigator.share({
      title: `BWE TV ${selectedDay} Schedule`,
      text
    }).catch(() => {});
    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      window.alert("Schedule copied to your clipboard.");
    }).catch(() => {
      window.prompt("Copy the schedule below:", text);
    });
    return;
  }

  window.prompt("Copy the schedule below:", text);
}

function downloadSchedule() {
  const selectedDay = document.getElementById("scheduleTitle")?.textContent?.replace(" Schedule", "") || getLocalDayName();
  const schedule = getProgramsForDay(selectedDay);
  const content = schedule.length
    ? `BWE TV ${selectedDay} Schedule\n${schedule.map((item) => `${item.start} – ${item.end}: ${item.title} (${item.category})`).join("\n")}`
    : `BWE TV ${selectedDay} Schedule\nNo programs currently available.`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bwetv-schedule-${selectedDay.toLowerCase()}.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function renderShows() {
  const filterContainer = document.getElementById("showFilters");
  const showsContainer = document.getElementById("showsContainer");
  if (!filterContainer || !showsContainer) return;

  const categories = ["All", ...Array.from(new Set(PROGRAMS.map((program) => program.category).filter(Boolean)))];
  let activeCategory = "All";

  function renderCards(category = "All") {
    const filtered = category === "All"
      ? PROGRAMS
      : PROGRAMS.filter((program) => program.category === category);

    const uniqueProgramEntries = filtered.filter((program, index, list) => {
      const firstIndex = list.findIndex((item) => item.id === program.id && item.title === program.title);
      return firstIndex === index;
    });

    showsContainer.innerHTML = uniqueProgramEntries.map((program) => `
      <article class="show-card overflow-hidden rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
        ${program.image ? `<div class="mb-4 h-40 overflow-hidden rounded-lg"><img src="${escapeHtml(program.image)}" alt="${escapeHtml(program.title)}" style="width:100%;height:100%;object-fit:cover;display:block"></div>` : '<div class="mb-4 h-40 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-500">Program</div>'}
        <div class="mb-2 text-xs font-bold uppercase tracking-wide text-red-600">${escapeHtml(program.category || "Program")}</div>
        <h3 class="text-xl font-bold text-gray-900">${escapeHtml(program.title)}</h3>
        <p class="mt-2 text-sm text-gray-600">${escapeHtml(program.description)}</p>
        <div class="mt-4 text-sm font-semibold text-gray-700">${escapeHtml(program.start)} – ${escapeHtml(program.end)}</div>
      </article>
    `).join("");
  }

  filterContainer.innerHTML = categories.map((category) => `
    <button type="button" class="category-filter btn ${category === "All" ? "btn-primary active" : "btn-secondary"}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>
  `).join("");

  filterContainer.querySelectorAll(".category-filter").forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;
      filterContainer.querySelectorAll(".category-filter").forEach((item) => {
        const shouldBeActive = item.dataset.category === activeCategory;
        item.classList.toggle("btn-primary", shouldBeActive);
        item.classList.toggle("btn-secondary", !shouldBeActive);
        item.classList.toggle("active", shouldBeActive);
      });
      renderCards(activeCategory);
    });
  });

  renderCards(activeCategory);
}

function renderCommunityPosts() {
  const container = document.getElementById("communityPosts");
  if (!container) return;

  container.innerHTML = COMMUNITY_POSTS.map((post) => `
    <article class="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div class="mb-2 text-xs font-bold uppercase tracking-wide text-red-600">${escapeHtml(post.tag)}</div>
      <h3 class="text-xl font-bold text-gray-900">${escapeHtml(post.title)}</h3>
      <p class="mt-2 text-sm font-medium text-gray-500">${escapeHtml(post.meta)}</p>
      <p class="mt-3 text-sm text-gray-700">${escapeHtml(post.body)}</p>
    </article>
  `).join("");
}

function readSavedChatMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}

function writeSavedChatMessages(messages) {
  localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-50)));
}

function renderChatMessages() {
  const liveChat = document.getElementById("liveChat");
  if (!liveChat) return;

  const messages = readSavedChatMessages();
  if (!messages.length) {
    liveChat.innerHTML = '<div class="rounded-lg bg-white p-4 text-sm text-gray-600 shadow-sm">No messages yet. Start the conversation.</div>';
    return;
  }

  liveChat.innerHTML = messages.map((message) => `
    <div class="mb-3 rounded-lg bg-white p-3 shadow-sm">
      <div class="flex items-center justify-between gap-3">
        <span class="text-sm font-bold text-red-600">${escapeHtml(message.author || "Viewer")}</span>
        <span class="text-[11px] text-gray-500">${escapeHtml(message.time || "now")}</span>
      </div>
      <p class="mt-2 text-sm text-gray-700">${escapeHtml(message.text || "")}</p>
    </div>
  `).join("");

  liveChat.scrollTop = liveChat.scrollHeight;
}

function initializeChat() {
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const liveChat = document.getElementById("liveChat");

  if (!chatForm || !chatInput || !liveChat) return;

  renderChatMessages();

  chatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    const authorName = localStorage.getItem("bwetv-chat-name") || `Viewer ${Math.floor(Math.random() * 900 + 100)}`;
    const nextMessage = {
      author: authorName,
      text: message,
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    };

    const messages = readSavedChatMessages();
    messages.push(nextMessage);
    writeSavedChatMessages(messages);
    chatInput.value = "";
    renderChatMessages();
  });
}

function initializeMobileNavigation() {
  const toggleButton = document.getElementById("mobileMenuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (!toggleButton || !mobileMenu) return;

  toggleButton.addEventListener("click", () => {
    const shouldBeVisible = mobileMenu.classList.contains("hidden");
    mobileMenu.classList.toggle("hidden", !shouldBeVisible);
    mobileMenu.classList.toggle("visible", shouldBeVisible);
    toggleButton.setAttribute("aria-expanded", String(shouldBeVisible));
  });
}

function markActiveNavigation() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("a[data-nav-link]").forEach((link) => {
    const href = link.getAttribute("href");
    const isActive = href === currentPage;
    link.classList.toggle("nav-link-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function initializeWebsite() {
  renderCurrentShowMessage();
  renderHomePrograms();
  renderShows();
  renderCommunityPosts();
  initializeChat();
  initializeMobileNavigation();
  markActiveNavigation();

  const scheduleTitle = document.getElementById("scheduleTitle");
  const scheduleContainer = document.getElementById("scheduleContainer");
  if (scheduleTitle && scheduleContainer) {
    const selectedDay = getLocalDayName();
    renderSchedulePage(selectedDay);
    if (typeof window.selectDay === "function") {
      const navButtons = document.querySelectorAll(".day-btn");
      navButtons.forEach((button) => {
        button.addEventListener("click", (event) => selectDay(event, button.dataset.day));
      });
    }
  }
}

document.addEventListener("DOMContentLoaded", initializeWebsite);

window.BWE = {
  PROGRAMS,
  COMMUNITY_POSTS,
  renderCurrentShowMessage,
  renderHomePrograms,
  renderSchedulePage,
  selectDay,
  setReminder,
  shareSchedule,
  downloadSchedule,
  renderShows,
  renderCommunityPosts,
  initializeChat,
  initializeMobileNavigation
};

window.addEventListener("load", () => {
  const scriptContext = document.body ? document.body.dataset : {};
  if (scriptContext.page === "schedule") {
    renderSchedulePage(getLocalDayName());
  }
});

if (typeof window !== "undefined") {
  window.getProgramsForDay = getProgramsForDay;
  window.findCurrentProgram = findCurrentProgram;
  window.findNextProgram = findNextProgram;
}
