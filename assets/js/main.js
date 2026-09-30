/* Site behaviour: mobile menu, nav scrollspy, stage tabs, engagement record, copy email. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  /* ---------- Mobile menu (dialog with focus trap) ---------- */
  var menuBtn = $('#menu-open'), menu = $('#menu'), lastFocus = null;
  function focusables() { return $$('a[href], button:not([disabled])', menu); }
  function openMenu() {
    lastFocus = document.activeElement;
    menu.hidden = false; menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var f = focusables(); if (f.length) f[0].focus();
  }
  function closeMenu() {
    menu.hidden = true; menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', openMenu);
    $('#menu-close').addEventListener('click', closeMenu);
    $$('a', menu).forEach(function (a) { a.addEventListener('click', closeMenu); });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
      if (e.key !== 'Tab') return;
      var f = focusables(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Scrollspy: underline the current section in the nav ---------- */
  var navLinks = $$('.nav__links a[href^="#"]');
  if ('IntersectionObserver' in window && navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) { var id = a.getAttribute('href').slice(1); var s = document.getElementById(id); if (s) map[id] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
        var a = map[en.target.id]; if (a) { a.classList.add('is-active'); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) { spy.observe(document.getElementById(id)); });
  }

  /* ---------- Stage model (user-controlled tabs) ---------- */
  var STAGES = {
    ingest: {
      means: 'Collect the work from wherever it already shows up: repair requests, emails, documents, a client’s brief.',
      how: 'I plan for the messy real thing from day one, like different file types and more than one language, not a tidy example.',
      done: [
        ['#case-mining', 'Work-order triage', 'Maintenance notices from SAP, in English and Spanish'],
        ['#case-media', 'Agentic media planning', 'A client brief plus about nine data sources'],
        ['#sys-ixp', 'IXP Document Wrapper', 'Accepts 15+ file types, including Office, images, ZIP and email']
      ]
    },
    extract: {
      means: 'Pull the important facts out of documents (names, amounts, dates) so the rest of the system can use them.',
      how: 'I make this step visible, so you can see and check how well the AI is reading, instead of just hoping.',
      done: [
        ['#sys-visionai', 'VisionAI', 'Streams each extraction step live and compares results across models'],
        ['#sys-ixp', 'IXP Document Wrapper', 'Any document in, structured JSON out'],
        ['#about', 'Applied Scientist years', 'Document-vision models for signatures, seals, tables and handwriting']
      ]
    },
    reason: {
      means: 'AI makes the judgement calls: is this clear, is it a repeat, what should happen next, what should the first draft say.',
      how: 'AI handles the judgement. Plain automation handles everything that should happen exactly the same way every time.',
      done: [
        ['#case-mining', 'Work-order triage', 'LLM quality scoring and semantic duplicate detection'],
        ['#case-media', 'Agentic media planning', 'An agent drafts the budget plan and revises it from feedback'],
        ['#sys-cortex', 'Automation Cortex', 'A consultant agent that argues with design decisions'],
        ['#sys-flowlens', 'FlowLens', 'A coded agent picks the right automation for what is on screen']
      ]
    },
    review: {
      means: 'A person approves or corrects the result wherever a wrong answer would be costly.',
      how: 'I put the person where the AI is least sure, and the system remembers their decisions so it needs to ask less over time.',
      done: [
        ['#case-mining', 'Work-order triage', 'Supervisor approval, with a reviewer dashboard'],
        ['#case-media', 'Agentic media planning', 'The planner corrects the plan in plain language'],
        ['#sys-memory', 'Agent Memory', 'An approved escalation is answered from memory next time'],
        ['#sys-maestro', 'Maestro case management', 'A human review stage inside an end-to-end case flow']
      ]
    },
    ship: {
      means: 'Make it run in the customer’s own software, giving the right answers, not just without errors.',
      how: 'I test from start to finish, and treat “it runs” and “it gives the right answer” as two different finish lines.',
      done: [
        ['#case-shipping', 'Invoicing migration recovery', '20 defects fixed and grouped into 9 classes'],
        ['#case-mining', 'Work-order triage', 'Seven releases; three of five phases in UAT'],
        ['#sys-maestro', 'Maestro case management', 'Documented from entity definition to deployment']
      ]
    }
  };
  var tabs = $$('.tab'), panel = $('#stage-panel');
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function selectStage(btn, focus) {
    var key = btn.getAttribute('data-stage'), d = STAGES[key];
    tabs.forEach(function (t) { var on = t === btn; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
    panel.setAttribute('aria-labelledby', btn.id);
    panel.setAttribute('data-stage', key);
    panel.innerHTML =
      '<div><h3>What it means</h3><p class="big">' + esc(d.means) + '</p></div>' +
      '<div><h3>How I work here</h3><p>' + esc(d.how) + '</p></div>' +
      '<div><h3>Where I have done it</h3><ul class="done-list">' + d.done.map(function (x) {
        return '<li><a href="' + x[0] + '"><b>' + esc(x[1]) + '</b><span>' + esc(x[2]) + '</span><i aria-hidden="true">↓</i></a></li>';
      }).join('') + '</ul></div>';
    if (focus) btn.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectStage(t); });
    t.addEventListener('keydown', function (e) {
      var k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (e.key === 'Home') k = -i; if (e.key === 'End') k = tabs.length - 1 - i;
      if (k == null) return;
      e.preventDefault(); selectStage(tabs[(i + k + tabs.length) % tabs.length], true);
    });
  });

  /* Clicking a "where I have done it" link briefly outlines the target */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.done-list a, .principle .seen a');
    if (!a) return;
    var target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    setTimeout(function () { target.classList.remove('flash'); void target.offsetWidth; target.classList.add('flash'); }, reduce ? 0 : 450);
  });

  /* ---------- Engagement record: one pass, pause at Verify, then settle ---------- */
  var record = $('#record');
  if (record) {
    var items = $$('li', record), pulse = $('.record__pulse', record);
    var finish = function () { items.forEach(function (li) { li.classList.add('is-lit'); }); };
    if (reduce || !pulse || !('requestAnimationFrame' in window)) finish();
    else {
      var list = $('ol', record);
      var ys = items.map(function (li) { var d = $('.dot', li); return d.offsetTop + li.offsetTop + d.offsetHeight / 2; });
      var start = null, DUR = 2400, PAUSE = 450, pausedAt = -1, pauseUntil = 0, verifyIdx = items.findIndex(function (li) { return li.classList.contains('verify'); });
      var span = ys[ys.length - 1] - ys[0], elapsed = 0, lastTs = null;
      pulse.style.left = (list.offsetLeft + 7.5 - 4.5) + 'px';
      pulse.style.opacity = '1';
      var frame = function (ts) {
        if (lastTs == null) lastTs = ts;
        var dt = ts - lastTs; lastTs = ts;
        if (ts < pauseUntil) { requestAnimationFrame(frame); return; }
        elapsed = Math.min(DUR, elapsed + dt);
        var y = ys[0] + span * (elapsed / DUR);
        pulse.style.transform = 'translateY(' + (list.offsetTop + y - 4.5) + 'px)';
        items.forEach(function (li, i) {
          if (y >= ys[i] - 1 && !li.classList.contains('is-lit')) {
            li.classList.add('is-lit');
            if (i === verifyIdx && pausedAt < 0) { pausedAt = i; pauseUntil = ts + PAUSE; }
          }
        });
        if (elapsed < DUR) requestAnimationFrame(frame);
        else { finish(); pulse.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' }); }
      };
      setTimeout(function () { requestAnimationFrame(frame); }, 500);
    }
  }

  /* ---------- Copy email ---------- */
  $$('[data-copy]').forEach(function (btn) {
    var label = btn.textContent;
    btn.addEventListener('click', function () {
      var val = btn.getAttribute('data-copy');
      var done = function (msg) { btn.textContent = msg; setTimeout(function () { btn.textContent = label; }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(val).then(function () { done('Copied'); }, function () { done(val); });
      else done(val);
    });
  });

  /* ---------- Diagrams ---------- */
  if (window.FieldDiagrams) window.FieldDiagrams.init();

  /* ---------- Theme: Aurora (dark, default) or Spectrum (light), remembered ---------- */
  var themeBtns = $$('[data-theme-toggle]'), docEl = document.documentElement;
  var syncTheme = function () {
    var light = docEl.getAttribute('data-theme') === 'light';
    themeBtns.forEach(function (b) {
      b.setAttribute('aria-pressed', String(light));
      if (b.classList.contains('theme-btn')) b.setAttribute('aria-label', light ? 'Switch to dark theme' : 'Switch to light theme');
      else b.textContent = light ? 'Dark theme' : 'Light theme';
    });
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', light ? '#f4f1ea' : '#0a0d12');
  };
  themeBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var light = docEl.getAttribute('data-theme') !== 'light';
      if (light) docEl.setAttribute('data-theme', 'light'); else docEl.removeAttribute('data-theme');
      try { localStorage.setItem('theme', light ? 'light' : 'dark'); } catch (e) {}
      syncTheme();
    });
  });
  syncTheme();
})();
