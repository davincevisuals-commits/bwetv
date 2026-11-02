(() => {
  const firebaseConfig = {
    apiKey: "AIzaSyCg9fxgrXlEuKW_m5MvDnG26Uf6lLdiYik",
    authDomain: "bwetv-ug.firebaseapp.com",
    projectId: "bwetv-ug",
    storageBucket: "bwetv-ug.firebasestorage.app",
    messagingSenderId: "481870926362",
    appId: "1:481870926362:web:f406a0f135449ccfaa77a3"
  };

  const elements = {
    loginForm: document.getElementById("loginForm"),
    loginStatus: document.getElementById("loginStatus"),
    loginPanel: document.getElementById("loginPanel"),
    dashboardPanel: document.getElementById("dashboardPanel"),
    logoutButton: document.getElementById("logoutButton"),
    showForm: document.getElementById("showForm"),
    showList: document.getElementById("showList"),
    resetShowFormButton: document.getElementById("resetShowFormButton"),
    formTitle: document.getElementById("formTitle"),
    refreshShowsButton: document.getElementById("refreshShowsButton"),
    episodeForm: document.getElementById("episodeForm"),
    episodeList: document.getElementById("episodeList"),
    resetEpisodeFormButton: document.getElementById("resetEpisodeFormButton"),
    refreshEpisodesButton: document.getElementById("refreshEpisodesButton"),
    saveSettingsButton: document.getElementById("saveSettingsButton"),
    settingsForm: document.getElementById("settingsForm"),
    tabs: [...document.querySelectorAll("[data-tab]")],
    tabsContent: {
      shows: document.getElementById("showsTab"),
      episodes: document.getElementById("episodesTab"),
      settings: document.getElementById("settingsTab")
    }
  };

  const state = {
    editingShowId: null,
    editingEpisodeId: null,
    activeTab: "shows"
  };

  function normalizeSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item";
  }

  function setStatus(message, isError = false) {
    if (!elements.loginStatus) return;
    elements.loginStatus.textContent = message;
    elements.loginStatus.className = "mt-4 text-sm " + (isError ? "text-red-600" : "text-gray-600");
  }

  function initializeFirebase() {
    if (!window.firebase || !window.firebase.apps) throw new Error("Firebase SDK did not load.");
    if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
    return window.firebase.firestore();
  }

  function getInputValue(id) {
    const element = document.getElementById(id);
    return element ? element.value : "";
  }

  function setTab(tabName) {
    state.activeTab = tabName;

    Object.entries(elements.tabsContent).forEach(([key, node]) => {
      if (node) node.classList.toggle("hidden", key !== tabName);
    });

    elements.tabs.forEach((button) => {
      const active = button.dataset.tab === tabName;
      button.classList.toggle("active", active);
    });
  }

  function resetShowForm() {
    state.editingShowId = null;
    elements.formTitle.textContent = "Add a new show";
    elements.showForm.reset();
    document.getElementById("showRatingInput").value = "4.5";
    document.getElementById("showEpisodesInput").value = "12";
    document.getElementById("showActiveInput").checked = true;
    document.getElementById("showIdInput").value = "";
  }

  function populateShowForm(show) {
    state.editingShowId = show.id;
    elements.formTitle.textContent = "Edit show";
    document.getElementById("showIdInput").value = show.id || "";
    document.getElementById("showNameInput").value = show.name || "";
    document.getElementById("showCategoryInput").value = show.category || "";
    document.getElementById("showHostInput").value = show.host || "";
    document.getElementById("showIconInput").value = show.icon || "📺";
    document.getElementById("showAccentInput").value = show.accent || "from-red-500 to-orange-400";
    document.getElementById("showRatingInput").value = show.rating ?? 4.5;
    document.getElementById("showEpisodesInput").value = show.episodes ?? 0;
    document.getElementById("showDescriptionInput").value = show.description || "";
    document.getElementById("showActiveInput").checked = show.active !== false;
    setTab("shows");
  }

  function renderShows(shows) {
    if (!elements.showList) return;

    if (!shows.length) {
      elements.showList.innerHTML = '<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">No shows available yet.</div>';
      return;
    }

    elements.showList.innerHTML = shows.map((show) => `
      <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] ${show.active === false ? "text-gray-500" : "text-red-600"}">${show.category || "General"}</p>
            <h4 class="mt-1 text-lg font-bold text-gray-900">${show.name}</h4>
            <p class="text-sm text-gray-600">${show.host}</p>
            <p class="mt-1 text-xs ${show.active === false ? "text-gray-500" : "text-green-600"}">${show.active === false ? "Draft" : "Published"}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" data-show-edit="${show.id}" class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">Edit</button>
            <button type="button" data-show-toggle="${show.id}" class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100">${show.active === false ? "Publish" : "Draft"}</button>
            <button type="button" data-show-delete="${show.id}" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Delete</button>
          </div>
        </div>
      </div>
    `).join("");

    elements.showList.querySelectorAll("[data-show-edit]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-show-edit");
        const show = shows.find((item) => item.id === id);
        if (show) populateShowForm(show);
      });
    });

    elements.showList.querySelectorAll("[data-show-toggle]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.getAttribute("data-show-toggle");
        const show = shows.find((item) => item.id === id);
        if (!show) return;

        try {
          const db = initializeFirebase();
          await db.collection("shows").doc(id).update({ active: !show.active, updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() });
          await loadShows();
        } catch (error) {
          console.error("Toggle failed", error);
          setStatus("Unable to change publish state.", true);
        }
      });
    });

    elements.showList.querySelectorAll("[data-show-delete]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.getAttribute("data-show-delete");
        if (!id) return;
        const confirmed = window.confirm("Delete this show from the site?");
        if (!confirmed) return;

        try {
          const db = initializeFirebase();
          await db.collection("shows").doc(id).delete();
          await loadShows();
        } catch (error) {
          console.error("Delete failed", error);
          setStatus("Delete failed: " + (error.message || "unknown error"), true);
        }
      });
    });
  }

  async function loadShows() {
    try {
      const db = initializeFirebase();
      const snapshot = await db.collection("shows").orderBy("name").get();
      const shows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderShows(shows);
      return shows;
    } catch (error) {
      console.error("Unable to load shows", error);
      setStatus("Could not load shows from Firestore.", true);
      renderShows([]);
      return [];
    }
  }

  async function saveShow(event) {
    event.preventDefault();

    try {
      const db = initializeFirebase();
      const payload = {
        id: getInputValue("showIdInput").trim(),
        name: getInputValue("showNameInput").trim(),
        category: getInputValue("showCategoryInput").trim(),
        host: getInputValue("showHostInput").trim(),
        icon: getInputValue("showIconInput").trim() || "📺",
        accent: getInputValue("showAccentInput").trim() || "from-red-500 to-orange-400",
        rating: Number(getInputValue("showRatingInput") || 4.5),
        episodes: Number(getInputValue("showEpisodesInput") || 0),
        description: getInputValue("showDescriptionInput").trim(),
        active: document.getElementById("showActiveInput").checked
      };

      if (!payload.name || !payload.category || !payload.host || !payload.description) {
        setStatus("Please complete all required fields.", true);
        return;
      }

      const showId = payload.id || normalizeSlug(payload.name);
      const record = {
        id: showId,
        name: payload.name,
        category: payload.category,
        host: payload.host,
        icon: payload.icon,
        accent: payload.accent,
        rating: Number.isFinite(payload.rating) ? payload.rating : 4.5,
        episodes: Number.isFinite(payload.episodes) ? payload.episodes : 0,
        description: payload.description,
        active: payload.active !== false,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("shows").doc(showId).set(record, { merge: true });
      setStatus("Show saved successfully.");
      resetShowForm();
      await loadShows();
    } catch (error) {
      console.error("Unable to save show", error);
      setStatus("Unable to save show: " + (error.message || "unknown error"), true);
    }
  }

  function resetEpisodeForm() {
    state.editingEpisodeId = null;
    elements.episodeFormTitle.textContent = "Add a new episode";
    elements.episodeForm.reset();
    document.getElementById("episodeSeasonInput").value = "1";
    document.getElementById("episodeNumberInput").value = "1";
    document.getElementById("episodeStatusInput").value = "draft";
    document.getElementById("episodeActiveInput").checked = true;
    document.getElementById("episodeIdInput").value = "";
    document.getElementById("episodeDateInput").valueAsDate = new Date();
  }

  function populateEpisodeForm(episode) {
    state.editingEpisodeId = episode.id;
    elements.episodeFormTitle.textContent = "Edit episode";
    document.getElementById("episodeIdInput").value = episode.id || "";
    document.getElementById("episodeShowIdInput").value = episode.showId || "";
    document.getElementById("episodeTitleInput").value = episode.title || "";
    document.getElementById("episodeSeasonInput").value = episode.seasonNumber ?? 1;
    document.getElementById("episodeNumberInput").value = episode.episodeNumber ?? 1;
    document.getElementById("episodeVideoIdInput").value = episode.videoId || "";
    document.getElementById("episodeVideoUrlInput").value = episode.videoUrl || "";
    document.getElementById("episodeDescriptionInput").value = episode.description || "";
    document.getElementById("episodeStatusInput").value = episode.status || "draft";
    document.getElementById("episodeActiveInput").checked = episode.status !== "draft";
    if (episode.publishedAt && typeof episode.publishedAt.toDate === "function") {
      const date = episode.publishedAt.toDate();
      document.getElementById("episodeDateInput").value = date.toISOString().split("T")[0];
    } else if (episode.publishedAt) {
      const date = new Date(episode.publishedAt);
      document.getElementById("episodeDateInput").value = date.toISOString().split("T")[0];
    }
    setTab("episodes");
  }

  function renderEpisodes(episodes) {
    if (!elements.episodeList) return;

    if (!episodes.length) {
      elements.episodeList.innerHTML = '<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">No episodes yet. Add your first episode.</div>';
      return;
    }

    elements.episodeList.innerHTML = episodes.map((episode) => `
      <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">${episode.showId || "General"}</p>
            <h4 class="mt-1 text-lg font-bold text-gray-900">${episode.title}</h4>
            <p class="text-sm text-gray-600">S${episode.seasonNumber || 1} · E${episode.episodeNumber || 1}</p>
            <p class="mt-1 text-xs ${episode.status === "published" ? "text-green-600" : "text-gray-500"}">${episode.status === "published" ? "Published" : "Draft"}</p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" data-episode-edit="${episode.id}" class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">Edit</button>
            <button type="button" data-episode-toggle="${episode.id}" class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100">${episode.status === "published" ? "Draft" : "Publish"}</button>
            <button type="button" data-episode-delete="${episode.id}" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Delete</button>
          </div>
        </div>
      </div>
    `).join("");

    elements.episodeList.querySelectorAll("[data-episode-edit]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-episode-edit");
        const episode = episodes.find((item) => item.id === id);
        if (episode) populateEpisodeForm(episode);
      });
    });

    elements.episodeList.querySelectorAll("[data-episode-toggle]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.getAttribute("data-episode-toggle");
        const episode = episodes.find((item) => item.id === id);
        if (!episode) return;

        try {
          const db = initializeFirebase();
          await db.collection("episodes").doc(id).update({ status: episode.status === "published" ? "draft" : "published", updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() });
          await loadEpisodes();
        } catch (error) {
          console.error("Episode toggle failed", error);
          setStatus("Unable to change episode status.", true);
        }
      });
    });

    elements.episodeList.querySelectorAll("[data-episode-delete]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = button.getAttribute("data-episode-delete");
        if (!id) return;
        const confirmed = window.confirm("Delete this episode?");
        if (!confirmed) return;

        try {
          const db = initializeFirebase();
          await db.collection("episodes").doc(id).delete();
          await loadEpisodes();
        } catch (error) {
          console.error("Delete episode failed", error);
          setStatus("Delete failed: " + (error.message || "unknown error"), true);
        }
      });
    });
  }

  async function loadEpisodes() {
    try {
      const db = initializeFirebase();
      const snapshot = await db.collection("episodes").orderBy("publishedAt", "desc").get();
      const episodes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      renderEpisodes(episodes);
      return episodes;
    } catch (error) {
      console.error("Unable to load episodes", error);
      setStatus("Could not load episodes from Firestore.", true);
      renderEpisodes([]);
      return [];
    }
  }

  async function saveEpisode(event) {
    event.preventDefault();

    try {
      const db = initializeFirebase();
      const videoId = getInputValue("episodeVideoIdInput").trim();
      const videoUrl = getInputValue("episodeVideoUrlInput").trim();
      const status = document.getElementById("episodeStatusInput").value || "draft";
      const luxuryDate = getInputValue("episodeDateInput");
      const publishedAt = luxuryDate ? new Date(`${luxuryDate}T12:00:00`) : new Date();

      const payload = {
        id: getInputValue("episodeIdInput").trim(),
        showId: getInputValue("episodeShowIdInput").trim(),
        title: getInputValue("episodeTitleInput").trim(),
        seasonNumber: Number(getInputValue("episodeSeasonInput") || 1),
        episodeNumber: Number(getInputValue("episodeNumberInput") || 1),
        videoId: videoId || "",
        videoUrl: videoUrl || "",
        description: getInputValue("episodeDescriptionInput").trim(),
        status,
        publishedAt: window.firebase.firestore.Timestamp.fromDate(publishedAt),
        active: document.getElementById("episodeActiveInput").checked
      };

      if (!payload.showId || !payload.title) {
        setStatus("Please fill in the show ID and episode title.", true);
        return;
      }

      const episodeId = payload.id || normalizeSlug(`${payload.showId}-${payload.title}`);
      const record = {
        id: episodeId,
        showId: payload.showId,
        title: payload.title,
        seasonNumber: Number.isFinite(payload.seasonNumber) ? payload.seasonNumber : 1,
        episodeNumber: Number.isFinite(payload.episodeNumber) ? payload.episodeNumber : 1,
        videoId: payload.videoId,
        videoUrl: payload.videoUrl,
        description: payload.description,
        status: payload.status === "published" || payload.active ? "published" : "draft",
        publishedAt: window.firebase.firestore.Timestamp.fromDate(publishedAt),
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("episodes").doc(episodeId).set(record, { merge: true });
      setStatus("Episode saved successfully.");
      resetEpisodeForm();
      await loadEpisodes();
    } catch (error) {
      console.error("Unable to save episode", error);
      setStatus("Unable to save episode: " + (error.message || "unknown error"), true);
    }
  }

  function loadSettingsDefaults() {
    return {
      siteName: "BWE TV",
      siteTagline: "Community stories, local voices, live moments.",
      liveStreamUrl: "",
      contactEmail: "bwetv.ug@gmail.com",
      youtubeUrl: "",
      facebookUrl: "",
      instagramUrl: "",
      brandColor: "#bf1506",
      accentColor: "#facc15",
      heroImage: ""
    };
  }

  function applySettingsToForm(settings) {
    const values = { ...loadSettingsDefaults(), ...settings };
    document.getElementById("siteNameInput").value = values.siteName || "";
    document.getElementById("siteTaglineInput").value = values.siteTagline || "";
    document.getElementById("liveStreamUrlInput").value = values.liveStreamUrl || "";
    document.getElementById("contactEmailInput").value = values.contactEmail || "";
    document.getElementById("youtubeUrlInput").value = values.youtubeUrl || "";
    document.getElementById("facebookUrlInput").value = values.facebookUrl || "";
    document.getElementById("instagramUrlInput").value = values.instagramUrl || "";
    document.getElementById("brandColorInput").value = values.brandColor || "#bf1506";
    document.getElementById("accentColorInput").value = values.accentColor || "#facc15";
    document.getElementById("heroImageInput").value = values.heroImage || "";
  }

  async function loadSettings() {
    try {
      const db = initializeFirebase();
      const snapshot = await db.collection("settings").doc("site").get();
      if (snapshot.exists) {
        applySettingsToForm(snapshot.data());
      } else {
        applySettingsToForm(loadSettingsDefaults());
      }
    } catch (error) {
      console.error("Unable to load settings", error);
      applySettingsToForm(loadSettingsDefaults());
    }
  }

  async function saveSettings() {
    try {
      const db = initializeFirebase();
      const settings = {
        siteName: getInputValue("siteNameInput").trim() || "BWE TV",
        siteTagline: getInputValue("siteTaglineInput").trim() || "Community stories, local voices, live moments.",
        liveStreamUrl: getInputValue("liveStreamUrlInput").trim(),
        contactEmail: getInputValue("contactEmailInput").trim(),
        youtubeUrl: getInputValue("youtubeUrlInput").trim(),
        facebookUrl: getInputValue("facebookUrlInput").trim(),
        instagramUrl: getInputValue("instagramUrlInput").trim(),
        brandColor: getInputValue("brandColorInput").trim() || "#bf1506",
        accentColor: getInputValue("accentColorInput").trim() || "#facc15",
        heroImage: getInputValue("heroImageInput").trim(),
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("settings").doc("site").set(settings, { merge: true });
      setStatus("Settings saved successfully.");
    } catch (error) {
      console.error("Unable to save settings", error);
      setStatus("Unable to save settings: " + (error.message || "unknown error"), true);
    }
  }

  async function signIn(email, password) {
    const auth = window.firebase.auth();
    await auth.signInWithEmailAndPassword(email, password);
  }

  function updateAuthView(user) {
    if (!elements.loginPanel || !elements.dashboardPanel) return;

    if (user) {
      elements.loginPanel.classList.add("hidden");
      elements.dashboardPanel.classList.remove("hidden");
      setStatus("Signed in successfully.");
      Promise.all([loadShows(), loadEpisodes(), loadSettings()]);
    } else {
      elements.loginPanel.classList.remove("hidden");
      elements.dashboardPanel.classList.add("hidden");
      setStatus("Waiting for login.");
    }
  }

  elements.tabs.forEach((button) => {
    button.addEventListener("click", () => setTab(button.dataset.tab));
  });

  elements.loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = getInputValue("emailInput").trim();
    const password = getInputValue("passwordInput").trim();

    if (!email || !password) {
      setStatus("Enter both email and password.", true);
      return;
    }

    try {
      initializeFirebase();
      await signIn(email, password);
    } catch (error) {
      console.error("Login failed", error);
      setStatus(error.message || "Login failed.", true);
    }
  });

  elements.logoutButton.addEventListener("click", async () => {
    try {
      await window.firebase.auth().signOut();
    } catch (error) {
      console.error("Logout failed", error);
    }
  });

  elements.showForm.addEventListener("submit", saveShow);
  elements.episodeForm.addEventListener("submit", saveEpisode);
  elements.saveSettingsButton.addEventListener("click", saveSettings);
  elements.resetShowFormButton.addEventListener("click", resetShowForm);
  elements.resetEpisodeFormButton.addEventListener("click", resetEpisodeForm);
  elements.refreshShowsButton.addEventListener("click", loadShows);
  elements.refreshEpisodesButton.addEventListener("click", loadEpisodes);

  document.addEventListener("DOMContentLoaded", () => {
    resetShowForm();
    resetEpisodeForm();
    setTab("shows");

    if (!window.firebase) {
      setStatus("Firebase SDK is not available. Check admin script tags.", true);
      return;
    }

    if (!window.firebase.apps.length) {
      try {
        window.firebase.initializeApp(firebaseConfig);
      } catch (error) {
        console.error("Unable to initialize Firebase", error);
      }
    }

    const auth = window.firebase.auth();
    auth.onAuthStateChanged((user) => updateAuthView(user));
  });
})();
