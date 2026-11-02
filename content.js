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

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long' });
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
  if (!programs.length) return null;

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();

  for (let index = 0; index < programs.length; index += 1) {
    const program = programs[index];
    const start = timeToMinutes(program.time);
    const end = index < programs.length - 1 ? timeToMinutes(programs[index + 1].time) : start + 90;
    if (nowMinutes >= start && nowMinutes < end) {
      return program;
    }
  }

  return programs[0];
}

function getNextProgram(programs) {
  if (!programs.length) return null;

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  return programs.find((program) => timeToMinutes(program.time) > nowMinutes) || programs[0];
}

function renderFeaturedPrograms() {
  const container = document.getElementById('featured-programs');
  if (!container) return;

  const programs = getProgramsForDay('Today').slice(0, 3);
  const activeProgram = getCurrentProgram(getProgramsForDay('Today'));

  container.innerHTML = programs.map((program) => {
    const isNow = activeProgram && activeProgram.title === program.title;
    return `
      <article class="surface-card rounded-xl p-4 shadow-sm ${isNow ? 'ring-2 ring-red-300' : ''}">
        <div class="flex items-center justify-between gap-3 mb-3">
          <span class="rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-red-700">${program.type}</span>
          <span class="text-xs font-semibold text-gray-600">${program.time}</span>
        </div>
        <h3 class="text-xl font-bold text-gray-900">${program.title}</h3>
        <p class="mt-2 text-sm text-gray-600">${program.host}</p>
        <p class="mt-3 text-sm leading-6 text-gray-700">${program.summary}</p>
        ${isNow ? '<div class="mt-4 inline-flex rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white">Now airing</div>' : ''}
      </article>
    `;
  }).join('');
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
        <div class="mt-2 text-sm font-bold">${first ? first.title : 'No data'}</div>
        <div class="mt-1 text-[11px] ${active ? 'text-red-100' : 'text-gray-500'}">${first ? first.time : '—'}</div>
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
      <p class="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-yellow-200">${activeDay === 'Today' ? 'Now airing' : 'Featured'}</p>
      <p class="text-2xl font-bold text-white">${currentProgram ? currentProgram.title : 'No programming available'}</p>
      <p class="mt-1 text-sm text-white/85">${currentProgram ? `${currentProgram.time} • ${currentProgram.host}` : 'Check back later'}</p>
      ${nextProgram ? `<p class="mt-2 text-xs text-white/80">Up next: ${nextProgram.title} at ${nextProgram.time}</p>` : ''}
    `;
  }

  if (container) {
    container.innerHTML = programs.map((program, index) => {
      const isLive = activeDay === 'Today' && currentProgram && currentProgram.title === program.title;
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const programMinutes = timeToMinutes(program.time);
      const isNext = activeDay === 'Today' && nextProgram && program.title === nextProgram.title && !isLive;
      const isPast = activeDay === 'Today' && programMinutes < nowMinutes && !isLive;

      return `
        <div class="schedule-item rounded-xl border ${isLive ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'} p-4 shadow-sm">
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.2em] text-red-600">${program.time}</p>
              <h3 class="mt-1 text-xl font-bold text-gray-900">${program.title}</h3>
              <p class="mt-1 text-sm text-gray-600">Hosted by ${program.host}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="rounded-full border border-gray-200 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-700">${program.type}</span>
              ${isLive ? '<span class="rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white">Live</span>' : ''}
              ${isNext ? '<span class="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-700">Up next</span>' : ''}
              ${isPast && !isLive ? '<span class="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-600">Earlier</span>' : ''}
            </div>
          </div>
          <p class="mt-3 text-sm leading-6 text-gray-700">${program.summary}</p>
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
  renderWeekOverview();
  renderSchedule();
}

if (typeof window !== 'undefined') {
  window.selectDay = selectDay;
  window.setReminder = setReminder;
  window.shareSchedule = shareSchedule;
  window.downloadSchedule = downloadSchedule;
  window.scheduleState = scheduleState;
}

document.addEventListener('DOMContentLoaded', initializeProgramExperience);
