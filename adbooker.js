(() => {
  const firebaseConfig = {
    apiKey: "AIzaSyCg9fxgrXlEuKW_m5MvDnG26Uf6lLdiYik",
    authDomain: "bwetv-ug.firebaseapp.com",
    projectId: "bwetv-ug",
    storageBucket: "bwetv-ug.firebasestorage.app",
    messagingSenderId: "481870926362",
    appId: "1:481870926362:web:f406a0f135449ccfaa77a3"
  };
  const $ = (id) => document.getElementById(id);

  function setStatus(message, isError = false) {
    const status = $("adBookingStatus");
    status.textContent = message;
    status.className = "mt-3 text-sm " + (isError ? "text-red-700" : "text-gray-600");
  }

  function init() {
    const form = $("adBookingForm");
    if (!form) return;

    const startDate = $("startDate");
    const endDate = $("endDate");
    const today = new Date();
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    startDate.min = localToday;
    endDate.min = localToday;
    startDate.addEventListener("change", () => {
      endDate.min = startDate.value || localToday;
      if (endDate.value && endDate.value < endDate.min) endDate.value = endDate.min;
    });

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;

      const email = $("advertiserEmail").value.trim().toLowerCase();
      const creativeUrl = $("creativeUrl").value.trim();
      if (creativeUrl && !/^https:\/\//i.test(creativeUrl)) {
        setStatus("The campaign material link must start with https://.", true);
        $("creativeUrl").focus();
        return;
      }

      if (!window.firebase) {
        setStatus("Advertising inquiries are unavailable right now. Please try again later.", true);
        return;
      }

      const submit = $("adBookingSubmit");
      submit.disabled = true;
      submit.textContent = "Sending…";
      try {
        if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
        await window.firebase.firestore().collection("adBookings").add({
          name: $("advertiserName").value.trim(),
          organization: $("organization").value.trim(),
          email,
          phone: $("advertiserPhone").value.trim(),
          format: $("adFormat").value,
          startDate: startDate.value,
          endDate: endDate.value,
          details: $("campaignDetails").value.trim(),
          creativeUrl,
          status: "new",
          createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
        });
        form.reset();
        startDate.min = localToday;
        endDate.min = localToday;
        setStatus("Thanks—your inquiry has been sent. BWE TV will contact you to discuss availability and pricing. This is not a confirmed booking.");
      } catch (error) {
        console.error("Unable to submit advertising inquiry", error);
        setStatus("We could not send your inquiry. Please try again later or contact BWE TV.", true);
      } finally {
        submit.disabled = false;
        submit.textContent = "Send advertising inquiry";
      }
    });

    const menuButton = $("mobileMenuBtn");
    const mobileMenu = $("mobileMenu");
    menuButton.addEventListener("click", () => {
      const expanded = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!expanded));
      mobileMenu.classList.toggle("hidden");
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
