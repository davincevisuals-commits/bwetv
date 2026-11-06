(() => {
  const SUPER_ADMIN = "bwetv.ug@gmail.com";
  const CHAT_PATH = "channels/live-chat/messages";
  const $ = (id) => document.getElementById(id);
  let chatRef = null;
  let currentUser = null;

  function status(message, isError = false) {
    const bar = $("dashboardStatus");
    if (!bar) return;
    bar.textContent = message;
    bar.className = "sticky top-2 z-40 rounded-xl border px-4 py-3 text-sm font-semibold shadow " +
      (isError ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-800");
  }

  const fail = (label) => (error) => {
    console.error(label, error);
    status(`${label}: ${error && error.message ? error.message : "unknown error"}`, true);
  };

  const fs = () => window.firebase.firestore();
  const rtdb = () => window.firebase.database();
  const emailKey = (email) => email.toLowerCase().replace(/\./g, ",");

  function button(label, className, onClick) {
    const node = document.createElement("button");
    node.type = "button";
    node.className = "rounded-lg border px-3 py-1 text-xs font-semibold " + className;
    node.textContent = label;
    node.addEventListener("click", onClick);
    return node;
  }

  // ----- Roles -----
  async function loadRoles() {
    const list = $("roleList");
    list.textContent = "Loading…";
    try {
      const snapshot = await fs().collection("roles").get();
      list.replaceChildren();
      if (snapshot.empty) list.textContent = "No additional team members yet.";
      snapshot.forEach((doc) => {
        const row = document.createElement("div");
        row.className = "flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-3";
        const label = document.createElement("span");
        label.textContent = `${doc.id} — ${doc.data().role}`;
        row.append(label, button("Remove", "border-red-200 bg-red-50 text-red-700", () => removeRole(doc.id)));
        list.appendChild(row);
      });
    } catch (error) {
      list.textContent = "Could not load roles.";
      fail("Unable to load roles")(error);
    }
  }

  async function saveRole(event) {
    event.preventDefault();
    const email = $("roleEmailInput").value.trim().toLowerCase();
    const role = $("roleSelect").value;
    if (!email || email === SUPER_ADMIN) return status("Enter a different email address.", true);
    try {
      await fs().collection("roles").doc(email).set({ role, updatedAt: window.firebase.firestore.FieldValue.serverTimestamp() });
      const moderatorRef = rtdb().ref("moderation/moderators/" + emailKey(email));
      await (role === "moderator" ? moderatorRef.set(true) : moderatorRef.remove());
      $("roleForm").reset();
      status(`${email} is now ${role}.`);
      loadRoles();
    } catch (error) {
      fail("Unable to save role")(error);
    }
  }

  async function removeRole(email) {
    if (!window.confirm(`Remove access for ${email}?`)) return;
    try {
      await fs().collection("roles").doc(email).delete();
      await rtdb().ref("moderation/moderators/" + emailKey(email)).remove();
      loadRoles();
    } catch (error) {
      fail("Unable to remove role")(error);
    }
  }

  // ----- Chat moderation -----
  function restrict(uid, kind, minutes) {
    const ref = rtdb().ref(`moderation/${kind}/${uid}`);
    return kind === "bans" ? ref.set(true) : ref.set(Date.now() + minutes * 60000);
  }

  function renderMessages(snapshot) {
    const list = $("chatMessageList");
    list.replaceChildren();
    const items = [];
    snapshot.forEach((child) => { items.push([child.key, child.val()]); });
    if (!items.length) list.textContent = "No messages.";
    items.reverse().forEach(([key, message]) => {
      const row = document.createElement("div");
      row.className = "rounded-lg border border-gray-200 p-3";
      const text = document.createElement("p");
      text.className = "break-words";
      const author = document.createElement("strong");
      author.textContent = String(message.user || message.author || "Guest");
      text.append(author, ": " + String(message.text || ""));
      const actions = document.createElement("div");
      actions.className = "mt-2 flex flex-wrap gap-2";
      actions.appendChild(button("Remove", "border-red-200 bg-red-50 text-red-700", () =>
        rtdb().ref(`${CHAT_PATH}/${key}`).remove().catch(fail("Unable to remove message"))));
      if (typeof message.uid === "string" && message.uid) {
        actions.appendChild(button("Mute 10 min", "border-amber-200 bg-amber-50 text-amber-700", () =>
          restrict(message.uid, "muted", 10).then(loadRestrictions).catch(fail("Unable to mute user"))));
        actions.appendChild(button("Mute 1 hour", "border-amber-200 bg-amber-50 text-amber-700", () =>
          restrict(message.uid, "muted", 60).then(loadRestrictions).catch(fail("Unable to mute user"))));
        actions.appendChild(button("Ban", "border-red-300 bg-red-100 text-red-800", () =>
          window.confirm("Ban this user from chat?") && restrict(message.uid, "bans").then(loadRestrictions).catch(fail("Unable to ban user"))));
      } else {
        const note = document.createElement("span");
        note.className = "text-xs text-gray-500";
        note.textContent = "Older message: no user ID, so it can only be removed.";
        actions.appendChild(note);
      }
      row.append(text, actions);
      list.appendChild(row);
    });
  }

  async function loadRestrictions() {
    const list = $("chatRestrictionList");
    try {
      const [bans, muted] = await Promise.all([rtdb().ref("moderation/bans").get(), rtdb().ref("moderation/muted").get()]);
      list.replaceChildren();
      const add = (label, kind, uid) => {
        const row = document.createElement("div");
        row.className = "flex items-center justify-between gap-2 rounded-lg border border-gray-200 p-3";
        const text = document.createElement("span");
        text.className = "break-all";
        text.textContent = `${label}: ${uid}`;
        row.append(text, button(kind === "bans" ? "Unban" : "Unmute", "border-gray-200 bg-white text-gray-700", () =>
          rtdb().ref(`moderation/${kind}/${uid}`).remove().then(loadRestrictions).catch(fail("Unable to update restriction"))));
        list.appendChild(row);
      };
      bans.forEach((child) => add("Banned", "bans", child.key));
      muted.forEach((child) => { if (child.val() > Date.now()) add("Muted until " + new Date(child.val()).toLocaleTimeString(), "muted", child.key); });
      if (!list.childElementCount) list.textContent = "No active restrictions.";
    } catch (error) {
      list.textContent = "Could not load restrictions.";
      fail("Unable to load restrictions")(error);
    }
  }

  async function loadChat() {
    try {
      if (chatRef) chatRef.off();
      chatRef = rtdb().ref(CHAT_PATH).limitToLast(50);
      chatRef.on("value", renderMessages, fail("Unable to load chat"));
      const [settings, viewers] = await Promise.all([
        rtdb().ref("moderation/settings/chatEnabled").get().catch(() => null),
        rtdb().ref("presence/viewers").get().catch(() => null)
      ]);
      if (!settings) status("Chat settings are blocked. Deploy the latest rules: firebase deploy --only firestore:rules,database --project bwetv-ug", true);
      $("chatEnabledInput").checked = !settings || settings.val() !== false;
      $("chatSessionCount").textContent = viewers ? "Active viewers: " + viewers.numChildren() : "Active viewers: unavailable";
      loadRestrictions();
    } catch (error) {
      fail("Unable to load chat tools")(error);
    }
  }

  // ----- Analytics -----
  async function loadAnalytics() {
    const box = $("analyticsSummary");
    box.textContent = "Loading…";
    try {
      const start = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
      const snapshot = await fs().collection("analytics").where("day", ">=", start).get();
      const byDay = {};
      const byPage = {};
      snapshot.forEach((doc) => {
        const { day, page, views } = doc.data();
        byDay[day] = (byDay[day] || 0) + views;
        byPage[page] = (byPage[page] || 0) + views;
      });
      const table = (title, entries) => {
        const card = document.createElement("div");
        const heading = document.createElement("h4");
        heading.className = "mb-2 text-sm font-bold text-gray-800";
        heading.textContent = title;
        card.appendChild(heading);
        const max = Math.max(1, ...entries.map((entry) => entry[1]));
        entries.forEach(([label, value]) => {
          const row = document.createElement("div");
          row.className = "mb-1 flex items-center gap-2 text-xs";
          const name = document.createElement("span");
          name.className = "w-24 shrink-0 truncate";
          name.textContent = label;
          const bar = document.createElement("div");
          bar.className = "h-3 rounded bg-red-500";
          bar.style.width = Math.max(2, (value / max) * 100) + "%";
          const count = document.createElement("span");
          count.textContent = String(value);
          row.append(name, bar, count);
          card.appendChild(row);
        });
        if (!entries.length) card.append("No data yet.");
        return card;
      };
      box.replaceChildren(
        table("Views per day", Object.entries(byDay).sort()),
        table("Popular pages", Object.entries(byPage).sort((a, b) => b[1] - a[1]))
      );
    } catch (error) {
      box.textContent = "Could not load analytics.";
      fail("Unable to load analytics")(error);
    }
  }

  async function loadAdBookings() {
    const list = $("adBookingList");
    list.textContent = "Loading inquiries…";
    try {
      const snapshot = await fs().collection("adBookings").orderBy("createdAt", "desc").limit(50).get();
      list.replaceChildren();
      if (snapshot.empty) {
        list.textContent = "No advertising inquiries yet.";
        return;
      }
      snapshot.forEach((doc) => {
        const booking = doc.data();
        const card = document.createElement("article");
        card.className = "rounded-xl border border-gray-200 bg-white p-4";
        card.setAttribute("role", "listitem");
        const heading = document.createElement("h4");
        heading.className = "font-bold text-gray-900";
        heading.textContent = `${booking.organization || booking.name} — ${booking.format}`;
        const contact = document.createElement("p");
        contact.className = "mt-1 text-gray-700";
        contact.textContent = `${booking.name} · ${booking.email} · ${booking.phone}`;
        const dates = document.createElement("p");
        dates.className = "mt-1 text-gray-600";
        dates.textContent = `Campaign dates: ${booking.startDate} to ${booking.endDate}`;
        const details = document.createElement("p");
        details.className = "mt-2 whitespace-pre-wrap text-gray-700";
        details.textContent = booking.details;
        card.append(heading, contact, dates, details);
        if (booking.creativeUrl) {
          const link = document.createElement("a");
          link.className = "mt-2 inline-block text-blue-700 underline";
          link.href = booking.creativeUrl;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "View campaign material";
          card.appendChild(link);
        }
        const controls = document.createElement("div");
        controls.className = "mt-3 flex flex-wrap items-center gap-2";
        const statusSelect = document.createElement("select");
        statusSelect.className = "rounded-lg border border-gray-300 px-3 py-2";
        [["new", "New"], ["contacted", "Contacted"], ["confirmed", "Confirmed"], ["declined", "Declined"]].forEach(([value, label]) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = label;
          statusSelect.appendChild(option);
        });
        statusSelect.value = booking.status;
        const saveButton = button("Update status", "border-gray-200 bg-gray-50 text-gray-700", async () => {
          saveButton.disabled = true;
          try {
            await doc.ref.update({
              status: statusSelect.value,
              updatedAt: window.firebase.firestore.FieldValue.serverTimestamp()
            });
            status("Advertising inquiry updated.");
          } catch (error) {
            fail("Unable to update advertising inquiry")(error);
          } finally {
            saveButton.disabled = false;
          }
        });
        controls.append(statusSelect, saveButton);
        card.appendChild(controls);
        list.appendChild(card);
      });
    } catch (error) {
      list.textContent = "Could not load advertising inquiries.";
      throw error;
    }
  }

  async function canManageAdBookings(user) {
    if (!user || !user.emailVerified) return false;
    const email = (user.email || "").toLowerCase();
    if (email === SUPER_ADMIN) return true;
    const role = await fs().collection("roles").doc(email).get();
    return role.exists && role.data().role === "editor";
  }

  // ----- Media -----
  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(url); resolve(image); };
      image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("That file is not a readable image.")); };
      image.src = url;
    });
  }

  function renderImage(image, crop, maxWidth, maxQuality = 0.85) {
    let sx = 0, sy = 0, sw = image.naturalWidth, sh = image.naturalHeight;
    if (crop !== "original") {
      const [w, h] = crop.split(":").map(Number);
      const target = w / h;
      if (sw / sh > target) { sw = Math.round(sh * target); sx = Math.round((image.naturalWidth - sw) / 2); }
      else { sh = Math.round(sw / target); sy = Math.round((image.naturalHeight - sh) / 2); }
    }
    let width = Math.min(maxWidth, sw);
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = Math.round(width * sh / sw);
      canvas.getContext("2d").drawImage(image, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      // Safari cannot encode WebP and silently returns PNG, so fall back to JPEG.
      for (const type of ["image/webp", "image/jpeg"]) {
        for (const quality of [maxQuality, maxQuality * 0.8, maxQuality * 0.6]) {
          const dataUrl = canvas.toDataURL(type, quality);
          if (dataUrl.startsWith("data:" + type) && dataUrl.length < 750000) {
            return { dataUrl, width: canvas.width, height: canvas.height };
          }
        }
      }
      width = Math.round(width * 0.75);
    }
    throw new Error("Image is too large to store; choose a smaller image or width.");
  }

  async function previewMedia() {
    const file = $("mediaFileInput").files[0];
    const info = $("mediaPreviewInfo");
    const img = $("mediaPreview");
    if (!file) { img.classList.add("hidden"); info.textContent = "Choose an image to preview the cropped, shrunk result."; return; }
    try {
      const result = renderImage(await loadImage(file), $("mediaCropInput").value, Number($("mediaWidthInput").value), Number($("mediaQualityInput").value));
      img.src = result.dataUrl;
      img.classList.remove("hidden");
      info.textContent = `Original ${Math.round(file.size / 1024)} KB → ${result.width}×${result.height}px, about ${Math.round(result.dataUrl.length * 0.75 / 1024)} KB.`;
    } catch (error) {
      img.classList.add("hidden");
      info.textContent = error.message;
    }
  }

  async function uploadMedia(event) {
    event.preventDefault();
    const file = $("mediaFileInput").files[0];
    if (!file) return;
    try {
      const result = renderImage(await loadImage(file), $("mediaCropInput").value, Number($("mediaWidthInput").value), Number($("mediaQualityInput").value));
      const name = $("mediaNameInput").value.trim();
      const id = (name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "image") + "-" + Date.now().toString(36);
      await fs().collection("media").doc(id).set({
        name, purpose: $("mediaPurposeInput").value, ...result,
        createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
      });
      $("mediaForm").reset();
      status(`Image saved. Use media:${id} where an image URL is accepted.`);
      loadMedia();
    } catch (error) {
      fail("Unable to upload image")(error);
    }
  }

  async function loadMedia() {
    const list = $("mediaList");
    list.textContent = "Loading…";
    try {
      const snapshot = await fs().collection("media").orderBy("createdAt", "desc").limit(40).get();
      list.replaceChildren();
      if (snapshot.empty) list.textContent = "No images yet.";
      snapshot.forEach((doc) => {
        const data = doc.data();
        const card = document.createElement("div");
        card.className = "rounded-xl border border-gray-200 p-2 text-xs";
        const image = document.createElement("img");
        image.src = data.dataUrl;
        image.alt = data.name || "";
        image.className = "h-28 w-full rounded object-cover";
        const label = document.createElement("p");
        label.className = "mt-1 truncate font-semibold";
        label.textContent = `${data.name} (${data.purpose})`;
        const actions = document.createElement("div");
        actions.className = "mt-1 flex gap-1";
        actions.append(
          button("Copy ref", "border-gray-200 bg-white text-gray-700", () =>
            navigator.clipboard.writeText("media:" + doc.id).then(() => status("Copied media:" + doc.id))),
          button("Delete", "border-red-200 bg-red-50 text-red-700", () =>
            window.confirm("Delete this image?") && doc.ref.delete().then(loadMedia).catch(fail("Unable to delete image")))
        );
        card.append(image, label, actions);
        list.appendChild(card);
      });
    } catch (error) {
      list.textContent = "Could not load media.";
      fail("Unable to load media")(error);
    }
  }

  // ----- Social share -----
  function socialParts() {
    const text = $("socialText").value.trim();
    const link = $("socialLink").value.trim();
    return { text, link: /^https:\/\//i.test(link) ? link : "" };
  }

  function updateSocialPreview() {
    const { text, link } = socialParts();
    $("socialPreview").textContent = (text || "Your post preview appears here.") + (link ? "\n" + link : "");
    $("socialPreview").style.whiteSpace = "pre-wrap";
  }

  function share(kind) {
    const { text, link } = socialParts();
    if (!text && !link) return status("Write a post or add a link first.", true);
    const t = encodeURIComponent(text);
    const u = encodeURIComponent(link);
    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}&quote=${t}`,
      x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent((text + " " + link).trim())}`,
      telegram: `https://t.me/share/url?url=${u}&text=${t}`
    };
    if (kind === "copy") {
      navigator.clipboard.writeText((text + "\n" + link).trim()).then(() => status("Caption copied."), fail("Unable to copy"));
    } else if (urls[kind]) {
      window.open(urls[kind], "_blank", "noopener,noreferrer");
    }
  }

  async function loadSocialLinks() {
    const box = $("socialLinksPreview");
    try {
      const snapshot = await fs().collection("settings").doc("site").get();
      const data = snapshot.exists ? snapshot.data() : {};
      box.replaceChildren("Linked profiles (edit in Settings): ");
      [["Facebook", data.facebookUrl], ["X", data.xUrl], ["Instagram", data.instagramUrl], ["YouTube", data.youtubeUrl], ["TikTok", data.tiktokUrl]].forEach(([name, url]) => {
        if (!/^https:\/\//i.test(url || "")) return;
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.className = "mr-3 underline";
        anchor.textContent = name;
        box.appendChild(anchor);
      });
    } catch (error) {
      box.textContent = "Could not load linked profiles.";
      fail("Unable to load linked profiles")(error);
    }
  }

  function init() {
    if (!$("opsTab") || !window.firebase || !window.firebase.auth) return;
    $("roleForm").addEventListener("submit", saveRole);
    $("refreshChatButton").addEventListener("click", loadChat);
    $("chatEnabledInput").addEventListener("change", (event) =>
      rtdb().ref("moderation/settings/chatEnabled").set(event.target.checked).catch(fail("Unable to change chat settings")));
    $("refreshAnalyticsButton").addEventListener("click", loadAnalytics);
    $("refreshAdBookingsButton").addEventListener("click", () => loadAdBookings().catch(fail("Unable to load advertising inquiries")));
    $("mediaForm").addEventListener("submit", uploadMedia);
    ["mediaFileInput", "mediaCropInput", "mediaWidthInput", "mediaQualityInput"].forEach((id) => $(id).addEventListener("change", previewMedia));
    $("socialText").addEventListener("input", updateSocialPreview);
    $("socialLink").addEventListener("input", updateSocialPreview);
    document.addEventListener("bwe-site-settings-saved", loadSocialLinks);
    document.querySelectorAll("[data-share]").forEach((node) => node.addEventListener("click", () => share(node.dataset.share)));
    updateSocialPreview();

    window.firebase.auth().onAuthStateChanged((user) => {
      currentUser = user;
      if (!user) { if (chatRef) chatRef.off(); chatRef = null; return; }
      const isSuper = (user.email || "").toLowerCase() === SUPER_ADMIN;
      $("rolesSection").classList.toggle("hidden", !isSuper);
      $("refreshAnalyticsButton").closest("section").classList.toggle("hidden", !isSuper);
      canManageAdBookings(user).then((canManage) => {
        $("adBookingsSection").classList.toggle("hidden", !canManage);
        if (canManage) loadAdBookings().catch(fail("Unable to load advertising inquiries"));
      }).catch(fail("Unable to check advertising inquiry access"));
      if (isSuper) { loadRoles(); loadAnalytics(); }
      loadChat();
      loadMedia();
      loadSocialLinks();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
