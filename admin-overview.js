(() => {
  const $ = (id) => document.getElementById(id);
  let allowed = false;
  let generation = 0;
  let schedule = null;

  function renderSchedule() {
    if (!schedule) return;
    const box = $("overviewSchedule");
    const { day, minutes } = getBroadcastTime();
    const days = schedule.days;
    if (days != null && (typeof days !== "object" || Array.isArray(days))) {
      box.textContent = "Schedule unavailable: saved schedule is invalid.";
      return;
    }
    const estimated = !days || !Object.prototype.hasOwnProperty.call(days, day);
    const programs = estimated ? window.BWEScheduleDefaults?.[day] : days[day];
    if (!Array.isArray(programs) || programs.some((program) =>
      !program || typeof program.title !== "string" || !program.title.trim()
      || typeof program.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(program.time)
      || typeof program.host !== "string" || typeof program.summary !== "string" || typeof program.type !== "string")) {
      box.textContent = "Schedule unavailable: today's lineup is invalid.";
      return;
    }
    const sorted = [...programs].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
    const current = sorted.find((_, index) => getProgramStatus(sorted, index, minutes) === "live");
    const upcoming = sorted.filter((_, index) => getProgramStatus(sorted, index, minutes) === "upcoming");
    box.replaceChildren();
    const addLine = (text) => {
      const line = document.createElement("p");
      line.textContent = text;
      box.appendChild(line);
    };
    addLine(`${day}${estimated ? " — estimated default schedule" : " — saved schedule"}`);
    addLine(current ? `Current: ${formatProgramTime(current.time)} — ${current.title}` : "No program currently scheduled.");
    if (!upcoming.length) addLine("No more programs scheduled today.");
    upcoming.forEach((program) => addLine(`Upcoming: ${formatProgramTime(program.time)} — ${program.title}`));
  }

  function refresh() {
    if (!allowed) return;
    const request = ++generation;
    schedule = null;
    const ids = ["overviewShows", "overviewEpisodes", "overviewInquiries", "overviewStream",
      "overviewDraftShows", "overviewDraftEpisodes", "overviewDraftPages", "overviewNewInquiries", "overviewSchedule"];
    ids.forEach((id) => { $(id).textContent = "Loading..."; });
    const db = window.firebase.firestore();
    const load = (name, query, success, failureIds) => {
      Promise.resolve().then(() => query.get({ source: "server" })).then((snapshot) => {
        if (allowed && request === generation) success(snapshot);
      }).catch((error) => {
        if (!allowed || request !== generation) return;
        console.error(`Unable to load overview ${name}`, error);
        failureIds.forEach((id) => { $(id).textContent = "Unavailable — refresh to retry."; });
      });
    };
    load("shows", db.collection("shows"), (snapshot) => {
      const shows = snapshot.docs.map((doc) => doc.data());
      $("overviewShows").textContent = String(shows.length);
      $("overviewDraftShows").textContent = `${shows.filter((show) => show.active === false).length} draft shows.`;
    }, ["overviewShows", "overviewDraftShows"]);
    load("episodes", db.collection("episodes"), (snapshot) => {
      const episodes = snapshot.docs.map((doc) => doc.data());
      $("overviewEpisodes").textContent = String(episodes.length);
      $("overviewDraftEpisodes").textContent = `${episodes.filter((episode) => episode.status !== "published").length} draft episodes.`;
    }, ["overviewEpisodes", "overviewDraftEpisodes"]);
    load("pages", db.collection("pages"), (snapshot) => {
      const pages = snapshot.docs.map((doc) => doc.data());
      $("overviewDraftPages").textContent = `${pages.filter((page) => page.status !== "published").length} draft pages.`;
    }, ["overviewDraftPages"]);
    load("inquiries", db.collection("adBookings").where("status", "==", "new"), (snapshot) => {
      $("overviewInquiries").textContent = String(snapshot.size);
      $("overviewNewInquiries").textContent = `${snapshot.size} new advertising inquiries.`;
    }, ["overviewInquiries", "overviewNewInquiries"]);
    load("schedule", db.collection("settings").doc("programSchedule"), (snapshot) => {
      const data = snapshot.exists ? snapshot.data() : {};
      if (data.streamEnabled === true) $("overviewStream").textContent = "Marked online";
      else if (data.streamEnabled === false) $("overviewStream").textContent = "Marked offline";
      else if (data.streamEnabled == null) $("overviewStream").textContent = "Not set (site defaults online)";
      else $("overviewStream").textContent = "Unavailable — invalid setting.";
      schedule = data;
      renderSchedule();
    }, ["overviewStream", "overviewSchedule"]);
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("refreshOverviewButton").addEventListener("click", refresh);
    document.addEventListener("bwe-admin-auth", (event) => {
      allowed = Boolean(event.detail.user && ["admin", "editor"].includes(event.detail.role));
      generation += 1;
      schedule = null;
      if (allowed) refresh();
    });
    document.addEventListener("bwe-admin-tab", (event) => {
      if (event.detail.tab === "overview") refresh();
    });
    setInterval(() => { if (allowed && schedule) renderSchedule(); }, 60000);
  });
})();
