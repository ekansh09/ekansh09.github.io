/**
 * PREMIUM PORTFOLIO - ANIMATIONS & INTERACTIONS
 * Advanced JavaScript for stunning visual effects
 */

// ============================================
// Initialize on DOM Ready
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Prevent browsers from restoring scroll on reload/back
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  // Avoid forced scroll jumps on mobile; only reset scroll on larger screens.
  const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const smallScreen = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  if (!(isCoarse || smallScreen)) {
    window.scrollTo(0, 0);
  }

  initLoader();
  initCustomCursor();
  initNavigation();
  initMobileMenu();
  initScrollAnimations();
  initCounterAnimation();
  initSmoothScroll();
  initSkillBars();
  initThemeSwitch();
  initRoleCycler();
  updateYear();

  // Mobile/performance: disable heavy pointer/scroll effects on touch or small screens
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isCoarse && !smallScreen && !reducedMotion) {
    initMagneticButtons();
    initParticles();
  }

  // Always enable the terminal last
  initFakeTerminal();
});

// ============================================
// Page Loader
// ============================================
function initLoader() {
  const loader = document.getElementById('loader');
  
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (loader) loader.classList.add('hidden');
      document.body.style.overflow = 'visible';
      
      // Trigger initial animations after loader
      setTimeout(() => {
        document.querySelectorAll('.hero .reveal, .hero .reveal-up, .hero .reveal-scale').forEach(el => {
          el.classList.add('revealed');
        });
      }, 200);
    }, 2000);
  });
}

// ============================================
// Custom Cursor (small dot)
// ============================================
function initCustomCursor() {
  // Skip on touch devices
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;

  const dot = document.createElement('div');
  dot.className = 'cursor-dot hidden';
  document.body.appendChild(dot);

  let x = 0, y = 0;
  let raf = 0;

  function render() {
    dot.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
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
  document.addEventListener('mousedown', () => dot.classList.add('active'));
  document.addEventListener('mouseup', () => dot.classList.remove('active'));

  const hoverSel = 'a, button, .btn, [role="button"], input, textarea, select, .clickable';
  // Delegate to support dynamic content
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
// Magnetic Buttons Effect
// ============================================
function initMagneticButtons() {
  const magneticElements = document.querySelectorAll('.magnetic');
  
  magneticElements.forEach(el => {
    const strength = el.dataset.strength || 20;
    
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      el.style.transform = `translate(${x / strength}px, ${y / strength}px)`;
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
    });
  });
}

// ============================================
// Navigation
// ============================================
function initNavigation() {
  const nav = document.getElementById('nav');
  if (!nav) return;
  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    // Add scrolled class
    if (currentScroll > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  }, { passive: true });
}

// ============================================
// Mobile Menu
// ============================================
function initMobileMenu() {
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  if (!toggle || !menu) return;
  const links = menu.querySelectorAll('.mobile-link');
  
  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
  });
  
  // Close menu when clicking a link
  links.forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      menu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

// ============================================
// Theme Switch (Light/Dark with persistence)
// ============================================
function initThemeSwitch() {
  const root = document.documentElement;
  const storageKey = 'theme';
  const mql = window.matchMedia('(prefers-color-scheme: dark)');

  // Create toggle button
  const btn = document.createElement('button');
  btn.className = 'theme-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-label', 'Toggle color theme');
  btn.setAttribute('aria-pressed', 'false');

  const icon = document.createElement('span');
  icon.className = 'icon';
  const label = document.createElement('span');
  label.className = 'label';

  btn.appendChild(icon);
  btn.appendChild(label);
  document.body.appendChild(btn);

  const getStored = () => localStorage.getItem(storageKey);
  const setStored = (v) => localStorage.setItem(storageKey, v);

  function apply(mode) {
    root.setAttribute('data-theme', mode);
    const isDark = mode === 'dark';
    btn.setAttribute('aria-pressed', String(isDark));
    icon.textContent = isDark ? '🌙' : '☀️';
    // label.textContent = isDark ? 'Dark' : 'Light';
    btn.title = isDark ? 'Switch to light theme' : 'Switch to dark theme';
  }

  // Initialize theme
  const saved = getStored();
  const initial = saved || (mql.matches ? 'dark' : 'light');
  apply(initial);

  // Update on system change if user hasn't chosen explicitly
  function handleMqlChange(e) {
    if (getStored()) return; // user choice takes precedence
    apply(e.matches ? 'dark' : 'light');
  }
  mql.addEventListener?.('change', handleMqlChange);

  // Toggle on click
  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    setStored(next);
    apply(next);
  });
}

// ============================================
// Scroll Reveal Animations
// ============================================
function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        
        // Handle skill cards
        if (entry.target.classList.contains('skill-card')) {
          const progress = entry.target.querySelector('.skill-progress');
          if (progress) {
            setTimeout(() => {
              progress.style.width = progress.style.getPropertyValue('--progress');
            }, 300);
          }
        }
      }
    });
  }, observerOptions);
  
  // Observe all reveal elements except hero section (handled separately)
  document.querySelectorAll('.reveal, .reveal-up, .reveal-scale').forEach(el => {
    if (!el.closest('.hero')) {
      observer.observe(el);
    }
  });
  
  // Also observe skill cards
  document.querySelectorAll('.skill-card').forEach(el => {
    observer.observe(el);
  });
}

// ============================================
// Particles Background
// ============================================
function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  let particles = [];
  let mouseX = 0;
  let mouseY = 0;
  
  // Resize canvas
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Track mouse
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });
  
  // Particle class
  class Particle {
    constructor() {
      this.reset();
    }
    
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;
      this.opacity = Math.random() * 0.5 + 0.1;
    }
    
    update() {
      // Move
      this.x += this.speedX;
      this.y += this.speedY;
      
      // Mouse interaction
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < 150) {
        const force = (150 - distance) / 150;
        this.x -= dx * force * 0.02;
        this.y -= dy * force * 0.02;
      }
      
      // Wrap around
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;
    }
    
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
      ctx.fill();
    }
  }
  
  // Create particles
  const particleCount = Math.min(100, Math.floor(window.innerWidth / 15));
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  
  // Draw connections
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 120) {
          const opacity = (120 - distance) / 120 * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(99, 102, 241, ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }
  
  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });
    
    drawConnections();
    requestAnimationFrame(animate);
  }
  animate();
}

// ============================================
// Counter Animation
// ============================================
function initCounterAnimation() {
  const counters = document.querySelectorAll('.stat-number[data-count]');
  
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.5
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
        entry.target.classList.add('counted');
        animateCounter(entry.target);
      }
    });
  }, observerOptions);
  
  counters.forEach(counter => observer.observe(counter));
  
  function animateCounter(element) {
    const target = parseInt(element.dataset.count);
    const duration = 2000;
    const startTime = performance.now();
    
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeOutExpo = 1 - Math.pow(2, -10 * progress);
      const current = Math.floor(target * easeOutExpo);
      
      element.textContent = current;
      
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = target;
      }
    }
    
    requestAnimationFrame(update);
  }
}

// ============================================
// Smooth Scroll
// ============================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      
      if (target) {
        const headerOffset = 100;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ============================================
// Skill Bars Animation
// ============================================
function initSkillBars() {
  const skillCards = document.querySelectorAll('.skill-card');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, { threshold: 0.2 });
  
  skillCards.forEach(card => observer.observe(card));
}

// ============================================
// Update Footer Year
// ============================================
function updateYear() {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

// ============================================
// Role Badge Rotator (Freelancer, Researcher, AI engineer)
// ============================================
function initRoleCycler() {
  const articleEl = document.getElementById('roleArticle');
  const roleEl = document.getElementById('changingRole');
  const badgeEl = document.querySelector('.role-badge--by-photo');
  if (!articleEl || !roleEl) return;

  const roles = [
    { article: 'a', text: 'Freelancer' },
    { article: 'a', text: 'Researcher' },
    { article: 'an', text: 'AI engineer' }
  ];

  let idx = 0;
  const transitionMs = 500;
  const displayMs = 2200; // visible time before transitioning

  function setFixedBadgeWidth() {
    if (!badgeEl) return;
    const probe = document.createElement('span');
    probe.className = 'role-badge role-badge--by-photo';
    // Neutralize absolute positioning for measurement
    Object.assign(probe.style, {
      position: 'absolute',
      left: '-99999px',
      top: '-99999px',
      transform: 'none',
      bottom: 'auto',
      right: 'auto',
      pointerEvents: 'none',
      visibility: 'hidden'
    });
    const a = document.createElement('span');
    a.className = 'role-article';
    const t = document.createElement('span');
    t.className = 'role-text';
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
    // Apply width with a tiny buffer
    badgeEl.style.width = `${Math.ceil(maxWidth + 2)}px`;
  }

  function cycle() {
    // Animate out
    roleEl.classList.add('is-changing');
    articleEl.classList.add('is-changing');

    setTimeout(() => {
      const { article, text } = roles[idx];
      articleEl.textContent = article;
      roleEl.textContent = text;

      // Animate in
      roleEl.classList.remove('is-changing');
      articleEl.classList.remove('is-changing');

      idx = (idx + 1) % roles.length;
    }, transitionMs);
  }

  // Start immediately, then repeat
  setFixedBadgeWidth();
  cycle();
  setInterval(cycle, displayMs + transitionMs);

  // Recompute width on resize (debounced)
  let resizeTO;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTO);
    resizeTO = setTimeout(setFixedBadgeWidth, 150);
  });
}

// ============================================
// Text Scramble Effect (Optional Enhancement)
// ============================================
class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = '!<>-_\\/[]{}—=+*^?#________';
    this.update = this.update.bind(this);
  }
  
  setText(newText) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise((resolve) => this.resolve = resolve);
    this.queue = [];
    
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || '';
      const to = newText[i] || '';
      const start = Math.floor(Math.random() * 40);
      const end = start + Math.floor(Math.random() * 40);
      this.queue.push({ from, to, start, end });
    }
    
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }
  
  update() {
    let output = '';
    let complete = 0;
    
    for (let i = 0, n = this.queue.length; i < n; i++) {
      let { from, to, start, end, char } = this.queue[i];
      
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.randomChar();
          this.queue[i].char = char;
        }
        output += `<span class="scramble-char">${char}</span>`;
      } else {
        output += from;
      }
    }
    
    this.el.innerHTML = output;
    
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  }
  
  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

// ============================================
// Parallax Effect on Scroll
// ============================================
function initParallax() {
  const parallaxElements = document.querySelectorAll('[data-parallax]');
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    
    parallaxElements.forEach(el => {
      const speed = el.dataset.parallax || 0.5;
      const yPos = -(scrolled * speed);
      el.style.transform = `translateY(${yPos}px)`;
    });
  }, { passive: true });
}

// ============================================
// Image Lazy Loading with Fade
// ============================================
function initLazyImages() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.add('loaded');
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}

// ============================================
// Tilt Effect for Cards
// ============================================
function initTiltEffect() {
  const tiltElements = document.querySelectorAll('.project-card, .skill-card');
  
  tiltElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 20;
      const rotateY = (centerX - x) / 20;
      
      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-5px)`;
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
  });
}

// Initialize tilt effect after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const smallScreen = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!isCoarse && !smallScreen && !reducedMotion) {
    initTiltEffect();
    initParallax();
  }
});

// ============================================
// Typing Effect (for hero or other sections)
// ============================================
class TypeWriter {
  constructor(el, words, wait = 3000) {
    this.el = el;
    this.words = words;
    this.wait = parseInt(wait, 10);
    this.wordIndex = 0;
    this.txt = '';
    this.isDeleting = false;
    this.type();
  }
  
  type() {
    const current = this.wordIndex % this.words.length;
    const fullTxt = this.words[current];
    
    if (this.isDeleting) {
      this.txt = fullTxt.substring(0, this.txt.length - 1);
    } else {
      this.txt = fullTxt.substring(0, this.txt.length + 1);
    }
    
    this.el.innerHTML = `<span class="txt">${this.txt}</span>`;
    
    let typeSpeed = 100;
    
    if (this.isDeleting) {
      typeSpeed /= 2;
    }
    
    if (!this.isDeleting && this.txt === fullTxt) {
      typeSpeed = this.wait;
      this.isDeleting = true;
    } else if (this.isDeleting && this.txt === '') {
      this.isDeleting = false;
      this.wordIndex++;
      typeSpeed = 500;
    }
    
    setTimeout(() => this.type(), typeSpeed);
  }
}

// ============================================
// Scroll Progress Indicator
// ============================================
function initScrollProgress() {
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
    z-index: 9999;
    transition: width 0.1s ease;
  `;
  document.body.appendChild(progressBar);
  
  window.addEventListener('scroll', () => {
    const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = windowHeight > 0 ? (window.pageYOffset / windowHeight) * 100 : 0;
    progressBar.style.width = `${progress}%`;
  }, { passive: true });
}

// Initialize scroll progress
document.addEventListener('DOMContentLoaded', initScrollProgress);

// ============================================
// Prefers Reduced Motion Check
// ============================================
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (prefersReducedMotion.matches) {
  // Disable animations for users who prefer reduced motion
  document.documentElement.style.setProperty('--transition-fast', '0ms');
  document.documentElement.style.setProperty('--transition-base', '0ms');
  document.documentElement.style.setProperty('--transition-smooth', '0ms');
  document.documentElement.style.setProperty('--transition-slow', '0ms');
}

// ============================================
// Interactive Fake Terminal
// ============================================
function initFakeTerminal() {
  const body = document.querySelector('.terminal-body');
  const input = document.getElementById('terminalInput');
  const windowEl = body?.closest('.terminal-window');
  if (!body || !input || !windowEl) return;

  const PROMPT = 'ekansh@portfolio:~$';
  const history = [];
  let historyIndex = -1;
  let acceptingInput = true;

  // Focus behavior
  function focusInput() {
    if (!acceptingInput) return;
    input.focus();
    // Move caret to end
    const val = input.value;
    input.value = '';
    input.value = val;
  }
  const activeLine = document.getElementById('terminalActiveLine');
  if (activeLine) activeLine.addEventListener('click', focusInput);

  // Avoid auto-focusing input on touch/small screens to prevent the
  // browser from auto-scrolling the page down on load (common on mobile).
  const isCoarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const smallScreen = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  if (!(isCoarse || smallScreen)) {
    focusInput();
  }

  // Allow paste/typing without needing to click to focus first.
  // If user hits Cmd/Ctrl+V (or starts typing) while focus is elsewhere,
  // move focus to the terminal input so the action lands there.
  function smartFocusOnKeydown(e) {
    if (!acceptingInput) return;
    // If another input/textarea is focused and it's not our terminal input, do nothing.
    const ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA') && ae !== input) return;

    const key = e.key || '';
    const pasteCombo = (key.toLowerCase() === 'v') && (e.metaKey || e.ctrlKey);
    const isPrintable = key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey;
    const navOrEdit = ['Backspace', 'Enter', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key);

    if ((pasteCombo || isPrintable || navOrEdit) && document.activeElement !== input) {
      focusInput();
      // Let default behavior continue so paste/typing lands in input.
    }
  }
  document.addEventListener('keydown', smartFocusOnKeydown, true);

  // Utility helpers
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
    // Ensure the active prompt remains visible like a real terminal
    body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
  }

  function clearTerminal() {
    // Remove everything except the active input line
    [...body.children].forEach(ch => {
      if (!ch.id || ch.id !== 'terminalActiveLine') ch.remove();
    });
  }

  function unknown(cmd) {
    appendOutput(`Command not found. Bold. Incorrect. Iconic.<br><span style="color:#9ca3af">${cmd}</span>`);
  }

  function intro(shouldScroll = true) {
    appendLine('init');
    const aboutHTML = `<p>${files['about.txt'].replace(/\n/g, '<br>')}</p>`;
    appendOutput(`
      <div class="terminal-divider">====================================================</div>
      <div class="terminal-welcome">
        <p>Welcome! I'm Ekansh Chauhan.</p>
        <p>I work at the intersection of AI and cancer research.</p>
      </div>
      <div class="terminal-divider">====================================================</div>
      <br>
      ${aboutHTML}
      <br>
      <p class="terminal-help">Type 'help' to see available commands.</p>
    `);
    if (shouldScroll) {
      scrollToBottom();
    } else {
      // Ensure we start at the top of the terminal content
      body.scrollTop = 0;
    }
  }

  function helpText() {
    return `
      <p>Available commands (emotionally damaging, technically harmless):</p>
      <ul class="terminal-list">
        <li>- init</li>
        <li>- help</li>
        <li>- pwd</li>
        <li>- ls</li>
        <li>- cat about.txt</li>
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

  const files = {
    'about.txt': `I am currently pursuing a PhD in Cancer Sciences at <span class="terminal-highlight">Cancer Research UK (CRUK) Scotland Institute</span> and the <span class="terminal-highlight">University of Glasgow</span>. My research focuses on combining spatial transcriptomics and histopathology with deep learning. I’m also part of the <span class="terminal-highlight">PREDICT-Meso</span> consortium.`
  };

  function handleCommand(raw) {
    const cmd = raw.trim();
    if (!cmd) return;

    appendLine(cmd);

    // Commands
    if (cmd === 'help') {
      appendOutput(`<p>Here’s a totally serious manual:</p>` + helpText());
    } else if (cmd === 'clear') {
      clearTerminal();
    } else if (cmd === 'reset') {
      clearTerminal();
      intro(true);
    } else if (cmd === 'init') {
      const aboutHTML = `<p>${files['about.txt'].replace(/\\n/g, '<br>')}</p>`;
      appendOutput(`
        <div class=\"terminal-divider\">====================================================</div>
        <div class=\"terminal-welcome\">\n          <p>Welcome! I'm Ekansh Chauhan.</p>\n          <p>I work at the intersection of AI and cancer research.</p>\n        </div>\n        <div class=\"terminal-divider\">====================================================</div>\n        <br>\n        ${aboutHTML}\n        <br>\n        <p class=\"terminal-help\">Type 'help' to see available commands.</p>\n      `);
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
      appendOutput("Ekansh Chauhan — definitely human. Allegedly well-rested.");
    } else if (cmd.startsWith('echo ')) {
      appendOutput(`Echoing… because silence was too powerful:<br><span style="color:#9ca3af">${cmd.slice(5)}</span>`);
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
      appendOutput("Launching Vim… psych. You don't get to suffer today.");
    } else if (cmd.startsWith('sudo rm -rf')) {
      appendOutput("Nice try. Permission denied. I'm chaotic, not self-destructive.");
    } else if (cmd === 'exit') {
      appendOutput('Exiting… may your bugs be features.');
      acceptingInput = false;
      input.disabled = true;
    } else {
      unknown(cmd);
    }

    scrollToBottom();
  }

  // Input behaviors
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
        input.value = history[historyIndex] || '';
        // place caret at end
        setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      if (history.length) {
        historyIndex = Math.min(history.length, historyIndex + 1);
        input.value = history[historyIndex] || '';
        setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
      }
      e.preventDefault();
    }
  });


  // Start with a friendly intro the first time when page loads
  // but only if the page doesn't already show the about.txt demo
  // We will append the intro below the pre-seeded content on reset
  // Initial render: show intro but keep scroll at top like a classic terminal
  intro(false);
}
