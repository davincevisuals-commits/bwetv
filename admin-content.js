(() => {
  const firebaseConfig = {
    apiKey: "AIzaSyCg9fxgrXlEuKW_m5MvDnG26Uf6lLdiYik",
    authDomain: "bwetv-ug.firebaseapp.com",
    databaseURL: "https://bwetv-ug-default-rtdb.firebaseio.com",
    projectId: "bwetv-ug",
    storageBucket: "bwetv-ug.firebasestorage.app",
    messagingSenderId: "481870926362",
    appId: "1:481870926362:web:f406a0f135449ccfaa77a3"
  };

  const pageDefaults = {
    home: {
      title: "BWE TV Live | Stream, Schedule & Community",
      description: "Watch BWE TV live, browse today’s programs, and join the community conversation from any device."
    },
    schedule: {
      title: "BWE TV Schedule | Daily Programming",
      description: "Browse the BWE TV daily programming schedule and see what is on air now."
    },
    shows: {
      title: "BWE TV Shows | Browse the Program Catalog",
      description: "Explore the BWE TV show catalog, filter by category, and discover your next programme to watch."
    },
    about: {
      title: "About BWE TV",
      description: "Learn about BWE TV, our community-first broadcasting mission, and how we connect audiences through news, culture, and live engagement.",
      body: "BWE TV is a Uganda-based broadcasting platform focused on community storytelling, informative programming, and accessible live engagement for viewers across districts and beyond.\n\nWe share live community-focused programming, daily schedules, show discovery, and interactive conversations through community chat.\n\nThe platform connects local audiences with timely news, cultural programming, wellness content, and entertainment while making participation simple on mobile and desktop."
    },
    contact: {
      title: "Contact BWE TV",
      description: "Contact BWE TV for partnerships, feedback, support, and community-related questions.",
      body: "For feedback, programme questions, or community follow-up, please reach out through the support channels already shared by BWE TV.\n\nVisit the community page for donation and partnership options, including PayPal.Me and MTN MoMo support."
    },
    community: {
      title: "Join the BWE TV Community",
      description: "Join the BWE TV community to chat live, share discussion posts, and support the network.",
      body: "Chat with viewers in real time, share your thoughts on the latest programmes, and support the mission behind BWE TV."
    },
    privacy: {
      title: "Privacy Notice",
      description: "Read the BWE TV privacy notice for website visitors, live chat participants, and community members.",
      body: "BWE TV uses basic website technologies and community tools to support live chat, account access, and site updates.\n\nIf you join the live chat or community area, your selected guest name or signed-in email identifier may be shown alongside your messages.\n\nUse the contact page for privacy questions or to request follow-up regarding published community content."
    }
  };
  const supportedDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const allowedBackupCollections = ["shows", "episodes", "settings", "pages", "media"];

  function getDb() {
    if (!window.firebase || !window.firebase.firestore) throw new Error("Firebase Firestore did not load.");
    if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
    return window.firebase.firestore();
  }

  function showStatus(message, isError = false) {
    const bar = document.getElementById("dashboardStatus");
    if (!bar) return;
    bar.textContent = message;
    bar.className = "sticky top-2 z-40 rounded-xl border px-4 py-3 text-sm font-semibold shadow " +
      (isError ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-800");
  }

  function getDateValue(value) {
    if (!value) return "";
    const date = value && typeof value.toDate === "function" ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  }

  function getPageFormData() {
    return {
      title: document.getElementById("cmsPageTitle").value.trim(),
      description: document.getElementById("cmsPageDescription").value.trim(),
      ogImage: document.getElementById("cmsPageOgImage").value.trim(),
      robots: document.getElementById("cmsPageRobots").value,
      twitterCard: document.getElementById("cmsPageTwitterCard").value,
      body: document.getElementById("cmsPageBody").value.trim(),
      status: document.getElementById("cmsPageStatus").value,
      publishAt: document.getElementById("cmsPublishAt").value
    };
  }

  function setPageFormData(page = {}, pageId) {
    const values = { ...pageDefaults[pageId], ...page };
    document.getElementById("cmsPageTitle").value = values.title || "";
    document.getElementById("cmsPageDescription").value = values.description || "";
    document.getElementById("cmsPageOgImage").value = values.ogImage || "";
    document.getElementById("cmsPageRobots").value = values.robots || "index,follow";
    document.getElementById("cmsPageTwitterCard").value = values.twitterCard || "summary_large_image";
    document.getElementById("cmsPageBody").value = values.body || "";
    document.getElementById("cmsPageBody").disabled = !["about", "contact", "community", "privacy"].includes(pageId);
    document.getElementById("cmsPageBody").placeholder = ["about", "contact", "community", "privacy"].includes(pageId)
      ? "Write plain text. Separate paragraphs with a blank line."
      : "This page supports metadata only; use Homepage Content for homepage copy.";
    document.getElementById("cmsPageStatus").value = values.status || "draft";
    document.getElementById("cmsPublishAt").value = getDateValue(values.publishAt);
  }

  function formatRevisionDate(value) {
    const date = value && typeof value.toDate === "function" ? value.toDate() : value ? new Date(value) : null;
    return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "Previous version";
  }

  function renderRevisions(snapshot, pageId) {
    const list = document.getElementById("cmsRevisionList");
    list.replaceChildren();
    if (snapshot.empty) {
      list.textContent = "No saved revisions yet.";
      return;
    }

    snapshot.forEach((doc) => {
      const revision = doc.data();
      const row = document.createElement("div");
      row.className = "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 p-3";
      const label = document.createElement("span");
      label.textContent = `${revision.title || "Untitled"} — ${formatRevisionDate(revision.archivedAt)}`;
      const restoreButton = document.createElement("button");
      restoreButton.type = "button";
      restoreButton.className = "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100";
      restoreButton.textContent = "Load into editor";
      restoreButton.addEventListener("click", () => {
        setPageFormData(revision, pageId);
        document.getElementById("cmsRevisionStatus").textContent = "Previous revision loaded. Save to publish or keep it as a draft.";
      });
      row.append(label, restoreButton);
      list.appendChild(row);
    });
  }

  async function loadPage() {
    const pageId = document.getElementById("cmsPageSelect").value;
    document.getElementById("cmsRevisionList").textContent = "Loading revisions…";
    document.getElementById("cmsRevisionStatus").textContent = "Loading page…";
    try {
      const db = getDb();
      const pageRef = db.collection("pages").doc(pageId);
      const [pageSnapshot, revisions] = await Promise.all([
        pageRef.get(),
        pageRef.collection("revisions").orderBy("archivedAt", "desc").limit(10).get()
      ]);
      setPageFormData(pageSnapshot.exists ? pageSnapshot.data() : {}, pageId);
      renderRevisions(revisions, pageId);
      document.getElementById("cmsRevisionStatus").textContent = pageSnapshot.exists
        ? `Current version: ${pageSnapshot.data().status || "draft"}.`
        : "No saved version; showing the built-in page content.";
    } catch (error) {
      console.error("Unable to load CMS page", error);
      document.getElementById("cmsRevisionList").textContent = "Could not load revisions.";
      document.getElementById("cmsRevisionStatus").textContent = "Could not load this page.";
      showStatus("Unable to load page content: " + (error.message || "unknown error"), true);
    }
  }

  function hasSafePublicUrl(value) {
    return !value || /^https:\/\//i.test(value);
  }

  async function savePage(event) {
    event.preventDefault();
    const pageId = document.getElementById("cmsPageSelect").value;
    const data = getPageFormData();
    if (!data.title) {
      showStatus("A page title is required.", true);
      return;
    }
    if (!hasSafePublicUrl(data.ogImage)) {
      showStatus("Open Graph image must use an https:// URL.", true);
      return;
    }

    try {
      const db = getDb();
      const pageRef = db.collection("pages").doc(pageId);
      const previous = await pageRef.get();
      const publishAt = data.publishAt ? new Date(data.publishAt) : null;
      if (publishAt && Number.isNaN(publishAt.getTime())) {
        showStatus("Enter a valid publish date.", true);
        return;
      }
      const next = {
        title: data.title,
        description: data.description,
        ogImage: data.ogImage,
        robots: data.robots,
        twitterCard: data.twitterCard,
        body: data.body,
        status: data.status,
        publishAt: publishAt ? window.firebase.firestore.Timestamp.fromDate(publishAt) : null,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      };
      const batch = db.batch();
      if (previous.exists) {
        const revisionRef = pageRef.collection("revisions").doc();
        batch.set(revisionRef, {
          ...previous.data(),
          archivedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      batch.set(pageRef, next, { merge: true });
      await batch.commit();
      showStatus(publishAt && publishAt.getTime() > Date.now() ? "Page saved; it will appear on the next visit after its publish date." : "Page saved successfully.");
      await loadPage();
    } catch (error) {
      console.error("Unable to save CMS page", error);
      showStatus("Unable to save page: " + (error.message || "unknown error"), true);
    }
  }

  async function loadHomeContent() {
    try {
      const snapshot = await getDb().collection("settings").doc("homeContent").get();
      const data = snapshot.exists ? snapshot.data() : {};
      document.getElementById("announcementInput").value = data.announcement || "";
      document.getElementById("homeHeadingInput").value = data.featuredHeading || "Today’s Programs";
      document.getElementById("homeIntroInput").value = data.featuredIntro || "Catch what is on now and what is coming up next across the BWE TV schedule.";
      document.getElementById("homeHeroHeadingInput").value = data.heroHeading || "Watch BWE TV live and stay connected with your community";
      document.getElementById("homeHeroIntroInput").value = data.heroIntro || "Community stories, local voices, and the moments that matter most — streamed live across Bweyale and beyond.";
      document.getElementById("homeHighlightsInput").value = JSON.stringify(data.highlights || [], null, 2);
    } catch (error) {
      console.error("Unable to load homepage settings", error);
      showStatus("Unable to load homepage content: " + (error.message || "unknown error"), true);
    }
  }

  async function saveHomeContent(event) {
    event.preventDefault();
    let highlights;
    try {
      highlights = JSON.parse(document.getElementById("homeHighlightsInput").value || "[]");
    } catch (error) {
      showStatus("Highlight cards must be valid JSON.", true);
      return;
    }
    if (!Array.isArray(highlights) || highlights.length > 12 || highlights.some((item) =>
      !item || typeof item !== "object" || Array.isArray(item)
      || typeof item.title !== "string" || typeof item.text !== "string"
      || (item.link && !/^(https:\/\/|\/|\.\/|[a-z0-9_-]+\.html(?:#[-\w]+)?)$/i.test(item.link)))) {
      showStatus("Use up to 12 highlight cards with title, text, and an optional safe link.", true);
      return;
    }

    try {
      await getDb().collection("settings").doc("homeContent").set({
        announcement: document.getElementById("announcementInput").value.trim().slice(0, 240),
        featuredHeading: document.getElementById("homeHeadingInput").value.trim().slice(0, 120),
        featuredIntro: document.getElementById("homeIntroInput").value.trim().slice(0, 300),
        heroHeading: document.getElementById("homeHeroHeadingInput").value.trim().slice(0, 160),
        heroIntro: document.getElementById("homeHeroIntroInput").value.trim().slice(0, 300),
        highlights: highlights.map((item) => ({
          title: item.title.trim().slice(0, 120),
          text: item.text.trim().slice(0, 500),
          link: typeof item.link === "string" ? item.link.trim().slice(0, 400) : ""
        })),
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      showStatus("Homepage content saved.");
    } catch (error) {
      console.error("Unable to save homepage content", error);
      showStatus("Unable to save homepage content: " + (error.message || "unknown error"), true);
    }
  }

  function validateSchedule(data) {
    if (!data || typeof data !== "object" || Array.isArray(data)) return false;
    return Object.entries(data).every(([day, programs]) =>
      supportedDays.includes(day) && Array.isArray(programs) && programs.length <= 50
      && programs.every((program) => program && typeof program === "object"
        && typeof program.time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(program.time)
        && typeof program.title === "string" && program.title.trim().length > 0 && program.title.length <= 160
        && typeof program.host === "string" && program.host.length <= 120
        && typeof program.summary === "string" && program.summary.length <= 500
        && typeof program.type === "string" && program.type.length <= 60));
  }

  async function loadSchedule() {
    try {
      const snapshot = await getDb().collection("settings").doc("programSchedule").get();
      const data = snapshot.exists ? snapshot.data() : {};
      const schedule = data.days && validateSchedule(data.days) ? data.days : window.BWEScheduleDefaults || {};
      document.getElementById("scheduleJsonInput").value = JSON.stringify(schedule, null, 2);
      document.getElementById("streamEnabledInput").checked = data.streamEnabled !== false;
    } catch (error) {
      console.error("Unable to load schedule", error);
      showStatus("Unable to load schedule: " + (error.message || "unknown error"), true);
    }
  }

  async function saveSchedule(event) {
    event.preventDefault();
    let days;
    try {
      days = JSON.parse(document.getElementById("scheduleJsonInput").value || "{}");
    } catch (error) {
      showStatus("Schedule must be valid JSON.", true);
      return;
    }
    if (!validateSchedule(days) || !Object.keys(days).length) {
      showStatus("Schedule must contain valid weekday program lists.", true);
      return;
    }
    try {
      await getDb().collection("settings").doc("programSchedule").set({
        days,
        streamEnabled: document.getElementById("streamEnabledInput").checked,
        updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      showStatus("Schedule and stream status saved.");
    } catch (error) {
      console.error("Unable to save schedule", error);
      showStatus("Unable to save schedule: " + (error.message || "unknown error"), true);
    }
  }

  function serializeFirestore(value) {
    if (!value || typeof value !== "object") return value;
    if (typeof value.toDate === "function") return { $bweDate: value.toDate().toISOString() };
    if (Array.isArray(value)) return value.map(serializeFirestore);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializeFirestore(item)]));
  }

  function restoreFirestoreDates(value) {
    if (!value || typeof value !== "object") return value;
    if (typeof value.$bweDate === "string" && Object.keys(value).length === 1) {
      const date = new Date(value.$bweDate);
      if (Number.isNaN(date.getTime())) throw new Error("Backup contains an invalid date.");
      return window.firebase.firestore.Timestamp.fromDate(date);
    }
    if (Array.isArray(value)) return value.map(restoreFirestoreDates);
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, restoreFirestoreDates(item)]));
  }

  async function exportBackup() {
    try {
      const db = getDb();
      const collections = {};
      for (const name of allowedBackupCollections) {
        const snapshot = await db.collection(name).get();
        collections[name] = snapshot.docs.map((doc) => ({
          id: doc.id,
          data: serializeFirestore(doc.data())
        }));
      }
      const revisions = {};
      for (const page of collections.pages) {
        const snapshot = await db.collection("pages").doc(page.id).collection("revisions").get();
        revisions[page.id] = snapshot.docs.map((doc) => ({ id: doc.id, data: serializeFirestore(doc.data()) }));
      }
      const backup = {
        format: "bwetv-admin-backup",
        version: 1,
        exportedAt: new Date().toISOString(),
        collections,
        revisions
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      if (blob.size > 100 * 1024 * 1024) throw new Error("Backup exceeds the 100 MB import limit. Use a separate Firestore backup for this dataset.");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bwetv-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showStatus("Backup exported.");
    } catch (error) {
      console.error("Unable to export backup", error);
      showStatus("Unable to export backup: " + (error.message || "unknown error"), true);
    }
  }

  async function importBackup(file) {
    if (file.size > 100 * 1024 * 1024) throw new Error("Backup file must be smaller than 100 MB.");
    const backup = JSON.parse(await file.text());
    if (!backup || backup.format !== "bwetv-admin-backup" || backup.version !== 1 || !backup.collections || typeof backup.collections !== "object") {
      throw new Error("This is not a supported BWE TV backup file.");
    }

    const records = [];
    for (const name of allowedBackupCollections) {
      const entries = backup.collections[name] || [];
      if (!Array.isArray(entries)) throw new Error(`Backup collection "${name}" must be an array.`);
      for (const entry of entries) {
        if (!entry || typeof entry.id !== "string" || !/^[A-Za-z0-9_-]{1,140}$/.test(entry.id)
          || !entry.data || typeof entry.data !== "object" || Array.isArray(entry.data)) {
          throw new Error(`Backup contains an invalid record in "${name}".`);
        }
        if (backup.revisions !== undefined) {
          if (!backup.revisions || typeof backup.revisions !== "object" || Array.isArray(backup.revisions)) {
            throw new Error("Backup revisions must be an object.");
          }
          for (const [pageId, entries] of Object.entries(backup.revisions)) {
            if (!/^[A-Za-z0-9_-]{1,140}$/.test(pageId) || !Array.isArray(entries)) throw new Error("Backup contains invalid page revisions.");
            for (const entry of entries) {
              if (!entry || typeof entry.id !== "string" || !/^[A-Za-z0-9_-]{1,140}$/.test(entry.id)
                || !entry.data || typeof entry.data !== "object" || Array.isArray(entry.data)) {
                throw new Error("Backup contains an invalid page revision.");
              }
              records.push({ collection: "pages", pageId, id: entry.id, data: restoreFirestoreDates(entry.data) });
            }
          }
        }
        records.push({ collection: name, id: entry.id, data: restoreFirestoreDates(entry.data) });
      }
    }
    if (!records.length || records.length > 5000) throw new Error("Backup must contain between 1 and 5,000 records.");
    if (!window.confirm(`Import ${records.length} records? Existing matching document IDs will be merged with this backup.`)) return;

    const db = getDb();
    let offset = 0;
    while (offset < records.length) {
      const batch = db.batch();
      let bytes = 0;
      let count = 0;
      while (offset < records.length && count < 400) {
        const { collection, pageId, id, data } = records[offset];
        const size = new Blob([JSON.stringify(data)]).size + 1024;
        if (count && bytes + size > 8 * 1024 * 1024) break;
        const ref = pageId ? db.collection("pages").doc(pageId).collection("revisions").doc(id) : db.collection(collection).doc(id);
        batch.set(ref, data, { merge: true });
        bytes += size;
        count += 1;
        offset += 1;
      }
      try {
        await batch.commit();
      } catch (error) {
        throw new Error(`Restore stopped after ${offset - count} records; earlier batches may have been imported. ${error.message}`);
      }
    }
    showStatus(`Imported ${records.length} records.`);
    await Promise.all([loadPage(), loadHomeContent(), loadSchedule()]);
  }

  const csvFields = {
    shows: ["id", "name", "category", "host", "icon", "accent", "rating", "episodes", "description", "active"],
    episodes: ["id", "showId", "title", "seasonNumber", "episodeNumber", "videoId", "videoUrl", "description", "status", "publishedAt"]
  };

  function csvEscape(value) {
    const text = value == null ? "" : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function triggerDownload(filename, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function exportCsv(collection) {
    try {
      const snapshot = await getDb().collection(collection).get();
      const fields = csvFields[collection];
      const rows = [fields, ...snapshot.docs.map((doc) => {
        const data = doc.data();
        return fields.map((field) => {
          const value = field === "id" ? doc.id : data[field];
          return field === "publishedAt" && value && typeof value.toDate === "function"
            ? value.toDate().toISOString()
            : value;
        });
      })];
      triggerDownload(`bwetv-${collection}-${new Date().toISOString().slice(0, 10)}.csv`,
        rows.map((row) => row.map(csvEscape).join(",")).join("\r\n"), "text/csv;charset=utf-8");
      showStatus(`${collection === "shows" ? "Shows" : "Episodes"} CSV exported.`);
    } catch (error) {
      console.error("Unable to export CSV", error);
      showStatus("Unable to export CSV: " + (error.message || "unknown error"), true);
    }
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const character = text[index];
      if (quoted) {
        if (character === '"' && text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else if (character === '"') {
          quoted = false;
        } else {
          cell += character;
        }
      } else if (character === '"') {
        quoted = true;
      } else if (character === ",") {
        row.push(cell);
        cell = "";
      } else if (character === "\n" || character === "\r") {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        row.push(cell);
        if (row.some((value) => value !== "")) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += character;
      }
    }
    if (quoted) throw new Error("CSV contains an unclosed quoted field.");
    row.push(cell);
    if (row.some((value) => value !== "")) rows.push(row);
    return rows;
  }

  function csvValue(record, field, collection) {
    const value = (record[field] || "").trim();
    if (!value) return value;
    if (collection === "shows") {
      if (["rating", "episodes"].includes(field)) {
        const number = Number(value);
        if (!Number.isFinite(number) || number < 0) throw new Error(`${field} must be a non-negative number.`);
        return number;
      }
      if (field === "active") {
        if (!["true", "false"].includes(value.toLowerCase())) throw new Error("active must be true or false.");
        return value.toLowerCase() === "true";
      }
    }
    if (collection === "episodes") {
      if (["seasonNumber", "episodeNumber"].includes(field)) {
        const number = Number(value);
        if (!Number.isInteger(number) || number < 1) throw new Error(`${field} must be a positive whole number.`);
        return number;
      }
      if (field === "status") {
        if (!["draft", "published"].includes(value)) throw new Error("Episode status must be draft or published.");
        return value;
      }
      if (field === "publishedAt") {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) throw new Error("publishedAt must be a valid date.");
        return window.firebase.firestore.Timestamp.fromDate(date);
      }
    }
    return value;
  }

  async function importCsv(file, collection) {
    if (file.size > 5 * 1024 * 1024) throw new Error("CSV file must be smaller than 5 MB.");
    const rows = parseCsv(await file.text());
    if (rows.length < 2 || rows.length > 1001) throw new Error("CSV must contain a header and between 1 and 1,000 records.");
    const fields = csvFields[collection];
    const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
    if (headers.length !== fields.length || fields.some((field, index) => headers[index] !== field)) {
      throw new Error(`CSV headers must be exactly: ${fields.join(", ")}.`);
    }
    const records = rows.slice(1).map((cells, rowIndex) => {
      if (cells.length !== fields.length) throw new Error(`CSV row ${rowIndex + 2} has the wrong number of columns.`);
      const values = Object.fromEntries(fields.map((field, index) => [field, cells[index]]));
      const id = values.id.trim();
      if (!/^[A-Za-z0-9_-]{1,140}$/.test(id)) throw new Error(`CSV row ${rowIndex + 2} has an invalid ID.`);
      const data = Object.fromEntries(fields.filter((field) => field !== "id").map((field) => [
        field, csvValue(values, field, collection)
      ]));
      if (collection === "shows" && (!data.name || !data.category || !data.host || !data.description)) {
        throw new Error(`CSV row ${rowIndex + 2} is missing required show fields.`);
      }
      if (collection === "episodes" && (!data.showId || !data.title)) {
        throw new Error(`CSV row ${rowIndex + 2} is missing showId or title.`);
      }
      return { id, data };
    });
    if (!window.confirm(`Import ${records.length} ${collection}? Existing matching IDs will be merged.`)) return;
    const db = getDb();
    for (let offset = 0; offset < records.length; offset += 400) {
      const batch = db.batch();
      records.slice(offset, offset + 400).forEach(({ id, data }) => {
        batch.set(db.collection(collection).doc(id), {
          ...data,
          updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });
      await batch.commit();
    }
    showStatus(`${records.length} ${collection} imported.`);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const pageEditor = document.getElementById("pageEditorForm");
    if (!pageEditor) return;
    pageEditor.addEventListener("submit", savePage);
    document.getElementById("cmsPageSelect").addEventListener("change", loadPage);
    document.getElementById("homeContentForm").addEventListener("submit", saveHomeContent);
    document.getElementById("scheduleEditorForm").addEventListener("submit", saveSchedule);
    document.getElementById("exportBackupButton").addEventListener("click", exportBackup);
    document.getElementById("exportShowsCsvButton").addEventListener("click", () => exportCsv("shows"));
    document.getElementById("exportEpisodesCsvButton").addEventListener("click", () => exportCsv("episodes"));
    document.getElementById("importCsvInput").addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        await importCsv(file, document.getElementById("csvCollectionInput").value);
      } catch (error) {
        console.error("Unable to import CSV", error);
        showStatus("Unable to import CSV: " + (error.message || "unknown error"), true);
      } finally {
        event.target.value = "";
      }
    });
    document.getElementById("importBackupInput").addEventListener("change", async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      try {
        await importBackup(file);
      } catch (error) {
        console.error("Unable to import backup", error);
        showStatus("Unable to import backup: " + (error.message || "unknown error"), true);
      } finally {
        event.target.value = "";
      }
    });

    if (!window.firebase || !window.firebase.auth) {
      showStatus("Firebase Authentication is unavailable. Check the Firebase script tags.", true);
      return;
    }
    document.addEventListener("bwe-admin-auth", (event) => {
      if (!event.detail.user || event.detail.role === "moderator") return;
      Promise.all([loadPage(), loadHomeContent(), loadSchedule()]);
    });
  });
})();
