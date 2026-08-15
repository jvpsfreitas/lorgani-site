/* Clínica L'Organi — interações do site */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Header sólido ao rolar ---------- */
  const header = document.querySelector('.site-header');
  const onScrollHeader = () => {
    if (!header) return;
    header.classList.toggle('solid', window.scrollY > 40);
  };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- Menu mobile ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  /* ---------- Passeio interativo (scroll-scrub de frames) ---------- */
  const tourSection = document.querySelector('.tour');
  const canvas = document.getElementById('tour-canvas');
  const progressBar = document.querySelector('.tour-progress-bar');

  if (tourSection && canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const frameCount = parseInt(canvas.dataset.frames, 10) || 0;
    const framePrefix = canvas.dataset.prefix || '';
    const pad = (n) => String(n).padStart(3, '0');

    const images = [];
    let loadedCount = 0;
    let ready = false;

    function drawFrame(index) {
      const img = images[index];
      if (!img || !img.complete || !img.naturalWidth) return;
      const cw = canvas.width, ch = canvas.height;
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
      const w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    }

    function resizeCanvas() {
      const wrap = canvas.parentElement;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = wrap.clientWidth * dpr;
      canvas.height = wrap.clientHeight * dpr;
      canvas.style.width = wrap.clientWidth + 'px';
      canvas.style.height = wrap.clientHeight + 'px';
      if (ready) drawFrame(currentFrame());
    }

    let currentIdx = 0;
    function currentFrame(){ return currentIdx; }

    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      img.src = `${framePrefix}${pad(i)}.jpg`;
      img.onload = () => {
        loadedCount++;
        if (i === 1) { ready = true; resizeCanvas(); }
      };
      images.push(img);
    }

    window.addEventListener('resize', resizeCanvas, { passive: true });
    resizeCanvas();

    let tourTarget = 0, tourShown = 0, tourRaf = null;
    const tourEase = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0.16;

    function renderTour() {
      tourShown += (tourTarget - tourShown) * tourEase;
      if (Math.abs(tourTarget - tourShown) < 0.0005) { tourShown = tourTarget; tourRaf = null; }
      else { tourRaf = requestAnimationFrame(renderTour); }
      const frameIdx = Math.min(frameCount - 1, Math.floor(tourShown * frameCount));
      if (frameIdx !== currentIdx) {
        currentIdx = frameIdx;
        drawFrame(frameIdx);
      }
      if (progressBar) progressBar.style.width = `${tourShown * 100}%`;
    }

    function updateTour() {
      const rect = tourSection.getBoundingClientRect();
      const total = tourSection.offsetHeight - window.innerHeight;
      tourTarget = Math.min(Math.max((-rect.top) / total, 0), 1);
      if (!tourRaf) tourRaf = requestAnimationFrame(renderTour);
    }

    window.addEventListener('scroll', updateTour, { passive: true });
    updateTour();
  }

  /* ---------- Passeio pelos ambientes (scroll horizontal) ---------- */
  const roomTour = document.querySelector('.room-tour');
  const roomTrack = document.querySelector('.room-track');
  const roomDots = document.querySelectorAll('.room-tour-dots span');

  if (roomTour && roomTrack) {
    const panels = roomTrack.querySelectorAll('.room-panel');
    const n = panels.length;
    let roomTarget = 0, roomShown = 0, roomRaf = null;
    const roomEase = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0.13;

    function renderRoom() {
      roomShown += (roomTarget - roomShown) * roomEase;
      if (Math.abs(roomTarget - roomShown) < 0.01) { roomShown = roomTarget; roomRaf = null; }
      else { roomRaf = requestAnimationFrame(renderRoom); }
      roomTrack.style.transform = `translateX(-${roomShown}%)`;
      const idxDot = n > 1 ? Math.round(roomShown / 100) : 0;
      roomDots.forEach((dot, i) => dot.classList.toggle('active', i === idxDot));
    }

    function updateRoomTour() {
      const rect = roomTour.getBoundingClientRect();
      const total = roomTour.offsetHeight - window.innerHeight;
      let progress = (-rect.top) / total;
      progress = Math.min(Math.max(progress, 0), 1);
      roomTarget = progress * (n - 1) * 100;
      if (!roomRaf) roomRaf = requestAnimationFrame(renderRoom);
    }
    window.addEventListener('scroll', updateRoomTour, { passive: true });
    window.addEventListener('resize', updateRoomTour, { passive: true });
    updateRoomTour();
  }

  /* ---------- Galeria: filtros ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      galleryItems.forEach(item => {
        const show = cat === 'all' || item.dataset.cat === cat;
        item.style.display = show ? '' : 'none';
      });
    });
  });

  /* ---------- Galeria: lightbox ---------- */
  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('img');
    const lbCaption = lightbox.querySelector('.lightbox-caption');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    let visibleItems = [];
    let idx = 0;

    function openAt(i) {
      visibleItems = Array.from(galleryItems).filter(it => it.style.display !== 'none');
      idx = visibleItems.findIndex(it => it === galleryItems[i]) ;
      if (idx === -1) idx = 0;
      showCurrent();
      lightbox.classList.add('open');
    }
    function showCurrent() {
      const item = visibleItems[idx];
      if (!item) return;
      const img = item.querySelector('img');
      lbImg.src = img.src.replace(/(\.[a-z]+)$/, '$1');
      lbCaption.textContent = item.dataset.caption || '';
    }
    galleryItems.forEach((item, i) => {
      item.addEventListener('click', () => openAt(i));
    });
    closeBtn && closeBtn.addEventListener('click', () => lightbox.classList.remove('open'));
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('open'); });
    prevBtn && prevBtn.addEventListener('click', () => { idx = (idx - 1 + visibleItems.length) % visibleItems.length; showCurrent(); });
    nextBtn && nextBtn.addEventListener('click', () => { idx = (idx + 1) % visibleItems.length; showCurrent(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') lightbox.classList.remove('open');
      if (e.key === 'ArrowRight') { idx = (idx + 1) % visibleItems.length; showCurrent(); }
      if (e.key === 'ArrowLeft') { idx = (idx - 1 + visibleItems.length) % visibleItems.length; showCurrent(); }
    });
  }

  /* ---------- Testemunhos: arraste no touch/desktop ---------- */
  const track = document.querySelector('.t-track');
  if (track) {
    let isDown = false, startX, scrollLeft;
    track.addEventListener('mousedown', (e) => {
      isDown = true; startX = e.pageX - track.offsetLeft; scrollLeft = track.scrollLeft;
    });
    ['mouseleave','mouseup'].forEach(evt => track.addEventListener(evt, () => isDown = false));
    track.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      track.scrollLeft = scrollLeft - (x - startX) * 1.4;
    });
  }

  /* ---------- Animações premium ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.body.classList.add('loaded');
  document.querySelectorAll('.hero .reveal, .page-hero .reveal').forEach(el => el.classList.add('in'));

  /* Contadores animados nos números do hero */
  if (!reduceMotion) {
    document.querySelectorAll('.hero-badge b').forEach(el => {
      const m = el.textContent.trim().match(/^(\d+)(.*)$/);
      if (!m) return;
      const target = parseInt(m[1], 10);
      const suffix = m[2] || '';
      const t0 = performance.now(), dur = 1500;
      const tick = (now) => {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* Header esconde ao rolar para baixo, volta ao rolar para cima */
  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (header) {
      const menuOpen = navLinks && navLinks.classList.contains('open');
      if (y > lastY + 4 && y > 320 && !menuOpen) header.classList.add('hidden');
      else if (y < lastY - 4 || y <= 320) header.classList.remove('hidden');
    }
    lastY = y;
  }, { passive: true });

  /* Parallax sutil nas fotos de destaque */
  const parallaxImgs = document.querySelectorAll('.hero-photo img, .page-hero > img');
  if (!reduceMotion && parallaxImgs.length) {
    let pTicking = false;
    const applyParallax = () => {
      parallaxImgs.forEach(img => {
        const r = img.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        const shift = (r.top + r.height / 2 - window.innerHeight / 2) * -0.06;
        img.style.transform = `translateY(${shift.toFixed(1)}px) scale(1.12)`;
      });
      pTicking = false;
    };
    window.addEventListener('scroll', () => {
      if (!pTicking) { pTicking = true; requestAnimationFrame(applyParallax); }
    }, { passive: true });
    setTimeout(applyParallax, 1600);
  }

  /* Transição suave entre páginas */
  if (!reduceMotion) {
    document.querySelectorAll('a[href$=".html"]').forEach(a => {
      if (a.target === '_blank') return;
      a.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        document.body.classList.add('leaving');
        setTimeout(() => { window.location.href = a.getAttribute('href'); }, 230);
      });
    });
  }

});
