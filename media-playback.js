(() => {
  "use strict";

  const youtubePlayers = new Map();
  let youtubeReady = false;
  let activeMedia = null;
  const primePlayer = document.getElementById("primeRadioPlayer");
  const primeButton = document.getElementById("primeRadioToggle");

  function closePrime() {
    if (!primePlayer || !primePlayer.firstChild) return;
    primePlayer.replaceChildren();
    primeButton.textContent = "Open Prime Radio player";
    primeButton.setAttribute("aria-expanded", "false");
  }

  function pauseOthers(active) {
    activeMedia = active;
    document.querySelectorAll("audio, video").forEach((media) => {
      if (media !== active && !media.muted && !media.paused) media.pause();
    });
    youtubePlayers.forEach((entry, iframe) => {
      if (iframe !== active && iframe.isConnected && entry.ready) {
        entry.player.pauseVideo();
      }
    });
    if (active !== primePlayer) closePrime();
  }

  document.addEventListener("play", (event) => {
    const media = event.target;
    if ((media.tagName === "AUDIO" || media.tagName === "VIDEO") && !media.muted) {
      pauseOthers(media);
    }
  }, true);

  if (primeButton && primePlayer) {
    primeButton.addEventListener("click", () => {
      if (primePlayer.firstChild) {
        closePrime();
        return;
      }
      pauseOthers(primePlayer);
      const iframe = document.createElement("iframe");
      iframe.src = "https://onlineradiobox.com/ug/prime/?cs=ug.prime";
      iframe.width = "100%";
      iframe.height = "180";
      iframe.title = "Prime Radio Kampala live player";
      iframe.loading = "lazy";
      iframe.allow = "autoplay";
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
      primePlayer.appendChild(iframe);
      primeButton.textContent = "Close Prime Radio player";
      primeButton.setAttribute("aria-expanded", "true");
    });
  }

  function registerYouTubePlayers() {
    if (!youtubeReady) return;
    youtubePlayers.forEach((entry, iframe) => {
      if (!iframe.isConnected) {
        entry.player.destroy();
        youtubePlayers.delete(iframe);
      }
    });
    document.querySelectorAll("iframe[data-youtube-player]").forEach((iframe) => {
      if (youtubePlayers.has(iframe)) return;
      const entry = { player: null, ready: false };
      youtubePlayers.set(iframe, entry);
      entry.player = new window.YT.Player(iframe, {
        events: {
          onReady(event) {
            entry.ready = true;
            if (iframe.isConnected && event.target.getPlayerState() === window.YT.PlayerState.PLAYING) {
              pauseOthers(iframe);
            }
          },
          onStateChange(event) {
            if (iframe.isConnected && event.data === window.YT.PlayerState.PLAYING) pauseOthers(iframe);
          }
        }
      });
    });
  }

  if (document.querySelector("[data-youtube-container]")) {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === "function") previousReady();
      youtubeReady = true;
      registerYouTubePlayers();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => console.error("Unable to load the YouTube player API; automatic playback switching is unavailable.");
    document.head.appendChild(script);
    new MutationObserver(registerYouTubePlayers).observe(document.body, { childList: true, subtree: true });
  }

  window.BWEMediaPlayback = {
    isActive(media) { return activeMedia === media; }
  };
})();
