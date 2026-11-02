(() => {
  const firebaseConfig = {
    apiKey: "AIzaSyCg9fxgrXlEuKW_m5MvDnG26Uf6lLdiYik",
    authDomain: "bwetv-ug.firebaseapp.com",
    projectId: "bwetv-ug",
    storageBucket: "bwetv-ug.firebasestorage.app",
    messagingSenderId: "481870926362",
    appId: "1:481870926362:web:f406a0f135449ccfaa77a3"
  };

  const loginForm = document.getElementById("loginForm");
  const loginStatus = document.getElementById("loginStatus");
  const loginPanel = document.getElementById("loginPanel");
  const dashboardPanel = document.getElementById("dashboardPanel");
  const logoutButton = document.getElementById("logoutButton");
  const showForm = document.getElementById("showForm");
  const showList = document.getElementById("showList");
  const resetFormButton = document.getElementById("resetFormButton");
  const formTitle = document.getElementById("formTitle");
  const refreshShowsButton = document.getElementById("refreshShowsButton");

  const state = {
    editingId: null,
    db: null
  };

  function normalizeSlug(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "show";
  }

  function setStatus(message, isError = false) {
    if (!loginStatus) return;
    loginStatus.textContent = message;
    loginStatus.className = "mt-4 text-sm " + (isError ? "text-red-600" : "text-gray-600");
  }

  function initializeFirebase() {
    if (!window.firebase || !window.firebase.apps) {
      throw new Error("Firebase SDK did not load.");
    }

    if (!window.firebase.apps.length) {
      window.firebase.initializeApp(firebaseConfig);
    }

    state.db = window.firebase.firestore();
    return state.db;
  }

  function resetForm() {
    state.editingId = null;
    formTitle.textContent = "Add a new show";
    showForm.reset();
    document.getElementById("showRatingInput").value = "4.5";
    document.getElementById("showEpisodesInput").value = "12";
    document.getElementById("showActiveInput").checked = true;
    document.getElementById("showIdInput").value = "";
  }

  function populateForm(show) {
    state.editingId = show.id;
    formTitle.textContent = "Edit show";
    document.getElementById("showIdInput").value = show.id || "";
    document.getElementById("showNameInput").value = show.name || "";
    document.getElementById("showCategoryInput").value = show.category || "";
    document.getElementById("showHostInput").value = show.host || "";
    document.getElementById("showIconInput").value = show.icon || "";
    document.getElementById("showAccentInput").value = show.accent || "from-red-500 to-orange-400";
    document.getElementById("showRatingInput").value = show.rating ?? 4.5;
    document.getElementById("showEpisodesInput").value = show.episodes ?? 0;
    document.getElementById("showDescriptionInput").value = show.description || "";
    document.getElementById("showActiveInput").checked = show.active !== false;
  }

  function renderShows(shows) {
    if (!showList) return;

    if (!shows.length) {
      showList.innerHTML = '<div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">No shows available yet.</div>';
      return;
    }

    showList.innerHTML = shows.map((show) => `
      <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-[10px] font-bold uppercase tracking-[0.2em] text-red-600">${show.category || "General"}</p>
            <h4 class="mt-1 text-lg font-bold text-gray-900">${show.name}</h4>
            <p class="text-sm text-gray-600">${show.host}</p>
          </div>
          <div class="flex gap-2">
            <button type="button" data-edit-id="${show.id}" class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">Edit</button>
            <button type="button" data-delete-id="${show.id}" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">Delete</button>
          </div>
        </div>
      </div>
    `).join("");

    showList.querySelectorAll("[data-edit-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const showId = button.getAttribute("data-edit-id");
        const show = shows.find((item) => item.id === showId);
        if (show) populateForm(show);
      });
    });

    showList.querySelectorAll("[data-delete-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const showId = button.getAttribute("data-delete-id");
        if (!showId) return;
        const shouldDelete = window.confirm("Delete this show from the website?");
        if (!shouldDelete) return;

        try {
          const db = initializeFirebase();
          await db.collection("shows").doc(showId).delete();
          await loadShows();
        } catch (error) {
          console.error("Unable to delete show", error);
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
        id: document.getElementById("showIdInput").value.trim(),
        name: document.getElementById("showNameInput").value.trim(),
        category: document.getElementById("showCategoryInput").value.trim(),
        host: document.getElementById("showHostInput").value.trim(),
        icon: document.getElementById("showIconInput").value.trim() || "📺",
        accent: document.getElementById("showAccentInput").value.trim() || "from-red-500 to-orange-400",
        rating: Number(document.getElementById("showRatingInput").value || 4.5),
        episodes: Number(document.getElementById("showEpisodesInput").value || 0),
        description: document.getElementById("showDescriptionInput").value.trim(),
        active: document.getElementById("showActiveInput").checked
      };

      if (!payload.name || !payload.category || !payload.host || !payload.description) {
        setStatus("Please complete all required fields.", true);
        return;
      }

      const id = payload.id || normalizeSlug(payload.name);
      const record = {
        id,
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

      await db.collection("shows").doc(id).set(record, { merge: true });
      setStatus("Show saved successfully.");
      resetForm();
      await loadShows();
    } catch (error) {
      console.error("Unable to save show", error);
      setStatus("Unable to save show: " + (error.message || "unknown error"), true);
    }
  }

  async function signIn(email, password) {
    const auth = window.firebase.auth();
    await auth.signInWithEmailAndPassword(email, password);
  }

  function updateAuthView(user) {
    if (!loginPanel || !dashboardPanel) return;

    if (user) {
      loginPanel.classList.add("hidden");
      dashboardPanel.classList.remove("hidden");
      setStatus("Signed in successfully.");
      loadShows();
    } else {
      loginPanel.classList.remove("hidden");
      dashboardPanel.classList.add("hidden");
      setStatus("Waiting for login.");
    }
  }

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = document.getElementById("emailInput").value.trim();
      const password = document.getElementById("passwordInput").value.trim();

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
  }

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await window.firebase.auth().signOut();
      } catch (error) {
        console.error("Logout failed", error);
      }
    });
  }

  if (showForm) {
    showForm.addEventListener("submit", saveShow);
  }

  if (resetFormButton) {
    resetFormButton.addEventListener("click", resetForm);
  }

  if (refreshShowsButton) {
    refreshShowsButton.addEventListener("click", loadShows);
  }

  document.addEventListener("DOMContentLoaded", () => {
    resetForm();

    if (!window.firebase) {
      setStatus("Firebase SDK is not available. Check the admin page script tags.", true);
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
    auth.onAuthStateChanged((user) => {
      updateAuthView(user);
    });
  });
})();
