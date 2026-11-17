// Kolja Gerstenkorn — Portfolio. Small, dependency-free.

(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Hover previews: silent loop over the still (desktop only) ----
  // Works on hero/film frames and on film list rows (the loop plays inside .work-thumb).
  if (canHover && !reduceMotion) {
    document.querySelectorAll('[data-preview]').forEach((el) => {
      const box = el.querySelector('.work-thumb') || el;
      let video;
      el.addEventListener('mouseenter', () => {
        if (!video) {
          video = document.createElement('video');
          video.className = 'preview';
          video.src = el.dataset.preview;
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.setAttribute('aria-hidden', 'true');
          box.appendChild(video);
        }
        video.play().catch(() => {});
        box.classList.add('is-previewing');
      });
      el.addEventListener('mouseleave', () => {
        box.classList.remove('is-previewing');
        video?.pause();
      });
    });
  }

  // ---- Lightbox ----
  const box = document.querySelector('.lightbox');
  const body = box.querySelector('.lightbox-body');
  const caption = box.querySelector('.lightbox-caption');

  const embedUrl = (spec) => {
    const [host, id] = spec.split(':');
    if (host === 'vimeo') return `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1&title=0&byline=0&portrait=0`;
    if (host === 'youtube') return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    return null;
  };

  const open = (node, text) => {
    body.replaceChildren(node);
    caption.textContent = text || '';
    box.showModal();
    document.body.style.overflow = 'hidden';
  };

  const close = () => box.close();

  box.addEventListener('close', () => {
    if (box.open) return;   // a new film was opened right after closing; keep it
    body.replaceChildren(); // stops video playback
    document.body.style.overflow = '';
  });
  box.querySelector('.lightbox-close').addEventListener('click', close);
  box.addEventListener('click', (e) => { if (e.target === box || e.target === body) close(); });

  // Hero loop: keep it still for visitors who prefer reduced motion
  const heroLoop = document.querySelector('.hero-loop');
  if (heroLoop && reduceMotion) { heroLoop.removeAttribute('autoplay'); heroLoop.pause(); }

  // Hero reel: keep the click target and label in sync with the film on screen
  const hero = document.querySelector('.hero-media[data-segments]');
  if (hero && heroLoop) {
    const segments = JSON.parse(hero.dataset.segments);
    const label = hero.querySelector('.play');
    let current = null;
    const sync = () => {
      const seg = segments.find((s) => heroLoop.currentTime < s.until) || segments[0];
      if (seg === current) return;
      current = seg;
      hero.dataset.video = seg.video;
      hero.dataset.title = seg.title;
      hero.setAttribute('aria-label', `Play: ${seg.title}`);
      if (label) label.textContent = seg.title;
    };
    heroLoop.addEventListener('timeupdate', sync);
    sync();
  }

  document.querySelectorAll('[data-video]').forEach((btn) => {
    btn.addEventListener('click', () => {
      // Self-hosted film: "file:path/to/film.mp4"
      if (btn.dataset.video.startsWith('file:')) {
        const video = document.createElement('video');
        video.src = btn.dataset.video.slice(5);
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        open(video, btn.dataset.title || '');
        return;
      }
      const src = embedUrl(btn.dataset.video);
      if (!src) return;
      const iframe = document.createElement('iframe');
      iframe.src = src;
      iframe.allow = 'autoplay; fullscreen; picture-in-picture';
      iframe.allowFullscreen = true;
      iframe.title = btn.getAttribute('aria-label') || 'Video';
      if (btn.dataset.ratio === '9/16') iframe.classList.add('is-vertical'); // YouTube Shorts
      open(iframe, btn.dataset.title || '');
    });
  });

  document.querySelectorAll('.photo').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const href = a.getAttribute('href');
      if (!href || href === '#') return; // placeholder
      const img = new Image();
      img.src = href;
      img.alt = a.querySelector('img')?.alt || '';
      open(img, a.dataset.caption);
    });
  });
})();
