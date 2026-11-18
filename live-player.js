(() => {
  "use strict";

  const video = document.querySelector("[data-live-player]");
  if (!video) return;
  const shell = video.closest(".live-player-shell");
  const container = shell.querySelector("[data-live-player-container]");
  const message = shell.querySelector("[data-live-player-message]");
  const text = shell.querySelector("[data-live-player-message-text]");
  const retry = shell.querySelector("[data-live-player-retry]");
  let sources = [{ src: "https://stream.bwetv.live/hls/bwetv/index.m3u8", type: "application/x-mpegURL" }];
  let enabled = true;
  let state = "initial";
  let player = null;

  function setStreamError(value) {
    const label = document.getElementById("live-program-label");
    if (!label) return;
    label.dataset.streamError = String(value);
    if (window.refreshBWELiveProgramStatus) window.refreshBWELiveProgramStatus();
  }

  function showMessage(value, canRetry) {
    container.hidden = true;
    text.textContent = value;
    retry.hidden = !canRetry;
    message.hidden = false;
  }

  function stopPlayer() {
    if (player) {
      player.pause();
      player.reset();
    } else {
      video.pause();
      video.removeAttribute("src");
      video.replaceChildren();
      video.load();
    }
  }

  function onError() {
    if (state !== "playing") return;
    console.error("BWE TV live stream could not be loaded.", player ? player.error() : video.error);
    state = "error";
    stopPlayer();
    setStreamError(true);
    showMessage("The stream is temporarily unavailable. Please try again.", true);
  }

  function startPlayer() {
    state = "playing";
    setStreamError(false);
    message.hidden = true;
    container.hidden = false;
    if (!player && typeof window.videojs === "function") {
      player = window.videojs(video, { fluid: true, aspectRatio: "16:9", playbackRates: [0.7, 1, 1.5, 2] });
      player.on("error", onError);
    }
    if (player) {
      player.error(null);
      player.src(sources);
      player.load();
    } else {
      video.replaceChildren(...sources.map((item) => {
        const source = document.createElement("source");
        source.src = item.src;
        source.type = item.type;
        return source;
      }));
      video.load();
    }
  }

  function refresh() {
    if (typeof window.isBWEBroadcastTime !== "function") {
      if (state !== "unavailable") {
        state = "unavailable";
        stopPlayer();
        console.error("Unable to determine BWE TV broadcast hours.");
      }
      showMessage("Broadcast information is temporarily unavailable. Please try again later.", false);
      return;
    }
    const next = !enabled ? "offline" : window.isBWEBroadcastTime() ? "playing" : "off-air";
    if (state === next || (next === "playing" && state === "error")) return;
    if (next === "playing") {
      startPlayer();
      return;
    }
    state = next;
    setStreamError(false);
    stopPlayer();
    showMessage(next === "off-air"
      ? "BWE TV is off air. Broadcasting resumes at 7:30 AM Uganda time."
      : "The BWE TV stream is currently offline. Please check back later.", false);
  }

  video.addEventListener("error", onError);
  retry.addEventListener("click", () => {
    if (state === "error") startPlayer();
  });
  window.BWELivePlayer = {
    setStreamEnabled(value) {
      enabled = value;
      refresh();
    },
    setStreamUrl(url) {
      const type = /\.m3u8(?:[?#]|$)/i.test(url) ? "application/x-mpegURL" : "video/mp4";
      if (sources.length === 1 && sources[0].src === url) return;
      sources = [{ src: url, type }];
      if (state === "playing" || state === "error") startPlayer();
    }
  };
  document.addEventListener("DOMContentLoaded", () => {
    refresh();
    setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refresh();
    });
  });
})();
