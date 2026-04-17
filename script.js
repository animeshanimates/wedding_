/**
 * ================================================================
 *  WEDDING MICROSITE — script.js
 *  Suryanshu & Aishwarya · Varanasi 2026
 *
 *  Modules (in order):
 *    1. DOM Cache          — grab all elements once
 *    2. Loader / Entry     — cinematic gate + autoplay bypass
 *    3. Audio Engine       — custom HTML5 player + toggle UI
 *    4. Countdown Timer    — live digits to March 2, 2026
 *    5. Parallax           — hero background parallax o¯n scroll/gyro
 *    6. Scroll Reveal      — IntersectionObserver fade-up/blur-in
 *    7. FAB Bar            — show floating action bar after entry
 *    8. Haptic Feedback    — scale(0.95) press effect
 *    9. Init               — boot sequence
 * ================================================================
 */

'use strict';

/* ================================================================
   1. DOM CACHE
================================================================ */
const DOM = {
  loader:        document.getElementById('loader'),
  enterBtn:      document.getElementById('btn-enter'), 
  mainSite:      document.getElementById('main-site'),
  heroBg:        document.getElementById('hero-bg'),
  fabBar:        document.getElementById('fab-bar'),
  musicToggle:   document.getElementById('music-toggle'),
  audio:         document.getElementById('wedding-audio'),
  cdDays:        document.getElementById('count-days'),
  cdHours:       document.getElementById('count-hours'),
  cdMins:        document.getElementById('count-mins'),
  cdSecs:        document.getElementById('count-secs'),
};

/* ================================================================
   2. LOADER / ENTRY
   The loader is the full-screen gate. Clicking "Enter Our World"
   triggers:
     a) The cinematic exit animation
     b) Music auto-play (user gesture unblocks browser policy)
     c) The main site fade-in
================================================================ */
const Loader = (() => {

  /** Called once the enter button is clicked */
  function handleEntry() {

    // Step 1 — Play music immediately (gesture unlock)
    Audio.play();

    // Step 2 — Trigger exit animation on loader
    DOM.loader.classList.add('loader-exit');

    // Step 3 — After animation completes, fully remove loader
    //          and reveal main site
    DOM.loader.addEventListener('animationend', () => {
      DOM.loader.style.display = 'none';
      revealSite();
    }, { once: true });
  }

  /** Reveals the main site with a graceful sequence */
  function revealSite() {
    DOM.mainSite.removeAttribute('aria-hidden');
    DOM.mainSite.style.opacity = '0';
    DOM.mainSite.style.transition = 'opacity 0.8s ease';

    // Trigger reflow so transition fires
    void DOM.mainSite.offsetHeight;
    DOM.mainSite.style.opacity = '1';

    // Add body padding for FAB (bottom action bar)
    document.body.classList.add('site-active');

    // Show FAB bar — staggered slightly after site appears
    setTimeout(() => {
      DOM.fabBar.hidden = false;
      // requestAnimationFrame ensures display:block renders before class add
      requestAnimationFrame(() => {
        requestAnimationFrame(() => DOM.fabBar.classList.add('visible'));
      });
    }, 400);

    // Show music toggle
    setTimeout(() => {
      DOM.musicToggle.hidden = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => DOM.musicToggle.classList.add('visible'));
      });
    }, 700);
  }

  /** Bind the enter button click */
  function init() {
    DOM.enterBtn.addEventListener('click', handleEntry);

    // Keyboard support — Enter or Space
    DOM.enterBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleEntry();
      }
    });
  }

  return { init };
})();


/* ================================================================
   3. AUDIO ENGINE
   Custom HTML5 audio controller.
   - play() / pause() / toggle()
   - Visual feedback: .playing class on musicToggle activates
     the equalizer bar animation
   - aria-pressed reflects play state for accessibility
================================================================ */
const Audio = (() => {

  let isPlaying = false;

  /** Start playing — called immediately on user entry */
  function play() {
    if (!DOM.audio) return;
    const promise = DOM.audio.play();
    if (promise !== undefined) {
      promise
        .then(() => {
          isPlaying = true;
          updateUI();
        })
        .catch((err) => {
          // Browser still blocked? Silently handle.
          console.warn('Audio play blocked:', err);
          isPlaying = false;
          updateUI();
        });
    }
  }

  /** Pause audio */
  function pause() {
    if (!DOM.audio) return;
    DOM.audio.pause();
    isPlaying = false;
    updateUI();
  }

  /** Toggle between play / pause */
  function toggle() {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }

  /** Update toggle button appearance */
  function updateUI() {
    if (!DOM.musicToggle) return;

    if (isPlaying) {
      DOM.musicToggle.classList.add('playing');
      DOM.musicToggle.setAttribute('aria-pressed', 'true');
      DOM.musicToggle.setAttribute('aria-label', 'Pause wedding music');
    } else {
      DOM.musicToggle.classList.remove('playing');
      DOM.musicToggle.setAttribute('aria-pressed', 'false');
      DOM.musicToggle.setAttribute('aria-label', 'Play wedding music');
    }
  }

  /** Bind toggle button click */
  function init() {
    if (!DOM.musicToggle) return;

    DOM.musicToggle.addEventListener('click', toggle);

    // Sync UI if audio ends unexpectedly
    if (DOM.audio) {
      DOM.audio.addEventListener('ended', () => {
        // Audio has loop=true so this shouldn't fire, but just in case
        isPlaying = false;
        updateUI();
      });
    }
  }

  // Expose play() so Loader can call it
  return { init, play, pause, toggle };
})();


/* ================================================================
   4. COUNTDOWN TIMER
   Counts down to the Holy Matrimony: November 14, 2026, 12:30 PM IST
   IST = UTC+5:30, so target in UTC is 07:00

   - Updates every second via setInterval
   - Applies a brief "flip" animation when the digit changes
   - Clears interval once date is reached
================================================================ */
const Countdown = (() => {

  // TARGET: November 14, 2026 12:30 PM IST (UTC+5:30 = 07:00 UTC)
  const TARGET = new Date('2026-11-14T07:00:00Z').getTime();

  // Store previous displayed values to detect changes
  const prev = { days: -1, hours: -1, mins: -1, secs: -1 };

  let intervalId = null;

  /** Pad number to 2 digits: 5 → "05" */
  function pad(n) {
    return String(n).padStart(2, '0');
  }

  /** Briefly flip a digit element for animation effect */
  function flipDigit(el) {
    el.classList.add('flip');
    setTimeout(() => el.classList.remove('flip'), 350);
  }

  /** Update DOM with current time delta */
  function update() {
    const now   = Date.now();
    const delta = TARGET - now;

    // Wedding has happened — show celebration message
    if (delta <= 0) {
      DOM.cdDays.textContent  = '00';
      DOM.cdHours.textContent = '00';
      DOM.cdMins.textContent  = '00';
      DOM.cdSecs.textContent  = '00';
      clearInterval(intervalId);
      return;
    }

    // Time math
    const days  = Math.floor(delta / (1000 * 60 * 60 * 24));
    const hours = Math.floor((delta % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins  = Math.floor((delta % (1000 * 60 * 60)) / (1000 * 60));
    const secs  = Math.floor((delta % (1000 * 60)) / 1000);

    // Update only if value changed (avoid unnecessary reflows)
    if (days !== prev.days) {
      flipDigit(DOM.cdDays);
      DOM.cdDays.textContent = pad(days);
      prev.days = days;
    }
    if (hours !== prev.hours) {
      flipDigit(DOM.cdHours);
      DOM.cdHours.textContent = pad(hours);
      prev.hours = hours;
    }
    if (mins !== prev.mins) {
      flipDigit(DOM.cdMins);
      DOM.cdMins.textContent = pad(mins);
      prev.mins = mins;
    }
    if (secs !== prev.secs) {
      flipDigit(DOM.cdSecs);
      DOM.cdSecs.textContent = pad(secs);
      prev.secs = secs;
    }
  }

  function init() {
    // Initial render immediately, then update every second
    update();
    intervalId = setInterval(update, 1000);
  }

  return { init };
})();


/* ================================================================
   5. PARALLAX
================================================================ */
const Parallax = (() => {

  // CHANGE THIS: Slow down the scroll speed so it doesn't run out of image
  const SCROLL_FACTOR = 0.12; 
  
  const TILT_FACTOR = 8;
  // ... rest of the code

  let tiltSupported = false;
  let tiltX = 0, tiltY = 0;    // device orientation offsets

  /** Apply transform to hero background */
  function applyParallax(scrollOffset, tX, tY) {
    if (!DOM.heroBg) return;
    const y = scrollOffset * SCROLL_FACTOR;
    DOM.heroBg.style.transform = `translate3d(${tX}px, calc(${-y}px + ${tY}px), 0)`;
  }

  /** Scroll handler — uses passive event for performance */
  function onScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    applyParallax(scrollTop, tiltX, tiltY);
  }

  /** Device orientation handler (mobile gyroscope) */
  function onOrientation(event) {
    // gamma = left/right tilt, beta = front/back tilt
    tiltX = (event.gamma || 0) * (TILT_FACTOR / 45); // normalise to ±TILT
    tiltY = (event.beta  || 0) * (TILT_FACTOR / 45);

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    applyParallax(scrollTop, tiltX, tiltY);
  }

  function init() {
    // Bind scroll
    window.addEventListener('scroll', onScroll, { passive: true });

    // Bind gyroscope if available
    if (window.DeviceOrientationEvent) {
      // iOS 13+ requires permission
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // Permission will be requested separately (on a gesture if needed)
        // For now, just listen; if it fires without permission, great
        window.addEventListener('deviceorientation', onOrientation, { passive: true });
      } else {
        window.addEventListener('deviceorientation', onOrientation, { passive: true });
        tiltSupported = true;
      }
    }

    // Initial position
    onScroll();
  }

  return { init };
})();


/* ================================================================
   6. SCROLL REVEAL
   IntersectionObserver watches .scroll-reveal elements.
   When they enter the viewport, .revealed is added, triggering
   the CSS fade-up + blur-in transition.
================================================================ */
const ScrollReveal = (() => {

  // Observer configuration
  const OPTIONS = {
    threshold:  0.12,    // 12% visible before firing
    rootMargin: '0px 0px -40px 0px',  // slight bottom offset
  };

  function init() {
    const elements = document.querySelectorAll('.scroll-reveal');

    if (!elements.length) return;

    // Use IntersectionObserver where available
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            // Stop observing once revealed — no need to toggle back
            observer.unobserve(entry.target);
          }
        });
      }, OPTIONS);

      elements.forEach((el) => observer.observe(el));
    } else {
      // Fallback: just reveal everything immediately
      elements.forEach((el) => el.classList.add('revealed'));
    }
  }

  return { init };
})();


/* ================================================================
   7. FAB BAR — Additional UX
   The FAB bar is controlled by the Loader module (shown on entry).
   This module handles subtle extras:
   - Auto-hide on aggressive upward scroll (optional UX choice)
   - Currently: just initialization guard
================================================================ */
const FABBar = (() => {

  let lastScroll = 0;
  let hidden = false;

  function init() {
    // Note: FAB visibility is toggled by Loader.revealSite()
    // Here we add scroll-hide-on-fast-scroll behavior
    window.addEventListener('scroll', () => {
      if (DOM.fabBar.hidden) return;  // not shown yet

      const current = window.scrollY;
      const isScrollingDown = current > lastScroll && current > 100;

      // On aggressive downward scroll, slightly shrink fab
      if (isScrollingDown && !hidden) {
        // subtle: just dim it slightly — don't hide on mobile (needed)
        DOM.fabBar.style.opacity = '0.7';
        hidden = true;
      } else if (!isScrollingDown && hidden) {
        DOM.fabBar.style.opacity = '1';
        hidden = false;
      }

      lastScroll = current;
    }, { passive: true });
  }

  return { init };
})();


/* ================================================================
   8. HAPTIC FEEDBACK
   Applies scale(0.95) press on any element with .haptic-btn.
   This simulates the physical "click-down" feel.
   CSS handles the transform; this module adds optional
   Vibration API feedback on supported mobile browsers.
================================================================ */
const Haptic = (() => {

  function vibrateIfSupported() {
    if ('vibrate' in navigator) {
      navigator.vibrate(8);  // 8ms — very subtle, barely perceptible
    }
  }

  function init() {
    // Event delegation — attach to document once, handle all .haptic-btn
    document.addEventListener('pointerdown', (e) => {
      const btn = e.target.closest('.haptic-btn');
      if (btn) vibrateIfSupported();
    });
  }

  return { init };
})();


/* ================================================================
   9. SMOOTH ANCHOR SCROLL
   In case any internal links are added in future, ensure
   smooth scrolling to sections even in browsers that don't
   support CSS scroll-behavior.
================================================================ */
const SmoothScroll = (() => {

  function init() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const targetId = link.getAttribute('href').slice(1);
      const target   = document.getElementById(targetId);

      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  return { init };
})();


/* ================================================================
   10. INIT — Boot sequence
   All modules are initialized here, in the correct order.
   The DOMContentLoaded guard ensures HTML is fully parsed.
================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  // 1. Set up entry gate — must come first
  Loader.init();

  // 2. Audio engine — bind toggle button
  Audio.init();

  // 3. Countdown — start ticking immediately (visible in loader area
  //    but primarily for the main site section)
  Countdown.init();

  // 4. Parallax — hero background depth effect
  Parallax.init();

  // 5. Scroll reveal — observe .scroll-reveal elements
  ScrollReveal.init();

  // 6. FAB bar subtle scroll behaviour
  FABBar.init();

  // 7. Haptic feedback on buttons
  Haptic.init();

  // 8. Smooth scroll for any internal anchors
  SmoothScroll.init();

  // -- Performance: preload hero image --
  // Ensures hero.jpeg is ready when the loader exits
  const img = new Image();
  img.src = 'hero.jpeg';

  // Log init complete (useful for Vibe Coding / debugging)
  console.log(
    '%c💍 Suryanshu & Aishwarya — Wedding Microsite',
    'font-size:14px; color:#B76E79; font-family:serif;'
  );
  console.log('%c   Initialized. Best wishes to the couple! 🌹', 'color:#F7E7CE;');

});
