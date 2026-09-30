/* Career line: a small figure hops from year to year when the section comes into view,
   lighting each node as she lands. Click a year and she jumps there. */
(function () {
  'use strict';
  var hop = document.getElementById('hop');
  if (!hop) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var girl = hop.querySelector('.hop__girl'), body = hop.querySelector('.hop__body'), list = hop.querySelector('.career');
  var items = Array.prototype.slice.call(hop.querySelectorAll('.career li'));
  var at = 0, busy = false, queue = [], started = false, curFly = null;
  var sayEl = document.getElementById('hop-say');
  var SAY = [
    'I taught a voice assistant to understand people.',
    'Research time: the Turing Institute, SAP Labs and UC Santa Barbara.',
    'At UiPath, AI that reads documents and emails for big companies.',
    'Today I build AI agents that do real work.'
  ];
  function say(i) {
    if (!sayEl) return;
    var p = spot(i);
    sayEl.textContent = SAY[i];
    sayEl.style.setProperty('--x', (p.x + 27) + 'px');
    sayEl.style.setProperty('--y', p.y + 'px');
    sayEl.classList.remove('is-on'); void sayEl.offsetWidth; sayEl.classList.add('is-on');
  }
  function hush() { if (sayEl) sayEl.classList.remove('is-on'); }

  // Where her feet go: on top of the node's dot (the li::before, 15px, at the li's top-left)
  function spot(i) {
    var h = hop.getBoundingClientRect(), r = items[i].getBoundingClientRect();
    return { x: r.left - h.left + 7.5 - 27, y: r.top - h.top - 72 + 5 };
  }
  function colour(i) { return getComputedStyle(items[i]).getPropertyValue('--c'); }
  function mark(i, visitedUpTo) {
    items.forEach(function (li, k) {
      li.classList.toggle('is-here', k === i);
      li.classList.toggle('is-visited', k <= visitedUpTo);
    });
    girl.style.setProperty('--hop-c', colour(i));
    var a = items[0].getBoundingClientRect(), b = items[i].getBoundingClientRect();
    var vertical = Math.abs(b.left - a.left) < 4 && i > 0;
    list.style.setProperty('--p', Math.max(0, vertical ? b.top - a.top : b.left - a.left) + 'px');
  }
  function stand(i) {
    var p = spot(i);
    girl.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
  }
  var visited = 0;

  // One hop along a parabola, with a crouch before take-off and a squash on landing
  function jump(to) {
    return new Promise(function (resolve) {
      body.animate([{ transform: 'scale(1,1)' }, { transform: 'scale(1.08,.86)' }, { transform: 'scale(1,1)' }], { duration: 160, easing: 'ease-out' }).finished.then(function () {
        // measure at take-off, so a resize during the crouch still lands in the right place
        var a = spot(at), b = spot(to), dist = Math.hypot(b.x - a.x, b.y - a.y);
        var lift = Math.min(90, 34 + dist * 0.18), frames = [], N = 16;
        for (var k = 0; k <= N; k++) {
          var t = k / N, x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t - lift * 4 * t * (1 - t);
          frames.push({ transform: 'translate(' + x + 'px,' + y + 'px)' });
        }
        var dur = Math.min(900, 480 + dist * 0.9);
        girl.classList.add('is-air'); hush();
        var fly = girl.animate(frames, { duration: dur, easing: 'cubic-bezier(.35,.1,.45,1)', fill: 'forwards' });
        curFly = fly;
        fly.finished.then(function () {
          girl.classList.remove('is-air'); curFly = null;
          at = to; fly.cancel(); stand(to);
          visited = Math.max(visited, to); mark(to, visited); say(to);
          body.animate([{ transform: 'scale(1.12,.84)' }, { transform: 'scale(.96,1.05)' }, { transform: 'scale(1,1)' }], { duration: 260, easing: 'ease-out' }).finished.then(resolve);
        });
      });
    });
  }
  function run() {
    if (busy || !queue.length) return;
    busy = true;
    var to = queue.shift();
    jump(to).then(function () { setTimeout(function () { busy = false; if (!queue.length) settle(); run(); }, 380); });
  }
  function goTo(i) {
    if (reduce) { at = i; visited = Math.max(visited, i); stand(i); mark(i, visited); say(i); return; }
    queue = [];
    if (i === at && !busy) return;
    queue.push(i); run();
  }

  hop.classList.add('is-ready');
  if (reduce) { at = items.length - 1; visited = at; stand(at); mark(at, at); say(at); }
  else { stand(0); mark(0, 0); }

  items.forEach(function (li, i) {
    li.querySelector('.yr').addEventListener('click', function () { started = true; goTo(i); });
  });

  // First time the line comes into view: 2017 → 2020 → 2021 → 2025
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting || started) return;
      started = true; io.disconnect();
      say(0);
      setTimeout(function () { hush(); for (var k = 1; k < items.length; k++) queue.push(k); run(); }, 1600);
    }, { threshold: 0.6 });
    io.observe(hop);
  }
  // Keep her on her node whenever the line changes size (window resize, phone rotation, fonts loading).
  // Mid-hop, the landing re-measures, so only settle when she is standing still.
  var settle = function () {
    requestAnimationFrame(function () {
      if (busy) { if (curFly) curFly.finish(); return; } // mid-hop: land now, the landing re-measures
      stand(at); mark(at, visited);
      if (sayEl && sayEl.classList.contains('is-on')) say(at);
    });
  };
  if ('ResizeObserver' in window) new ResizeObserver(settle).observe(hop);
  window.addEventListener('resize', settle);
  window.addEventListener('orientationchange', settle);
  // Used by the guided tour: start again from 2017 and hop through every year
  window.HopLine = { replay: function () {
    started = true; queue = [];
    if (reduce) { goTo(items.length - 1); return; }
    var go = function () { at = 0; visited = 0; stand(0); mark(0, 0); say(0); for (var k = 1; k < items.length; k++) queue.push(k); setTimeout(function () { hush(); run(); }, 1400); };
    if (busy) setTimeout(go, 1500); else go();
  } };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!busy) { stand(at); mark(at, visited); } });
})();
