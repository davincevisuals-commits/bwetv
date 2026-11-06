const CHAT_MAX_LENGTH = 300;
const CHAT_NEAR_BOTTOM_THRESHOLD = 80;
const DEFAULT_CHAT_PATH = "channels/live-chat/messages";

const scheduleState = {
  selectedDay: "Today"
};

const PROGRAM_DATA = {
  Monday: [
    { time: "06:00", title: "Morning Rise", host: "Moses & Lydia", summary: "A vibrant start with local news, weather, devotions and community updates.", type: "Live" },
    { time: "07:30", title: "Bweyale Breakfast", host: "The BWE Team", summary: "Breakfast conversation, local stories, and community highlights from the district.", type: "Talk" },
    { time: "10:00", title: "Local Voices", host: "Community Correspondents", summary: "Real stories from families, traders, and youth across Bweyale and Kiryandongo.", type: "Interview" },
    { time: "12:30", title: "Lunch Time Update", host: "News Desk", summary: "Short, sharp midday updates on politics, agriculture, health and community events.", type: "News" },
    { time: "18:00", title: "Community News", host: "BWE Reporting Team", summary: "The most important local stories, public notices and district developments.", type: "Live" },
    { time: "19:30", title: "Cultural Roots", host: "Teddy Achen", summary: "Music, heritage and stories that keep local culture alive across generations.", type: "Culture" }
  ],
  Tuesday: [
    { time: "06:00", title: "Morning Rise", host: "Moses & Lydia", summary: "Morning motivation, local weather, and community briefing.", type: "Live" },
    { time: "08:00", title: "Women in Action", host: "Community Studio", summary: "Empowering women through leadership, entrepreneurship and wellbeing stories.", type: "Talk" },
    { time: "11:00", title: "Agri Pulse", host: "Farm & Market Desk", summary: "Farming tips, market prices and practical advice for local households.", type: "Agriculture" },
    { time: "13:00", title: "Lunch Time Update", host: "News Desk", summary: "Daily updates on local issues, service delivery and public notices.", type: "News" },
    { time: "17:45", title: "Youth Voices", host: "Young Presenters", summary: "A forum for youth ideas, talents, and community conversations.", type: "Youth" },
    { time: "19:30", title: "Business Update", host: "Market Watch", summary: "Business opportunities, small enterprise stories and economic updates.", type: "Business" }
  ],
  Wednesday: [
    { time: "06:00", title: "Morning Rise", host: "Moses & Lydia", summary: "Local news and warm-up conversation to start the day.", type: "Live" },
    { time: "08:15", title: "Health & Wellness", host: "BWE Health Desk", summary: "Public health awareness, family wellness and lifestyle guidance.", type: "Health" },
    { time: "10:30", title: "Education Corner", host: "School & Learning Desk", summary: "Learning opportunities, school updates and student stories from the region.", type: "Education" },
    { time: "13:00", title: "Lunch Time Update", host: "News Desk", summary: "A short midday bulletin covering district updates and public information.", type: "News" },
    { time: "18:00", title: "Community News", host: "BWE Reporting Team", summary: "A live local briefing on community events, public notices and district activity.", type: "Live" },
    { time: "20:00", title: "Entertainment Express", host: "BWE Studio", summary: "Music, lifestyle trends, and feel-good programming for the evening audience.", type: "Entertainment" }
  ],
  Thursday: [
    { time: "06:00", title: "Morning Rise", host: "Moses & Lydia", summary: "A strong start with devotion, weather, and local headlines.", type: "Live" },
    { time: "08:00", title: "Faith & Family", host: "Community Leaders", summary: "Family life, faith perspectives, and practical social guidance.", type: "Talk" },
    { time: "10:30", title: "Small Business Today", host: "Market Desk", summary: "Helping local entrepreneurs grow and thrive in the district economy.", type: "Business" },
    { time: "12:45", title: "Lunch Time Update", host: "News Desk", summary: "Timely coverage of district headlines and local developments.", type: "News" },
    { time: "18:00", title: "Community News", host: "BWE Reporting Team", summary: "Stories from homes, markets, schools, and public institutions across the region.", type: "Live" },
    { time: "19:30", title: "Sports & Culture", host: "BWE Sports Desk", summary: "A mix of district sports highlights and local cultural discussions.", type: "Sports" }
  ],
  Friday: [
    { time: "06:00", title: "Morning Rise", host: "Moses & Lydia", summary: "Local briefing to begin the day with updates, weather and motivation.", type: "Live" },
    { time: "08:00", title: "Good Morning Kiryandongo", host: "BWE Studio", summary: "A cheerful community conversation with updates from the district.", type: "Talk" },
    { time: "11:00", title: "Local Leadership Forum", host: "Public Affairs Desk", summary: "Discussion on service delivery, civic engagement and district progress.", type: "Public Affairs" },
    { time: "14:00", title: "Market Watch", host: "Trade Desk", summary: "Daily market trends, trade stories and local shopping opportunities.", type: "Business" },
    { time: "18:00", title: "Community News", host: "BWE Reporting Team", summary: "Friday community updates and the latest happenings across the district.", type: "Live" },
    { time: "20:00", title: "Weekend Preview", host: "BWE Team", summary: "A look ahead at the biggest stories and upcoming events across BWE TV.", type: "Preview" }
  ],
  Saturday: [
    { time: "08:00", title: "Weekend Morning Live", host: "BWE Studio", summary: "A relaxed look at community life, culture and local updates.", type: "Live" },
    { time: "10:00", title: "Family Focus", host: "Community Presenters", summary: "Family matters, parenting advice and local perspectives.", type: "Family" },
    { time: "12:00", title: "Market Day", host: "Trade Desk", summary: "Fresh updates on market movement, commodities and local commerce.", type: "Business" },
    { time: "15:00", title: "Music & Culture", host: "Cultural Desk", summary: "A festival of local sound, heritage and cultural stories.", type: "Culture" },
    { time: "18:30", title: "Community News", host: "BWE Reporting Team", summary: "Local issues, public notices and stories from across Bweyale.", type: "Live" },
    { time: "20:00", title: "Weekend Wrap", host: "BWE Desk", summary: "A recap of the week’s biggest moments and highlights.", type: "Wrap" }
  ],
  Sunday: [
    { time: "07:30", title: "Worship & Reflection", host: "Community Chaplaincy", summary: "Faith, inspiration and uplifting reflections to start the day.", type: "Faith" },
    { time: "09:00", title: "Sunday Family Talk", host: "BWE Studio", summary: "Family conversations, community stories and uplifting dialogue.", type: "Talk" },
    { time: "11:00", title: "Local Worship Service", host: "Community Churches", summary: "A live church service and spiritual encouragement.", type: "Live" },
    { time: "14:00", title: "Community Highlights", host: "District Desk", summary: "The people, places and stories shaping life in the region.", type: "Community" },
    { time: "18:00", title: "Sunday Evening News", host: "BWE Reporting Team", summary: "A wrap-up of the week’s community updates and local developments.", type: "Live" },
    { time: "19:30", title: "Faith & Hope", host: "Studio Panel", summary: "An uplifting end-of-day conversation rooted in faith and community resilience.", type: "Talk" }
  ]
};

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const BROADCAST_TIME_ZONE = "Africa/Kampala";

function getBroadcastTime() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BROADCAST_TIME_ZONE, weekday: "long", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date());
  const value = (type) => parts.find((part) => part.type === type).value;
  return { day: value("weekday"), minutes: Number(value("hour")) * 60 + Number(value("minute")) };
}

function getTodayLabel() {
  return getBroadcastTime().day;
}

function timeToMinutes(timeString) {
  const [hour, minute] = String(timeString || '00:00').split(':').map(Number);
  return (Number(hour) || 0) * 60 + (Number(minute) || 0);
}

function getProgramsForDay(dayName) {
  if (dayName === 'Today') {
    const today = getTodayLabel();
    return PROGRAM_DATA[today] || PROGRAM_DATA[Object.keys(PROGRAM_DATA)[0]] || [];
  }
  return PROGRAM_DATA[dayName] || [];
}

function getCurrentProgram(programs) {
  const nowMinutes = getBroadcastTime().minutes;

  for (let index = 0; index < programs.length; index += 1) {
    const program = programs[index];
    const start = timeToMinutes(program.time);
    const end = index < programs.length - 1 ? timeToMinutes(programs[index + 1].time) : start + 90;
    if (nowMinutes >= start && nowMinutes < end) {
      return program;
    }
  }

  if (programs === getProgramsForDay('Today')) {
    const yesterday = DAYS_OF_WEEK[(DAYS_OF_WEEK.indexOf(getTodayLabel()) + 6) % DAYS_OF_WEEK.length];
    const previous = getProgramsForDay(yesterday);
    const last = previous[previous.length - 1];
    if (last && timeToMinutes(last.time) + 90 > 1440 + nowMinutes) return last;
  }
  return null;
}

function getNextProgram(programs) {
  if (!programs.length) return null;

  const nowMinutes = getBroadcastTime().minutes;
  return programs.find((program) => timeToMinutes(program.time) > nowMinutes) || null;
}

function escapeProgramHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatMinutes(total) {
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
}

function getProgramWindow(programs, index) {
  const start = timeToMinutes(programs[index].time);
  const end = index < programs.length - 1 ? timeToMinutes(programs[index + 1].time) : start + 90;
  return { start, end };
}

function getProgramStatus(programs, index, nowMinutes) {
  const { start, end } = getProgramWindow(programs, index);
  if (nowMinutes >= start && nowMinutes < end) return 'live';
  if (nowMinutes < start) return 'upcoming';
  return 'done';
}

// Shows the live program first, then the next ones; wraps to tomorrow's start when the day is over.
function pickFeaturedPrograms(programs, nowMinutes, count) {
  const live = programs.findIndex((_, i) => getProgramStatus(programs, i, nowMinutes) === 'live');
  const firstUpcoming = programs.findIndex((_, i) => getProgramStatus(programs, i, nowMinutes) === 'upcoming');
  const startIndex = live >= 0 ? live : (firstUpcoming >= 0 ? firstUpcoming : 0);
  return programs.slice(startIndex, startIndex + count).map((program) => {
    const index = programs.indexOf(program);
    return { program, index, status: live >= 0 || firstUpcoming >= 0 ? getProgramStatus(programs, index, nowMinutes) : 'upcoming' };
  });
}

function renderFeaturedPrograms() {
  const container = document.getElementById('featured-programs');
  if (!container) return;

  let programs = getProgramsForDay('Today');
  const nowMinutes = getBroadcastTime().minutes;
  const tomorrow = DAYS_OF_WEEK[(DAYS_OF_WEEK.indexOf(getTodayLabel()) + 1) % DAYS_OF_WEEK.length];
  const nextDay = !programs.some((_, index) => getProgramStatus(programs, index, nowMinutes) !== 'done');
  if (nextDay) programs = getProgramsForDay(tomorrow);
  if (!programs.length) {
    container.replaceChildren();
    delete container.dataset.signature;
    return;
  }
  const picks = pickFeaturedPrograms(programs, nextDay ? -1 : nowMinutes, 3);
  const firstUpcomingKey = picks.find((p) => p.status === 'upcoming');
  const signature = `${nextDay}|` + picks.map((p) => `${p.program.time}${p.program.title}${p.status}`).join('|');
  const rebuild = container.dataset.signature !== signature;

  if (rebuild) {
    container.dataset.signature = signature;
    container.innerHTML = picks.map((pick, i) => {
      const { program, status } = pick;
      const isNext = firstUpcomingKey && firstUpcomingKey.program === program;
      const badge = status === 'live'
        ? '<span class="program-badge program-badge-live"><span class="program-live-dot"></span>On now</span>'
        : (isNext ? '<span class="program-badge program-badge-next">Up next</span>' : '<span class="program-badge">Later</span>');
      return `
        <article class="program-card surface-card program-reveal rounded-xl p-4 shadow-sm ${status === 'live' ? 'program-live' : ''}"
                 style="animation-delay:${i * 90}ms" tabindex="0" role="button" aria-expanded="false"
                 data-index="${pick.index}" data-status="${status}">
          <div class="mb-3 flex items-center justify-between gap-3">
            <span class="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-red-700">${escapeProgramHtml(program.type)}</span>
            <span class="text-xs font-semibold text-gray-600">${escapeProgramHtml(program.time)}</span>
          </div>
          <h3 class="text-xl font-bold text-gray-900">${escapeProgramHtml(program.title)}</h3>
          <p class="mt-2 text-sm text-gray-600">${escapeProgramHtml(program.host)}</p>
          <p class="program-summary mt-3 text-sm leading-6 text-gray-700">${escapeProgramHtml(program.summary)}</p>
          <div class="mt-4 flex items-center justify-between gap-2">
            ${badge}
            <span class="program-countdown text-xs font-semibold text-gray-600"></span>
          </div>
          <div class="program-progress" aria-hidden="true"><div class="program-progress-bar"></div></div>
          <span class="program-more mt-3 block text-xs font-semibold text-red-700">Tap for details ▾</span>
        </article>`;
    }).join('');
  }

  container.querySelectorAll('.program-card').forEach((card) => {
    const index = Number(card.dataset.index);
    const { start, end } = getProgramWindow(programs, index);
    const status = card.dataset.status;
    const countdown = card.querySelector('.program-countdown');
    const bar = card.querySelector('.program-progress-bar');
    if (status === 'live') {
      const pct = Math.max(0, Math.min(100, ((nowMinutes - start) / (end - start)) * 100));
      bar.style.width = `${pct}%`;
      countdown.textContent = `${formatMinutes(Math.max(end - nowMinutes, 0))} left`;
    } else {
      bar.style.width = '0%';
      const until = start - nowMinutes;
      countdown.textContent = nextDay ? 'Starts tomorrow' : (until > 0 ? `Starts in ${formatMinutes(until)}` : 'Starts soon');
    }
  });
}

function renderLiveProgramStatus() {
  const info = document.getElementById('live-program-info');
  if (!info) return;

  const programs = getProgramsForDay('Today');
  const liveProgram = getCurrentProgram(programs);
  const text = liveProgram
    ? `${liveProgram.title} — ${liveProgram.summary}`
    : 'Local news, culture, and live community coverage';

  if (info.textContent !== text) info.textContent = text;
}

function initProgramInteractions() {
  const container = document.getElementById('featured-programs');
  renderLiveProgramStatus();
  if (!container || container.dataset.bound) return;
  container.dataset.bound = '1';

  const toggle = (card) => {
    const open = card.classList.toggle('program-open');
    card.setAttribute('aria-expanded', String(open));
    const more = card.querySelector('.program-more');
    if (more) more.textContent = open ? 'Hide details ▴' : 'Tap for details ▾';
  };

  container.addEventListener('click', (event) => {
    const card = event.target.closest('.program-card');
    if (card) toggle(card);
  });
  container.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const card = event.target.closest('.program-card');
    if (!card) return;
    event.preventDefault();
    toggle(card);
  });

  renderFeaturedPrograms();
  setInterval(() => {
    if (document.hidden) return;
    renderFeaturedPrograms();
    renderLiveProgramStatus();
  }, 30000);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    renderFeaturedPrograms();
    renderLiveProgramStatus();
  });
}

function renderWeekOverview() {
  const container = document.getElementById('weekOverview');
  if (!container) return;

  const today = getTodayLabel();

  container.innerHTML = DAYS_OF_WEEK.map((day) => {
    const active = day === today;
    const items = getProgramsForDay(day);
    const first = items[0];
    return `
      <button type="button" data-day="${day}" class="day-pill rounded-xl border px-3 py-3 text-left transition ${active ? 'border-red-500 bg-red-600 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-800 hover:border-red-200 hover:bg-red-50'}">
        <div class="text-[10px] font-bold uppercase tracking-[0.2em] ${active ? 'text-red-100' : 'text-gray-500'}">${day.slice(0, 3)}</div>
        <div class="mt-2 text-sm font-bold">${first ? escapeProgramHtml(first.title) : 'No data'}</div>
        <div class="mt-1 text-[11px] ${active ? 'text-red-100' : 'text-gray-500'}">${first ? escapeProgramHtml(first.time) : '—'}</div>
      </button>
    `;
  }).join('');

  container.querySelectorAll('.day-pill').forEach((button) => {
    button.addEventListener('click', () => {
      const day = button.getAttribute('data-day');
      selectDay({ currentTarget: button }, day);
    });
  });
}

function renderSchedule() {
  const container = document.getElementById('scheduleContainer');
  const title = document.getElementById('scheduleTitle');
  const currentInfo = document.getElementById('currentShowInfo');

  const activeDay = scheduleState.selectedDay || 'Today';
  const programs = getProgramsForDay(activeDay);
  const currentProgram = activeDay === 'Today' ? getCurrentProgram(programs) : programs[0];
  const nextProgram = activeDay === 'Today' ? getNextProgram(programs) : programs[1] || programs[0];

  if (title) {
    const dayTitle = activeDay === 'Today' ? getTodayLabel() : activeDay;
    title.textContent = `${dayTitle} Schedule`;
  }

  if (currentInfo) {
    currentInfo.innerHTML = `
      <p class="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-200">${activeDay === 'Today' ? (currentProgram ? 'Now airing' : 'Off air') : 'Featured'}</p>
      <p class="text-2xl font-bold text-white">${currentProgram ? escapeProgramHtml(currentProgram.title) : 'No programming available'}</p>
      <p class="mt-1 text-sm text-white/85">${currentProgram ? `${escapeProgramHtml(currentProgram.time)} • ${escapeProgramHtml(currentProgram.host)}` : 'Check back later'}</p>
      ${nextProgram ? `<p class="mt-2 text-xs text-white/80">Up next: ${escapeProgramHtml(nextProgram.title)} at ${escapeProgramHtml(nextProgram.time)}</p>` : ''}
    `;
  }

  if (container) {
    container.innerHTML = programs.map((program, index) => {
      const isLive = activeDay === 'Today' && currentProgram === program;
      const nowMinutes = getBroadcastTime().minutes;
      const programMinutes = timeToMinutes(program.time);
      const isNext = activeDay === 'Today' && nextProgram === program && !isLive;
      const isPast = activeDay === 'Today' && programMinutes < nowMinutes && !isLive;

      return `
        <div class="schedule-item rounded-xl border ${isLive ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'} p-4 shadow-sm">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-red-600">${escapeProgramHtml(program.time)}</p>
              <h3 class="mt-1 text-xl font-bold text-gray-900">${escapeProgramHtml(program.title)}</h3>
              <p class="mt-1 text-sm text-gray-600">Hosted by ${escapeProgramHtml(program.host)}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="rounded-full border border-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-700">${escapeProgramHtml(program.type)}</span>
              ${isLive ? '<span class="rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white">Live</span>' : ''}
              ${isNext ? '<span class="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-700">Up next</span>' : ''}
              ${isPast && !isLive ? '<span class="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-600">Earlier</span>' : ''}
            </div>
          </div>
          <p class="mt-3 text-sm leading-6 text-gray-700">${escapeProgramHtml(program.summary)}</p>
        </div>
      `;
    }).join('');
  }

  document.querySelectorAll('.day-btn').forEach((button) => {
    const day = button.getAttribute('data-day');
    const active = (activeDay === 'Today' && day === 'today') || (activeDay !== 'Today' && day === activeDay.toLowerCase());
    button.classList.toggle('btn-primary', active);
    button.classList.toggle('btn-secondary', !active);
  });
}

function selectDay(event, dayName) {
  scheduleState.selectedDay = dayName;
  renderSchedule();
  renderWeekOverview();

  if (event && event.currentTarget) {
    document.querySelectorAll('.day-btn').forEach((button) => button.classList.remove('ring-2', 'ring-red-300'));
    event.currentTarget.classList.add('ring-2', 'ring-red-300');
  }
}

function setReminder() {
  const activeDay = scheduleState.selectedDay || 'Today';
  const programs = getProgramsForDay(activeDay);
  const activeProgram = activeDay === 'Today' ? getCurrentProgram(programs) : programs[0];

  const message = activeProgram ? `Reminder set for ${activeProgram.title} at ${activeProgram.time}.` : 'No program selected for reminder.';
  alert(message);
}

function shareSchedule() {
  const day = scheduleState.selectedDay || 'Today';
  const programs = getProgramsForDay(day);
  const text = `BWE TV schedule for ${day}: ${programs.slice(0, 4).map((program) => `${program.time} ${program.title}`).join(' • ')}`;

  if (navigator.share) {
    navigator.share({ title: 'BWE TV Program Schedule', text }).catch(() => {});
    return;
  }

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => alert('Schedule copied to clipboard.'));
    return;
  }

  alert(text);
}

function downloadSchedule() {
  const day = scheduleState.selectedDay || 'Today';
  const programs = getProgramsForDay(day);
  const text = programs.map((program) => `${program.time} - ${program.title} (${program.type}) - ${program.host}`).join('\n');
  const blob = new Blob([`BWE TV ${day} Schedule\n\n${text}`], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bwe-tv-${String(day).toLowerCase()}-schedule.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function initializeProgramExperience() {
  renderFeaturedPrograms();
  initProgramInteractions();
  renderWeekOverview();
  renderSchedule();
}

if (typeof window !== 'undefined') {
  window.BWEScheduleDefaults = JSON.parse(JSON.stringify(PROGRAM_DATA));
  window.applyBWESchedule = function (days) {
    if (!days || typeof days !== 'object' || Array.isArray(days)) return;
    for (const day of DAYS_OF_WEEK) {
      if (!Array.isArray(days[day])) continue;
      PROGRAM_DATA[day] = days[day].filter((program) => {
        return program && typeof program === 'object'
          && typeof program.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(program.time)
          && typeof program.title === 'string'
          && typeof program.host === 'string'
          && typeof program.summary === 'string'
          && typeof program.type === 'string';
      }).map((program) => ({
        time: program.time.slice(0, 5),
        title: program.title.slice(0, 160),
        host: program.host.slice(0, 120),
        summary: program.summary.slice(0, 500),
        type: program.type.slice(0, 60)
      })).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    }
    renderFeaturedPrograms();
    renderLiveProgramStatus();
    renderWeekOverview();
    renderSchedule();
  };
  window.selectDay = selectDay;
  window.setReminder = setReminder;
  window.shareSchedule = shareSchedule;
  window.downloadSchedule = downloadSchedule;
  window.scheduleState = scheduleState;
}

document.addEventListener('DOMContentLoaded', initializeProgramExperience);
