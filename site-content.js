(() => {
  const firebaseConfig = {
    apiKey: "AIzaSyCg9fxgrXlEuKW_m5MvDnG26Uf6lLdiYik",
    authDomain: "bwetv-ug.firebaseapp.com",
    databaseURL: "https://bwetv-ug-default-rtdb.firebaseio.com",
    projectId: "bwetv-ug",
    storageBucket: "bwetv-ug.firebasestorage.app",
    messagingSenderId: "481870926362",
    appId: "1:481870926362:web:f406a0f135449ccfaa77a3",
    measurementId: "G-SJ5YJH2G7C"
  };

  function getDb() {
    if (!window.firebase || !window.firebase.firestore) return null;
    if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
    return window.firebase.firestore();
  }

  function setMeta(selector, attribute, value, createName) {
    if (!value) return;
    let node = document.querySelector(selector);
    if (!node && createName) {
      node = document.createElement("meta");
      node.setAttribute(attribute, createName);
      document.head.appendChild(node);
    }
    if (node) node.content = value;
  }

  function isPublished(page) {
    if (!page || page.status !== "published") return false;
    if (!page.publishAt) return true;
    const publishAt = typeof page.publishAt.toDate === "function" ? page.publishAt.toDate() : new Date(page.publishAt);
    return !Number.isNaN(publishAt.getTime()) && publishAt.getTime() <= Date.now();
  }

  function renderBodyText(container, body) {
    const fragment = document.createDocumentFragment();
    String(body || "").split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean).forEach((text) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = text;
      fragment.appendChild(paragraph);
    });
    container.replaceChildren(fragment);
  }

  function applyPage(page) {
    if (!isPublished(page)) return;
    const title = String(page.title || "").slice(0, 160);
    const description = String(page.description || "").slice(0, 300);
    if (title) {
      document.title = title;
      const heading = document.querySelector("[data-cms-title]");
      if (heading) heading.textContent = title;
      setMeta('meta[property="og:title"]', "property", title, "og:title");
      setMeta('meta[name="twitter:title"]', "name", title, "twitter:title");
    }
    if (description) {
      setMeta('meta[name="description"]', "name", description, "description");
      setMeta('meta[property="og:description"]', "property", description, "og:description");
      setMeta('meta[name="twitter:description"]', "name", description, "twitter:description");
    }
    if (page.ogImage && /^https:\/\//i.test(page.ogImage)) {
      setMeta('meta[property="og:image"]', "property", page.ogImage, "og:image");
      setMeta('meta[name="twitter:image"]', "name", page.ogImage, "twitter:image");
    }
    if (page.twitterCard === "summary" || page.twitterCard === "summary_large_image") {
      setMeta('meta[name="twitter:card"]', "name", page.twitterCard, "twitter:card");
    }
    if (page.robots === "index,follow" || page.robots === "noindex,nofollow") {
      setMeta('meta[name="robots"]', "name", page.robots, "robots");
    }
    const body = document.querySelector("[data-cms-body]");
    if (body && typeof page.body === "string") renderBodyText(body, page.body);
  }

  function applyBrand(settings) {
    const root = document.documentElement;
    if (/^#[0-9a-f]{6}$/i.test(settings.brandColor || "")) {
      root.style.setProperty("--bwe-brand", settings.brandColor);
      root.style.setProperty("--bwe-brand-strong", settings.brandColor);
      root.style.setProperty("--bwe-primary", settings.brandColor);
      root.style.setProperty("--bwe-primary-hover", settings.brandColor);
    }
    if (/^#[0-9a-f]{6}$/i.test(settings.accentColor || "")) {
      root.style.setProperty("--bwe-accent", settings.accentColor);
      root.style.setProperty("--bwe-accent-hover", settings.accentColor);
    }
    if (typeof settings.fontFamily === "string" && /^[\w\s,"'-]{1,120}$/.test(settings.fontFamily)) {
      root.style.setProperty("--bwe-font-family", settings.fontFamily);
    }
    resolveMedia(settings.logoUrl).then((src) => {
      if (src) document.querySelectorAll(".brand-logo-image").forEach((image) => { image.src = src; });
    });
    resolveMedia(settings.heroImage).then((src) => {
      if (src) root.style.setProperty("--bwe-home-hero-image", `url("${src.replace(/["\\]/g, "")}")`);
    });
    [["facebook", settings.facebookUrl], ["instagram", settings.instagramUrl], ["youtube", settings.youtubeUrl]].forEach(([name, url]) => {
      if (!/^https:\/\//i.test(url || "")) return;
      document.querySelectorAll(".bwe-footer-social a").forEach((anchor) => {
        if ((anchor.getAttribute("aria-label") || "").toLowerCase().includes(name)) anchor.href = url;
      });
    });

    document.querySelectorAll("[data-live-player]").forEach((player) => {
      if (settings.liveStreamUrl && /^https:\/\//i.test(settings.liveStreamUrl)) {
        const type = /\.m3u8(?:[?#]|$)/i.test(settings.liveStreamUrl) ? "application/x-mpegURL" : "video/mp4";
        const videojsPlayer = window.videojs && window.videojs.getPlayer && window.videojs.getPlayer(player.id);
        if (videojsPlayer) {
          videojsPlayer.src({ src: settings.liveStreamUrl, type });
        } else {
          player.replaceChildren();
          const source = document.createElement("source");
          source.src = settings.liveStreamUrl;
          source.type = type;
          player.appendChild(source);
          player.load();
        }
      }
    });
  }

  function applyStreamStatus(isEnabled) {
    document.querySelectorAll("[data-live-player]").forEach((player) => {
      const shell = player.closest(".live-player-shell") || player.parentElement;
      if (!shell) return;
      let message = shell.querySelector("[data-stream-offline]");
      if (!isEnabled) {
        player.hidden = true;
        if (!message) {
          message = document.createElement("p");
          message.dataset.streamOffline = "true";
          message.className = "rounded-xl bg-black/70 p-6 text-center font-semibold text-white";
          message.textContent = "The BWE TV stream is currently offline. Please check the schedule for upcoming programs.";
          shell.appendChild(message);
        }
      } else {
        player.hidden = false;
        if (message) message.remove();
      }
    });
    document.querySelectorAll(".live-status-bar strong").forEach((label) => {
      label.textContent = isEnabled ? "Streaming now" : "Stream offline";
    });
  }

  function applyHomeContent(data) {
    if (data.announcement) {
      const announcement = document.getElementById("siteAnnouncement");
      if (announcement) {
        announcement.textContent = String(data.announcement).slice(0, 240);
        announcement.classList.remove("hidden");
      }
    }
    const assignText = (selector, value, limit) => {
      const element = document.querySelector(selector);
      if (element && typeof value === "string" && value.trim()) element.textContent = value.slice(0, limit);
    };
    assignText("[data-home-heading]", data.heroHeading, 160);
    assignText("[data-home-intro]", data.heroIntro, 300);
    assignText("[data-home-featured-heading]", data.featuredHeading, 120);
    assignText("[data-home-featured-intro]", data.featuredIntro, 300);

    const section = document.getElementById("homeHighlightsSection");
    const container = document.getElementById("homeHighlights");
    if (!section || !container || !Array.isArray(data.highlights) || !data.highlights.length) return;
    const fragment = document.createDocumentFragment();
    data.highlights.slice(0, 12).forEach((item) => {
      if (!item || typeof item.title !== "string" || typeof item.text !== "string") return;
      const card = document.createElement("article");
      card.className = "rounded-xl border border-gray-200 bg-white p-5 shadow-sm";
      const heading = document.createElement("h3");
      heading.className = "text-xl font-bold text-gray-900";
      heading.textContent = item.title.slice(0, 120);
      const text = document.createElement("p");
      text.className = "mt-2 text-sm text-gray-600";
      text.textContent = item.text.slice(0, 500);
      card.append(heading, text);
      if (typeof item.link === "string" && /^(https:\/\/|\/|\.\/|[a-z0-9_-]+\.html(?:#[-\w]+)?)$/i.test(item.link)) {
        const link = document.createElement("a");
        link.className = "mt-4 inline-flex font-semibold text-red-700 underline";
        link.href = item.link;
        link.textContent = "Learn more";
        card.appendChild(link);
      }
      fragment.appendChild(card);
    });
    container.replaceChildren(fragment);
    section.classList.toggle("hidden", !container.childElementCount);
  }

  async function resolveMedia(value) {
    if (typeof value !== "string" || !value) return "";
    if (/^(https:\/\/|assets\/|\.\/)/i.test(value)) return value;
    const match = /^media:([a-z0-9-]{1,60})$/.exec(value);
    const db = getDb();
    if (!match || !db) return "";
    try {
      const doc = await db.collection("media").doc(match[1]).get();
      const url = doc.exists ? doc.data().dataUrl : "";
      return /^data:image\/(webp|png|jpeg);base64,/.test(url || "") ? url : "";
    } catch (error) {
      return "";
    }
  }

  function trackView(db) {
    const page = (document.body.dataset.cmsPage || (document.body.hasAttribute("data-homepage") ? "home" : "other")).replace(/[^a-z0-9-]/gi, "").slice(0, 40) || "other";
    const key = "bwe-view-" + page;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, "1"); } catch (error) { return; }
    const day = new Date().toISOString().slice(0, 10);
    const ref = db.collection("analytics").doc(day + "_" + page);
    ref.set({ day, page, views: 1 }).catch(() =>
      ref.update({ views: window.firebase.firestore.FieldValue.increment(1) }).catch(() => {}));
  }

  async function loadContent() {
    const db = getDb();
    if (!db) return;
    trackView(db);
    const pageId = document.body.dataset.cmsPage;
    const requests = [
      db.collection("settings").doc("site").get(),
      db.collection("settings").doc("programSchedule").get()
    ];
    if (document.body.hasAttribute("data-homepage")) {
      requests.push(db.collection("settings").doc("homeContent").get());
    }
    if (pageId) requests.push(db.collection("pages").doc(pageId).get());

    const results = await Promise.allSettled(requests);
    const siteResult = results[0];
    if (siteResult.status === "fulfilled" && siteResult.value.exists) {
      applyBrand(siteResult.value.data());
    }
    const scheduleResult = results[1];
    if (scheduleResult.status === "fulfilled" && scheduleResult.value.exists) {
      const schedule = scheduleResult.value.data();
      if (window.applyBWESchedule && schedule.days) window.applyBWESchedule(schedule.days);
      applyStreamStatus(schedule.streamEnabled !== false);
    }
    let index = 2;
    if (document.body.hasAttribute("data-homepage")) {
      const homeResult = results[index++];
      if (homeResult.status === "fulfilled" && homeResult.value.exists) applyHomeContent(homeResult.value.data());
    }
    if (pageId) {
      const pageResult = results[index];
      if (pageResult.status === "fulfilled" && pageResult.value.exists) applyPage(pageResult.value.data());
    }

    results.forEach((result) => {
      if (result.status === "rejected") console.error("Unable to load public site content", result.reason);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadContent().catch((error) => console.error("Unable to initialize public site content", error));
  });
})();
