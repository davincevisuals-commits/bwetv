(function () {
  var root = document.getElementById('showsHero');
  if (!root) return;

  var DEFAULT_SLIDES = [
    { title: 'Morning Rise', tagline: 'Start your day with local news, weather and devotions.', category: 'News', image: 'assets/images/bweyale-hero.svg', accent: 'from-red-700 to-orange-600', link: '#showsContainer', cta: 'Browse shows' },
    { title: 'Cultural Roots', tagline: 'Music, heritage and stories that keep local culture alive.', category: 'Culture', accent: 'from-amber-700 to-red-700', link: '#showsContainer', cta: 'Browse shows' },
    { title: 'Youth Voices', tagline: 'Fresh talent, big ideas and bold voices from the district.', category: 'Culture', accent: 'from-purple-700 to-pink-600', link: '#showsContainer', cta: 'Browse shows' },
    { title: 'Wellness Warriors', tagline: 'Practical health advice for families and communities.', category: 'Health', accent: 'from-green-700 to-emerald-500', link: '#showsContainer', cta: 'Browse shows' }
  ];

  var AUTOPLAY_MS = 6000;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var slides = [];
  var index = 0;
  var timer = null;
  var track, dotsWrap;

  function safeUrl(value) {
    if (!value) return '';
    var v = String(value).trim();
    if (/^(https:\/\/|assets\/|\.\/|#)/i.test(v) && !/^\s*javascript:/i.test(v)) return v;
    return '';
  }

  function youtubeId(value) {
    if (!value) return '';
    var v = String(value).trim();
    if (/^[\w-]{11}$/.test(v)) return v;
    var m = v.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
    return m ? m[1] : '';
  }

  function normalize(item) {
    return {
      title: String(item.title || 'Featured show'),
      tagline: String(item.tagline || item.description || ''),
      category: String(item.category || ''),
      image: safeUrl(item.image),
      video: safeUrl(item.video),
      youtube: youtubeId(item.youtube || item.youtubeUrl),
      accent: /^[a-z0-9 -]+$/i.test(item.accent || '') ? item.accent : 'from-red-700 to-orange-600',
      link: safeUrl(item.link) || '#showsContainer',
      cta: String(item.cta || 'Learn more')
    };
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function buildSlide(s, i) {
    var slide = el('div', 'sh-slide bg-gradient-to-br ' + s.accent);
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', (i + 1) + ' of ' + slides.length);

    if (s.video) {
      var v = document.createElement('video');
      v.className = 'sh-media';
      v.src = s.video;
      v.muted = true;
      v.loop = true;
      v.playsInline = true;
      v.preload = 'metadata';
      if (s.image) v.poster = s.image;
      v.setAttribute('aria-hidden', 'true');
      slide.appendChild(v);
    } else if (s.image) {
      var img = document.createElement('img');
      img.className = 'sh-media';
      img.src = s.image;
      img.alt = '';
      img.loading = i === 0 ? 'eager' : 'lazy';
      img.onerror = function () { img.remove(); };
      slide.appendChild(img);
    }

    slide.appendChild(el('div', 'sh-overlay'));

    var content = el('div', 'sh-content');
    if (s.category) content.appendChild(el('span', 'sh-chip', s.category));
    content.appendChild(el('h2', 'sh-title', s.title));
    if (s.tagline) content.appendChild(el('p', 'sh-tagline', s.tagline));

    var actions = el('div', 'sh-actions');
    var cta = el('a', 'btn btn-primary', s.cta);
    cta.href = s.link;
    actions.appendChild(cta);

    if (s.youtube) {
      var watch = el('button', 'btn sh-watch', '▶ Watch highlight');
      watch.type = 'button';
      watch.addEventListener('click', function () { playYoutube(slide, s); });
      actions.appendChild(watch);
    }
    content.appendChild(actions);
    slide.appendChild(content);
    return slide;
  }

  function playYoutube(slide, s) {
    stopAutoplay();
    if (slide.querySelector('.sh-player')) return;
    var wrap = el('div', 'sh-player');
    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube-nocookie.com/embed/' + s.youtube + '?autoplay=1&rel=0';
    iframe.title = s.title + ' highlight video';
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    var close = el('button', 'sh-close', '✕');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close video');
    close.addEventListener('click', function () { wrap.remove(); startAutoplay(); });
    wrap.appendChild(iframe);
    wrap.appendChild(close);
    slide.appendChild(wrap);
  }

  function render() {
    root.textContent = '';
    var viewport = el('div', 'sh-viewport');
    viewport.setAttribute('role', 'region');
    viewport.setAttribute('aria-roledescription', 'carousel');
    viewport.setAttribute('aria-label', 'Featured shows');
    track = el('div', 'sh-track');
    slides.forEach(function (s, i) { track.appendChild(buildSlide(s, i)); });
    viewport.appendChild(track);

    var prev = el('button', 'sh-nav sh-prev', '‹');
    var next = el('button', 'sh-nav sh-next', '›');
    prev.type = next.type = 'button';
    prev.setAttribute('aria-label', 'Previous slide');
    next.setAttribute('aria-label', 'Next slide');
    prev.addEventListener('click', function () { go(index - 1, true); });
    next.addEventListener('click', function () { go(index + 1, true); });

    dotsWrap = el('div', 'sh-dots');
    slides.forEach(function (_, i) {
      var d = el('button', 'sh-dot');
      d.type = 'button';
      d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      d.addEventListener('click', function () { go(i, true); });
      dotsWrap.appendChild(d);
    });

    if (slides.length > 1) {
      viewport.appendChild(prev);
      viewport.appendChild(next);
      viewport.appendChild(dotsWrap);
    }
    root.appendChild(viewport);

    var startX = null;
    viewport.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; stopAutoplay(); }, { passive: true });
    viewport.addEventListener('touchend', function (e) {
      if (startX == null) return;
      var dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1), true); else startAutoplay();
    });
    viewport.addEventListener('mouseenter', stopAutoplay);
    viewport.addEventListener('mouseleave', startAutoplay);
    viewport.addEventListener('focusin', stopAutoplay);
    viewport.addEventListener('focusout', startAutoplay);
    viewport.setAttribute('tabindex', '0');
    viewport.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') go(index - 1, true);
      if (e.key === 'ArrowRight') go(index + 1, true);
    });

    update();
    startAutoplay();
  }

  function update() {
    track.style.transform = 'translateX(' + (-index * 100) + '%)';
    Array.prototype.forEach.call(track.children, function (slide, i) {
      var active = i === index;
      slide.classList.toggle('sh-active', active);
      if (active) slide.removeAttribute('aria-hidden'); else slide.setAttribute('aria-hidden', 'true');
      var v = slide.querySelector('video.sh-media');
      if (v) {
        if (active && !reduceMotion) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else { v.pause(); }
      }
      var player = slide.querySelector('.sh-player');
      if (player && !active) player.remove();
    });
    Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
      d.classList.toggle('sh-dot-active', i === index);
      if (i === index) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
    });
  }

  function go(i, user) {
    index = (i + slides.length) % slides.length;
    update();
    if (user) startAutoplay();
  }

  function stopAutoplay() { if (timer) { clearInterval(timer); timer = null; } }
  function startAutoplay() {
    stopAutoplay();
    if (reduceMotion || slides.length < 2 || document.hidden) return;
    if (track && track.querySelector('.sh-player')) return;
    timer = setInterval(function () { go(index + 1); }, AUTOPLAY_MS);
  }
  document.addEventListener('visibilitychange', function () { if (document.hidden) stopAutoplay(); else startAutoplay(); });

  function loadRemoteSlides() {
    if (!window.firebase || typeof window.firebase.firestore !== 'function') return Promise.resolve(null);
    try {
      if (!window.firebase.apps.length) {
        window.firebase.initializeApp({
          apiKey: 'AIzaSyCg9fxgrXlEuKW_m5MvDnG26Uf6lLdiYik',
          authDomain: 'bwetv-ug.firebaseapp.com',
          projectId: 'bwetv-ug',
          appId: '1:481870926362:web:f406a0f135449ccfaa77a3'
        });
      }
      return window.firebase.firestore().collection('settings').doc('showsHero').get().then(function (doc) {
        var data = doc.exists ? doc.data() : null;
        return data && Array.isArray(data.slides) && data.slides.length ? data.slides : null;
      });
    } catch (e) { return Promise.resolve(null); }
  }

  function init() {
    slides = DEFAULT_SLIDES.map(normalize);
    render();
    loadRemoteSlides().then(function (remote) {
      if (!remote) return;
      slides = remote.slice(0, 8).map(normalize);
      index = 0;
      render();
    }).catch(function () {});
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
