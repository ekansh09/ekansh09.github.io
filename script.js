/**
 * PORTFOLIO 3D GLASSMORPHISM EDITION
 * 3D Starfield, Mouse-Tracking Scene, Tilt Cards, Neon Effects
 */

// ============================================
// Initialize on DOM Ready
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Prevent browsers from restoring scroll on reload/back
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const smallScreen = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!window.location.hash) {
    const resetScroll = () => window.scrollTo(0, 0);
    resetScroll();
    requestAnimationFrame(resetScroll);
    window.addEventListener('load', resetScroll, { once: true });
    window.addEventListener('pageshow', resetScroll);
  }

  initThemeSwitch();
  initCollapsibleSections();
  initResearchList();
  initSectionNavigation();
  initRoleCycler();
  updateYear();
  initScrollProgress();
  initFakeTerminal();
  initMobileDownIndicator();

  // 3D & visual effects — only on capable devices
  if (!reducedMotion) {
    init3DStarfield();

    if (!isCoarse && !smallScreen) {
      initCustomCursor();
      init3DSceneTracking();
      initTiltCards();
      initMagneticLinks();
    }
  }
});

// ============================================
// 3D Starfield Canvas
// ============================================
function init3DStarfield() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  let W = window.innerWidth;
  let H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;

  const NUM_STARS = Math.min(280, Math.floor((W * H) / 5000));
  const CENTER_X = W / 2;
  const CENTER_Y = H / 2;
  const FOCAL   = 500;
  const SPEED   = 0.6;

  // Stars: x,y in -1..1 space, z: depth 0-1
  const stars = [];

  function spawnStar(z) {
    return {
      x: (Math.random() - 0.5) * 2,
      y: (Math.random() - 0.5) * 2,
      z: z ?? Math.random(),
      size: Math.random() * 1.5 + 0.3,
      brightness: Math.random() * 0.6 + 0.4,
      hue: Math.random() < 0.15
        ? 205  // occasional slate-blue tint
        : 170  // teal-white core
    };
  }

  for (let i = 0; i < NUM_STARS; i++) {
    stars.push(spawnStar());
  }

  // Nebula dust particles (slower, larger, dimmer)
  const NUM_NEBULA = Math.min(30, Math.floor(W / 60));
  const nebula = [];
  for (let i = 0; i < NUM_NEBULA; i++) {
    nebula.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 3 + 1,
      opacity: Math.random() * 0.08 + 0.02,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.1,
      hue: Math.random() < 0.5 ? 180 : 205
    });
  }

  let raf;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
  }
  window.addEventListener('resize', resize);

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Draw nebula dust
    nebula.forEach(n => {
      n.x += n.speedX;
      n.y += n.speedY;
      if (n.x < 0) n.x = W;
      if (n.x > W) n.x = 0;
      if (n.y < 0) n.y = H;
      if (n.y > H) n.y = 0;

      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${n.hue}, 70%, 70%, ${n.opacity})`;
      ctx.fill();
    });

    // Draw 3D stars
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      s.z -= SPEED / 1000;

      if (s.z <= 0) {
        stars[i] = spawnStar(1);
        continue;
      }

      // Project 3D -> 2D
      const scale = FOCAL / (FOCAL * s.z);
      const px = CENTER_X + s.x * W * 0.5 * scale;
      const py = CENTER_Y + s.y * H * 0.5 * scale;

      if (px < 0 || px > W || py < 0 || py > H) {
        stars[i] = spawnStar(1);
        continue;
      }

      // Closer = bigger & brighter
      const depth     = 1 - s.z;
      const radius    = s.size * depth * 2.5 + 0.3;
      const opacity   = s.brightness * depth;

      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);

      // White core with colored tint
      const alpha = Math.min(opacity, 1);
      ctx.fillStyle = `hsla(${s.hue}, 80%, 90%, ${alpha})`;
      ctx.fill();

      // Glow halo for brighter stars
      if (opacity > 0.6 && radius > 0.8) {
        const grd = ctx.createRadialGradient(px, py, 0, px, py, radius * 3.5);
        grd.addColorStop(0,   `hsla(${s.hue}, 80%, 80%, ${alpha * 0.35})`);
        grd.addColorStop(1,   `hsla(${s.hue}, 80%, 80%, 0)`);
        ctx.beginPath();
        ctx.arc(px, py, radius * 3.5, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
      }
    }

    raf = requestAnimationFrame(draw);
  }

  draw();

  // Clean up on page hide
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else raf = requestAnimationFrame(draw);
  });
}

// ============================================
// 3D Scene Mouse Tracking (parallax tilt)
// ============================================
function init3DSceneTracking() {
  const scene = document.getElementById('scene3d');
  if (!scene) return;

  const MAX_TILT = 4; // degrees
  let targetRX = 0, targetRY = 0;
  let currentRX = 0, currentRY = 0;
  let raf;

  document.addEventListener('mousemove', (e) => {
    const nx = (e.clientX / window.innerWidth  - 0.5) * 2; // -1 to 1
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;

    targetRY =  nx * MAX_TILT;
    targetRX = -ny * MAX_TILT * 0.6;
  }, { passive: true });

  // Reset on leave
  document.addEventListener('mouseleave', () => {
    targetRX = 0;
    targetRY = 0;
  });

  function tick() {
    // Smooth lerp toward target
    currentRX += (targetRX - currentRX) * 0.06;
    currentRY += (targetRY - currentRY) * 0.06;

    scene.style.transform = `rotateX(${currentRX}deg) rotateY(${currentRY}deg)`;

    raf = requestAnimationFrame(tick);
  }

  tick();
}

// ============================================
// 3D Tilt Cards (terminal + profile image)
// ============================================
function initTiltCards() {
  const cards = document.querySelectorAll('.tilt-card');
  const MAX = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--tilt-max')) || 3;
  const EASING = 0.085;

  cards.forEach(card => {
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = null;

    function render() {
      currentX += (targetX - currentX) * EASING;
      currentY += (targetY - currentY) * EASING;

      const settled = Math.abs(targetX - currentX) < 0.01 && Math.abs(targetY - currentY) < 0.01;
      if (settled) {
        currentX = targetX;
        currentY = targetY;
      }

      const depth = Math.min(3, Math.max(Math.abs(currentX), Math.abs(currentY)));
      card.style.transform = `perspective(1200px) rotateX(${currentX}deg) rotateY(${currentY}deg) translateZ(${depth}px)`;

      if (settled) raf = null;
      else raf = requestAnimationFrame(render);
    }

    function requestRender() {
      if (raf === null) raf = requestAnimationFrame(render);
    }

    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) / (rect.width  / 2);
      const dy   = (e.clientY - cy) / (rect.height / 2);

      targetX = -dy * MAX;
      targetY = dx * MAX;
      requestRender();
    });

    card.addEventListener('mouseleave', () => {
      targetX = 0;
      targetY = 0;
      requestRender();
    });
  });
}

// ============================================
// Magnetic Link Effect
// ============================================
function initMagneticLinks() {
  document.querySelectorAll('.magnetic').forEach(el => {
    const strength = parseFloat(el.dataset.strength || 18);

    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;

      el.style.transform = `translate(${dx / strength}px, ${dy / strength}px)`;
    });

    el.addEventListener('mouseleave', () => {
      el.style.transform = '';
    });
  });
}

// ============================================
// Custom Cursor (neon dot)
// ============================================
function initCustomCursor() {
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'cursor-dot hidden';
  document.body.appendChild(dot);

  let x = 0, y = 0, raf = 0;

  function render() {
    dot.style.left = x + 'px';
    dot.style.top  = y + 'px';
    raf = 0;
  }

  function onMove(e) {
    x = e.clientX;
    y = e.clientY;
    dot.classList.remove('hidden');
    if (!raf) raf = requestAnimationFrame(render);
  }

  document.addEventListener('mousemove', onMove, { passive: true });
  document.addEventListener('mouseenter', () => dot.classList.remove('hidden'));
  document.addEventListener('mouseleave', () => dot.classList.add('hidden'));
  document.addEventListener('mousedown',  () => dot.classList.add('active'));
  document.addEventListener('mouseup',    () => dot.classList.remove('active'));

  const hoverSel = 'a, button, .btn, [role="button"], input, textarea, select, .clickable, .tilt-card';
  document.addEventListener('mouseover', (e) => {
    if (e.target && (e.target.matches(hoverSel) || e.target.closest(hoverSel))) {
      dot.classList.add('hover');
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target && (e.target.matches(hoverSel) || e.target.closest(hoverSel))) {
      dot.classList.remove('hover');
    }
  });
}

// ============================================
// Scroll Progress Bar
// ============================================
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress-bar';
  bar.style.width = '0%';
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    const progress = total > 0 ? (window.pageYOffset / total) * 100 : 0;
    bar.style.width = `${progress}%`;
  }, { passive: true });
}

// ============================================
// Mobile Down Arrow Indicator
// ============================================
function initMobileDownIndicator() {
  const btn = document.querySelector('.mobile-down-nav');
  if (!btn) return;
  const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  if (!isMobile) return;

  btn.classList.remove('is-hidden');
  const hide = () => btn.classList.add('is-hidden');
  const maybeToggle = () => {
    if (window.pageYOffset > 60) hide();
    else btn.classList.remove('is-hidden');
  };
  window.addEventListener('scroll', maybeToggle, { passive: true });
  btn.addEventListener('click', hide);
  setTimeout(hide, 5000);
}

// ============================================
// Collapsible content sections
// ============================================
function setSectionExpanded(section, expanded) {
  const button = section?.querySelector(':scope > .section-heading .section-toggle');
  const content = section?.querySelector(':scope > .section-content');
  if (!button || !content) return;

  button.setAttribute('aria-expanded', String(expanded));
  button.setAttribute('aria-label', `${expanded ? 'Collapse' : 'Expand'} ${button.dataset.sectionTitle}`);
  content.hidden = !expanded;
  section.classList.toggle('is-collapsed', !expanded);
  section.dispatchEvent(new CustomEvent('sectiontoggle', { detail: { expanded } }));
}

function initCollapsibleSections() {
  const sections = document.querySelectorAll('.content-section');

  sections.forEach((section) => {
    const heading = section.querySelector(':scope > .section-heading');
    if (!heading) return;

    const iconText = heading.querySelector('.section-heading-icon')?.textContent || '';
    const title = heading.textContent.replace(iconText, '').trim().replace(/\s+/g, ' ');
    const content = document.createElement('div');
    content.className = 'section-content';
    content.id = `${section.id}-content`;

    while (heading.nextSibling) content.appendChild(heading.nextSibling);
    section.appendChild(content);

    const headingMain = document.createElement('span');
    headingMain.className = 'section-heading-main';
    headingMain.append(...heading.childNodes);

    const button = document.createElement('button');
    button.className = 'section-toggle';
    button.type = 'button';
    button.dataset.sectionTitle = title;
    button.setAttribute('aria-controls', content.id);
    button.appendChild(headingMain);

    const chevron = document.createElement('span');
    chevron.className = 'section-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    button.appendChild(chevron);
    heading.appendChild(button);

    const startsCollapsed = section.dataset.startCollapsed === 'true';
    setSectionExpanded(section, !startsCollapsed);

    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      setSectionExpanded(section, !isExpanded);
    });
  });
}

// ============================================
// Research list disclosure
// ============================================
function initResearchList() {
  const list = document.getElementById('researchList');
  const button = document.getElementById('toggleResearch');
  if (!list || !button) return;

  const cards = [...list.querySelectorAll(':scope > .research-card')];
  const extraCards = cards.slice(3);
  if (!extraCards.length) return;

  const label = button.querySelector('.research-more-label');
  extraCards.forEach((card) => {
    card.classList.add('research-card--extra');
    card.hidden = true;
  });
  button.hidden = false;

  button.addEventListener('click', () => {
    const shouldExpand = button.getAttribute('aria-expanded') !== 'true';
    extraCards.forEach((card) => { card.hidden = !shouldExpand; });
    button.setAttribute('aria-expanded', String(shouldExpand));
    button.classList.toggle('is-expanded', shouldExpand);
    if (label) label.textContent = shouldExpand ? 'Show less' : 'Show more';
  });
}

// ============================================
// Compact section navigation
// ============================================
function initSectionNavigation() {
  const nav = document.querySelector('.section-nav');
  const links = [...document.querySelectorAll('.section-nav-link')];
  const sections = [...document.querySelectorAll('.content-section')];
  const toggleAll = document.getElementById('toggleAllSections');
  if (!nav || !links.length || !sections.length) return;
  if (toggleAll) toggleAll.hidden = false;

  const updateAllLabel = () => {
    const hasExpandedSection = sections.some((section) => !section.classList.contains('is-collapsed'));
    if (toggleAll) toggleAll.textContent = hasExpandedSection ? 'Collapse all' : 'Expand all';
  };

  sections.forEach((section) => section.addEventListener('sectiontoggle', updateAllLabel));
  updateAllLabel();

  toggleAll?.addEventListener('click', () => {
    const shouldExpand = sections.every((section) => section.classList.contains('is-collapsed'));
    sections.forEach((section) => setSectionExpanded(section, shouldExpand));
    if (!shouldExpand) nav.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  links.forEach((link) => {
    link.addEventListener('click', () => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target?.classList.contains('is-collapsed')) setSectionExpanded(target, true);
    });
  });

  let ticking = false;
  const updateActiveLink = () => {
    const marker = nav.getBoundingClientRect().bottom + 28;
    let active = null;
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= marker) active = section;
    });

    links.forEach((link) => {
      const isActive = Boolean(active && link.getAttribute('href') === `#${active.id}`);
      link.classList.toggle('is-active', isActive);
      if (isActive) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateActiveLink);
  }, { passive: true });
  updateActiveLink();

  let initialTarget = null;
  try {
    initialTarget = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
  } catch { /* Ignore malformed URL fragments. */ }
  if (initialTarget) {
    if (initialTarget.classList.contains('content-section')) setSectionExpanded(initialTarget, true);
    requestAnimationFrame(() => initialTarget.scrollIntoView({ block: 'start' }));
  }
}

// ============================================
// Theme Switch (Light/Dark with persistence)
// ============================================
function initThemeSwitch() {
  const root       = document.documentElement;
  const storageKey = 'theme';
  const mql        = window.matchMedia('(prefers-color-scheme: dark)');
  const themeMeta  = document.querySelector('meta[name="theme-color"]');

  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.type      = 'button';
  btn.setAttribute('aria-label', 'Toggle color theme');
  btn.setAttribute('aria-pressed', 'false');

  const icon  = document.createElement('span');
  icon.className = 'icon';
  const label = document.createElement('span');
  label.className = 'label';
  btn.appendChild(icon);
  btn.appendChild(label);
  document.body.appendChild(btn);

  const getStored = () => {
    try { return localStorage.getItem(storageKey); }
    catch { return null; }
  };
  const setStored = (v) => {
    try { localStorage.setItem(storageKey, v); }
    catch { /* The theme still works for this session. */ }
  };

  function apply(mode) {
    root.setAttribute('data-theme', mode);
    const isDark = mode === 'dark';
    btn.setAttribute('aria-pressed', String(isDark));
    icon.textContent = isDark ? '🌙' : '☀️';
    btn.title = isDark ? 'Switch to light theme' : 'Switch to dark theme';
    themeMeta?.setAttribute('content', isDark ? '#0b1014' : '#f4f6f5');
  }

  const saved   = getStored();
  const initial = saved || (mql.matches ? 'dark' : 'light');
  apply(initial);

  mql.addEventListener?.('change', (e) => {
    if (getStored()) return;
    apply(e.matches ? 'dark' : 'light');
  });

  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setStored(next);
    apply(next);
  });
}

// ============================================
// Update Footer Year
// ============================================
function updateYear() {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
}

// ============================================
// Smooth Scroll for anchor links
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        if (target.classList.contains('is-collapsed')) setSectionExpanded(target, true);
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
});

// ============================================
// Role Badge Rotator
// ============================================
function initRoleCycler() {
  const articleEl = document.getElementById('roleArticle');
  const roleEl    = document.getElementById('changingRole');
  const badgeEl   = document.querySelector('.role-badge--by-photo');
  if (!articleEl || !roleEl) return;

  const roles = [
    { article: 'a',  text: 'Freelancer'  },
    { article: 'a',  text: 'Consultant'  },
    { article: 'a',  text: 'Researcher'  },
    { article: 'an', text: 'AI engineer' }
  ];

  let idx           = 0;
  const transitionMs = 500;
  const displayMs    = 2200;

  function setFixedBadgeWidth() {
    if (!badgeEl) return;
    const probe = document.createElement('span');
    probe.className = 'role-badge role-badge--by-photo';
    const cs = window.getComputedStyle(badgeEl);
    Object.assign(probe.style, {
      position:    'absolute',
      left:        '-99999px',
      top:         '-99999px',
      transform:   'none',
      bottom:      'auto',
      right:       'auto',
      pointerEvents: 'none',
      visibility:  'hidden',
      boxSizing:   cs.boxSizing,
      padding:     cs.padding,
      border:      cs.border,
      borderRadius: cs.borderRadius,
      fontFamily:  cs.fontFamily,
      fontSize:    cs.fontSize,
      fontWeight:  cs.fontWeight,
      letterSpacing: cs.letterSpacing,
      lineHeight:  cs.lineHeight,
      whiteSpace:  'nowrap',
      display:     cs.display
    });
    const a = document.createElement('span');
    a.className = 'role-article';
    const t = document.createElement('span');
    t.className = 'role-text';
    const aCS = window.getComputedStyle(articleEl);
    const tCS = window.getComputedStyle(roleEl);
    Object.assign(a.style, {
      fontFamily: aCS.fontFamily, fontSize: aCS.fontSize,
      fontWeight: aCS.fontWeight, letterSpacing: aCS.letterSpacing, lineHeight: aCS.lineHeight
    });
    Object.assign(t.style, {
      fontFamily: tCS.fontFamily, fontSize: tCS.fontSize,
      fontWeight: tCS.fontWeight, letterSpacing: tCS.letterSpacing, lineHeight: tCS.lineHeight
    });
    probe.appendChild(a);
    probe.appendChild(t);
    document.body.appendChild(probe);

    let maxWidth = 0;
    roles.forEach(({ article, text }) => {
      a.textContent = article;
      t.textContent = text;
      probe.style.width = 'auto';
      const w = probe.offsetWidth;
      if (w > maxWidth) maxWidth = w;
    });
    document.body.removeChild(probe);
    badgeEl.style.width = `${Math.ceil(maxWidth + 2)}px`;
  }

  function cycle() {
    roleEl.classList.add('is-changing');
    articleEl.classList.add('is-changing');
    setTimeout(() => {
      const { article, text } = roles[idx];
      articleEl.textContent = article;
      roleEl.textContent = text;
      roleEl.classList.remove('is-changing');
      articleEl.classList.remove('is-changing');
      idx = (idx + 1) % roles.length;
    }, transitionMs);
  }

  setFixedBadgeWidth();
  if (document.fonts && typeof document.fonts.ready?.then === 'function') {
    document.fonts.ready.then(() => setFixedBadgeWidth());
  }
  window.addEventListener('orientationchange', () => setTimeout(setFixedBadgeWidth, 250));

  cycle();
  setInterval(cycle, displayMs + transitionMs);

  let resizeTO;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(setFixedBadgeWidth, 150);
  });
}

// ============================================
// Interactive Fake Terminal
// ============================================
function initFakeTerminal() {
  const body      = document.querySelector('.terminal-body');
  const input     = document.getElementById('terminalInput');
  const windowEl  = body?.closest('.terminal-window');
  if (!body || !input || !windowEl) return;

  const PROMPT = 'ekansh@portfolio:~$';
  const history = [];
  let historyIndex = -1;
  let acceptingInput = true;

  function focusInput() {
    if (!acceptingInput) return;
    input.focus({ preventScroll: true });
    const val = input.value;
    input.value = '';
    input.value = val;
  }

  const activeLine = document.getElementById('terminalActiveLine');
  if (activeLine) activeLine.addEventListener('click', focusInput);
  windowEl.addEventListener('click', (event) => {
    if (event.target.closest('a, button')) return;
    focusInput();
  });
  input.addEventListener('focus', () => windowEl.classList.add('is-input-active'));
  input.addEventListener('blur', () => windowEl.classList.remove('is-input-active'));

  function smartFocusOnKeydown(e) {
    if (!acceptingInput) return;
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') && ae !== input) return;
    const key        = e.key || '';
    const pasteCombo = (key.toLowerCase() === 'v') && (e.metaKey || e.ctrlKey);
    const isPrintable = key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey;
    const navOrEdit   = ['Backspace','Enter','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key);
    if ((pasteCombo || isPrintable || navOrEdit) && document.activeElement !== input) {
      focusInput();
    }
  }
  document.addEventListener('keydown', smartFocusOnKeydown, true);

  function appendLine(commandText) {
    const line = document.createElement('div');
    line.className = 'terminal-line';
    line.innerHTML = `<span class="terminal-prompt">${PROMPT}</span><span class="terminal-command"></span>`;
    line.querySelector('.terminal-command').textContent = commandText;
    body.insertBefore(line, document.getElementById('terminalActiveLine'));
  }

  function appendOutput(html) {
    const out = document.createElement('div');
    out.className = 'terminal-output';
    out.innerHTML = html;
    body.insertBefore(out, document.getElementById('terminalActiveLine'));
  }

  function scrollToBottom() {
    body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
  }

  function clearTerminal() {
    [...body.children].forEach(ch => {
      if (!ch.id || ch.id !== 'terminalActiveLine') ch.remove();
    });
  }

  function appendHelpHint() {
    appendOutput(`<p class="terminal-help">Type 'help' to see available commands.</p>`);
  }

  function unknown(cmd) {
    appendOutput(`Command not found. Bold. Incorrect. Iconic.<br><span class="terminal-muted">${cmd}</span>`);
  }

  const files = {
    'about.txt': `I am currently pursuing a PhD in Cancer Sciences at <span class="terminal-highlight">Cancer Research UK (CRUK) Scotland Institute</span> and the <span class="terminal-highlight">University of Glasgow</span>. My research focuses on combining spatial transcriptomics and histopathology with deep learning. I also take on selected <span class="terminal-highlight">AI consulting and freelance projects</span> in machine learning, computer vision, and research engineering.`
  };

  function helpText() {
    return `
      <p>Available commands:</p>
      <ul class="terminal-list">
        <li>- init</li>
        <li>- help</li>
        <li>- pwd</li>
        <li>- ls</li>
        <li>- cat about.txt</li>
        <li>- coffee</li>
        <li>- services</li>
        <li>- whoami</li>
        <li>- echo &lt;text&gt;</li>
        <li>- touch &lt;file&gt;</li>
        <li>- history</li>
        <li>- df -h</li>
        <li>- ps aux</li>
        <li>- vim</li>
        <li>- sudo rm -rf /</li>
        <li>- exit</li>
      </ul>
      <br>
      <p>Utility commands (for when you panic responsibly):</p>
      <ul class="terminal-list">
        <li>- reset — Reset terminal to initial state</li>
        <li>- clear — Clear terminal</li>
      </ul>
      <br>
      <p>Tip: Use ↑ and ↓ for history. Like regrets, but faster.</p>
    `;
  }

  function intro(shouldScroll = true) {
    appendLine('init');
    const aboutHTML = `<p>${files['about.txt'].replace(/\n/g, '<br>')}</p>`;
    appendOutput(`
      <div class="terminal-divider">====================================================</div>
      <div class="terminal-welcome">
        <p>Welcome! I'm Ekansh Chauhan.</p>
        <p>I build research-led AI for health and science.</p>
      </div>
      <div class="terminal-divider">====================================================</div>
      <br>
      ${aboutHTML}
      <br>
      <p class="terminal-help">Type 'help' to see available commands.</p>
    `);
    if (shouldScroll) scrollToBottom();
    else body.scrollTop = 0;
  }

  function handleCommand(raw) {
    const cmd = raw.trim();
    if (!cmd) return;

    appendLine(cmd);

    if (cmd === 'help') {
      appendOutput(`<p>Here's a totally serious manual:\n</p>` + helpText());
    } else if (cmd === 'clear') {
      clearTerminal();
      appendHelpHint();
    } else if (cmd === 'reset') {
      clearTerminal();
      intro(true);
    } else if (cmd === 'init') {
      const aboutHTML = `<p>${files['about.txt'].replace(/\\n/g, '<br>')}</p>`;
      appendOutput(`
        <div class="terminal-divider">====================================================</div>
        <div class="terminal-welcome">
          <p>Welcome! I'm Ekansh Chauhan.</p>
          <p>I build research-led AI for health and science.</p>
        </div>
        <div class="terminal-divider">====================================================</div>
        <br>
        ${aboutHTML}
        <br>
        <p class="terminal-help">Type 'help' to see available commands.</p>
      `);
    } else if (cmd === 'pwd') {
      appendOutput('/opt/dreams/unicorn-startup-ideas');
    } else if (cmd === 'ls') {
      appendOutput('<p>Listing files… because guessing is for amateurs.</p>DEFINITELY_NOT_SECRETS/  research_papers/  freelancing_projects/  Documents/ ');
    } else if (cmd.startsWith('cat ')) {
      const target = cmd.slice(4).trim();
      if (files[target]) {
        appendOutput(`<p>Printing ${target}… (try not to get emotionally attached).</p><p>${files[target].replace(/\n/g, '<br>')}</p>`);
      } else {
        appendOutput(`cat: ${target}: No such file. It left you on read.`);
      }
    } else if (cmd === 'whoami') {
      appendOutput('Ekansh Chauhan — definitely human. Allegedly well-rested.');
    } else if (cmd === 'services') {
      appendOutput(`<p>Consulting &amp; freelance services:</p><ul class="terminal-list"><li>- AI strategy and rapid prototyping</li><li>- Computer vision and multimodal ML</li><li>- Research engineering and scientific software</li></ul><br><p>Contact: 3068652c@student.gla.ac.uk</p>`);
    } else if (cmd === 'coffee') {
      appendOutput(`<p>Brewing one free e-coffee…</p><p>No beans, no bill, and it never goes cold. Perfect for literature ideas, feasibility questions, or an honest career conversation.</p><br><p>Bring curiosity: 3068652c@student.gla.ac.uk</p>`);
    } else if (cmd.startsWith('echo ')) {
      appendOutput(`Echoing… because silence was too powerful:<br><span class="terminal-muted">${cmd.slice(5)}</span>`);
    } else if (cmd.startsWith('touch ')) {
      const f = cmd.slice(6).trim();
      if (f) {
        appendOutput(`Created '${f}' (in spirit). Your filesystem remains unbothered.`);
      } else {
        appendOutput('touch: missing file operand (try a cute filename).');
      }
    } else if (cmd === 'history') {
      const text = history.map((h, i) => `${i + 1}  ${h}`).join('<br>');
      appendOutput(text ? `<p>History repeats itself... especially if you copy-paste it. :) </p>${text}` : '(empty — spotless record!)');
    } else if (cmd === 'df -h') {
      appendOutput(`<p>Disk usage report (because denial isn't a strategy):</p>Filesystem      Size  Used Avail Use% Mounted on<br>/dev/sim0       512G  120G  392G  24% /<br>devfs            1.0K  1.0K     0 100% /dev`);
    } else if (cmd === 'ps aux') {
      appendOutput(`<p>Processes pretending to be busy:</p>USER   PID  %CPU %MEM COMMAND<br>root     1   0.0  0.1 launchd<br>ekansh  42   3.1  1.2 node portfolio.js<br>ekansh 1337  0.5  0.7 python train.py`);
    } else if (cmd === 'vim') {
      appendOutput('Launching Vim… psych. You don\'t get to suffer today.');
    } else if (cmd.startsWith('sudo rm -rf')) {
      appendOutput('Nice try. Permission denied. I\'m chaotic, not self-destructive.');
    } else if (cmd === 'exit') {
      appendOutput('Exiting… may your bugs be features.');
      acceptingInput = false;
      windowEl.classList.remove('is-input-active');
      input.disabled = true;
    } else {
      unknown(cmd);
    }

    scrollToBottom();
  }

  input.addEventListener('keydown', (e) => {
    if (!acceptingInput) return;
    if (e.key === 'Enter') {
      const value = input.value;
      if (value.trim()) {
        history.push(value);
        historyIndex = history.length;
      }
      handleCommand(value);
      input.value = '';
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      if (history.length) {
        historyIndex = Math.max(0, historyIndex - 1);
        input.value  = history[historyIndex] || '';
        setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (history.length) {
        historyIndex = Math.min(history.length, historyIndex + 1);
        input.value  = history[historyIndex] || '';
        setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
      }
      e.preventDefault();
    }
  });

  // Show intro on load
  intro(false);
}

// ============================================
// Contact Modal
// ============================================
function initContactModal() {
  const overlay  = document.getElementById('contactOverlay');
  const trigger  = document.getElementById('contactTrigger');
  const closeBtn = document.getElementById('contactModalClose');
  const form     = document.getElementById('contactForm');
  if (!overlay || !trigger || !closeBtn) return;

  let captchaAnswer = 0;

  function refreshCaptcha() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    captchaAnswer = a + b;
    const q = document.getElementById('captchaQuestion');
    if (q) q.textContent = `${a} + ${b}`;
    const input = document.getElementById('cfCaptcha');
    if (input) input.value = '';
  }

  function open() {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    refreshCaptcha();
    closeBtn.focus();
  }

  function close() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    trigger.focus();
  }

  trigger.addEventListener('click', open);
  document.getElementById('ecoffeeTrigger')?.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) close();
  });

  const submitBtn = form?.querySelector('.contact-submit');

  document.getElementById('cfEmail')?.addEventListener('input', (e) => {
    e.target.classList.remove('contact-input-error');
  });
  document.getElementById('cfCaptcha')?.addEventListener('input', (e) => {
    e.target.classList.remove('contact-input-error');
  });
  document.getElementById('cfMessage')?.addEventListener('input', (e) => {
    e.target.classList.remove('contact-input-error');
    const hint = e.target.closest('.contact-field')?.querySelector('.contact-field-hint');
    if (hint) hint.remove();
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const first   = document.getElementById('cfFirstName')?.value.trim() || '';
    const last    = document.getElementById('cfLastName')?.value.trim() || '';
    const email   = document.getElementById('cfEmail')?.value.trim() || '';
    const service = document.getElementById('cfService')?.value || '';
    const message = document.getElementById('cfMessage')?.value.trim() || '';
    const captchaInput = document.getElementById('cfCaptcha');
    const captchaVal = parseInt(captchaInput?.value.trim(), 10);

    const messageInput = document.getElementById('cfMessage');
    if (!message) {
      messageInput?.classList.add('contact-input-error');
      messageInput?.focus();
      const field = messageInput?.closest('.contact-field');
      if (field && !field.querySelector('.contact-field-hint')) {
        const hint = document.createElement('p');
        hint.className = 'contact-field-hint';
        hint.textContent = "This isn't a therapy session - say something.";
        field.appendChild(hint);
      }
      return;
    }

    const emailInput = document.getElementById('cfEmail');
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    if (!emailValid) {
      emailInput?.classList.add('contact-input-error');
      emailInput?.focus();
      return;
    }
    emailInput?.classList.remove('contact-input-error');

    if (captchaVal !== captchaAnswer) {
      captchaInput?.classList.add('contact-input-error');
      captchaInput?.focus();
      refreshCaptcha();
      return;
    }
    captchaInput?.classList.remove('contact-input-error');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: '49cf9cbe-505b-4d50-93ee-504200751b08',
          subject: `[Portfolio] ${service || 'Enquiry'} from ${first} ${last}`.trim(),
          name: `${first} ${last}`.trim(),
          email,
          service,
          message,
        }),
      });

      const data = await res.json();

      if (data.success) {
        form.innerHTML = `<div class="contact-success">
          <p>Message sent — I'll get back to you soon!</p>
        </div>`;
      } else {
        throw new Error(data.message || 'Submission failed');
      }
    } catch {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      }
      const err = form.querySelector('.contact-form-error') || document.createElement('p');
      err.className = 'contact-form-error';
      err.textContent = 'Something went wrong — please try again or email me directly.';
      form.appendChild(err);
    }
  });
}

document.addEventListener('DOMContentLoaded', initContactModal);
