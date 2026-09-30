/* The 60-second tour: eight stops, told in first person, each lighting up one section.
   Auto-advances about every 7.5 seconds; back, pause, next and end are always available. */
(function () {
  'use strict';
  var tour = document.getElementById('tour');
  if (!tour) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STOPS = [
    ['top', 'Hi, I’m Sowmya! I help big companies get AI to actually work. Let me show you around.'],
    ['do', 'My job in three steps: I listen to the problem, build the AI, and make it work for real.'],
    ['case-shipping', 'Project one: an invoice robot was quietly getting sums wrong. I found one mistake hiding in 231 places.'],
    ['case-mining', 'Project two: AI sorts a mining company’s repair requests, and a supervisor still has the final say.'],
    ['case-media', 'Project three: an ad planner tells an AI what to change, in plain words, and it redoes the plan.'],
    ['tools', 'I also build tools. Tap any of these cards to play with a small demo.'],
    ['about', 'And this is how I got here. Watch me hop through the years!', 'hop'],
    ['contact', 'That’s the tour. If you’d like to talk, my email is right here.']
  ];
  var DWELL = 7500;
  var textEl = document.getElementById('tour-t'), nEl = document.getElementById('tour-n'), ofEl = document.getElementById('tour-of');
  var bar = document.getElementById('tour-bar'), pauseBtn = document.getElementById('tour-pause');
  var i = 0, timer = 0, paused = false, lit = null, startedAt = 0, left = DWELL, raf = 0, dwell = DWELL;

  /* ---------- voice: the browser's own speech engine, no server involved ---------- */
  var synth = window.speechSynthesis || null, voice = null, soundOn = !!synth, soundBtn = document.getElementById('tour-sound'), token = 0;
  function pickVoice() {
    if (!synth) return;
    var vs = synth.getVoices(); if (!vs.length) return;
    var female = /female|zira|heera|neerja|hazel|susan|samantha|karen|moira|tessa|veena|aria|jenny|libby|sonia|natasha/i;
    var score = function (v) {
      var s = 0;
      if (/^en[-_]IN/i.test(v.lang)) s += 6; else if (/^en[-_](GB|AU|IE)/i.test(v.lang)) s += 3; else if (/^en/i.test(v.lang)) s += 2; else return -1;
      if (female.test(v.name)) s += 4;
      if (v.localService) s += 1;
      return s;
    };
    voice = vs.filter(function (v) { return score(v) >= 0; }).sort(function (a, b) { return score(b) - score(a); })[0] || null;
  }
  if (synth) { pickVoice(); if ('onvoiceschanged' in synth) synth.onvoiceschanged = pickVoice; }
  // the sound button stays: recorded clips work even where the browser has no speech voice
  function syncSound() {
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    soundBtn.lastChild.textContent = soundOn ? 'Sound on' : 'Sound off';
    soundBtn.classList.toggle('is-off', !soundOn);
  }
  /* ---------- Sowmya's own voice: assets/audio/tour-N.m4a (or .webm) ----------
     One audio element for the whole tour. Phones only allow sound that starts from a tap,
     so the first clip starts inside the tap on "Take the tour", and every later clip reuses
     that same, already-allowed element. */
  var player = new Audio(), audio = null, watch = 0;
  player.preload = 'auto';
  var ext = player.canPlayType('audio/mp4; codecs="mp4a.40.2"') ? 'm4a' : (player.canPlayType('audio/webm; codecs="opus"') ? 'webm' : '');
  var clips = STOPS.map(function (_, k) { return ext ? 'assets/audio/tour-' + (k + 1) + '.' + ext : null; });
  function stopAudio() {
    clearTimeout(watch);
    player.onended = player.onerror = player.onplaying = null;
    if (audio) player.pause();
    audio = null;
  }
  // Say one line; call done when it has been spoken (with a safety net if nothing reports the end)
  function speak(text, done) {
    var my = ++token;
    stopAudio();
    if (!soundOn) return false;
    if (clips[i]) {
      var over = false;
      var finish = function () { if (over || my !== token) return; over = true; clearTimeout(watch); audio = null; done(); };
      var fallback = function () { if (over || my !== token) return; over = true; clearTimeout(watch); player.pause(); audio = null; if (!speakSynth(text, done, my)) done(); };
      audio = player;
      player.onended = finish;
      player.onerror = fallback;
      // If the clip has not started within 4 s (blocked or stuck), use the browser voice instead
      watch = setTimeout(fallback, 4000);
      player.onplaying = function () { clearTimeout(watch); watch = setTimeout(finish, 16000); };
      player.src = clips[i];
      var pr = player.play(); if (pr && pr.catch) pr.catch(fallback);
      return true;
    }
    return speakSynth(text, done, my);
  }
  function speakSynth(text, done, my) {
    if (!synth) return false;
    synth.cancel();
    var u = new SpeechSynthesisUtterance(text);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-IN';
    u.rate = 1; u.pitch = 1.05;
    var finished = false, finish = function () { if (finished || my !== token) return; finished = true; done(); };
    u.onend = finish; u.onerror = finish;
    setTimeout(finish, 2500 + text.length * 95);
    synth.speak(u);
    return true;
  }
  ofEl.textContent = STOPS.length;

  function light(id, focusId) {
    if (lit) lit.classList.remove('is-toured');
    lit = document.getElementById(id);
    if (!lit) return;
    lit.classList.add('is-toured');
    // On phones, aim at the part that matters (e.g. the career line), leaving room for her speech bubble
    var f = focusId && window.innerWidth <= 820 ? document.getElementById(focusId) : null;
    if (f) { window.scrollTo({ top: Math.max(0, window.scrollY + f.getBoundingClientRect().top - 76 - 110), behavior: reduce ? 'auto' : 'smooth' }); return; }
    var r = lit.getBoundingClientRect(), nav = 76;
    var target = window.scrollY + r.top - nav - Math.max(0, (window.innerHeight - nav - Math.min(r.height, window.innerHeight * .7)) * .15);
    window.scrollTo({ top: Math.max(0, target), behavior: reduce ? 'auto' : 'smooth' });
  }
  // At the career stop, wait for the girl to reach the last year before moving on
  var hopPending = false, hopWaiting = false, hopTok = 0, HOP_REST = 2000, HOP_HOLD = 2500;
  function advance() {
    if (hopPending) { hopWaiting = true; return; }
    if (i < STOPS.length - 1) go(i + 1); else end();
  }
  function tick() {
    var used = dwell - left + (Date.now() - startedAt);
    bar.style.width = Math.min(100, used / dwell * 100) + '%';
    raf = requestAnimationFrame(tick);
  }
  function schedule(ms) {
    clearTimeout(timer); cancelAnimationFrame(raf);
    left = ms; startedAt = Date.now();
    if (paused) return;
    if (!soundOn || (!synth && !clips[i])) timer = setTimeout(advance, ms);
    raf = requestAnimationFrame(tick);
  }
  function go(k) {
    i = Math.max(0, Math.min(STOPS.length - 1, k));
    nEl.textContent = i + 1; textEl.textContent = STOPS[i][1];
    tour.classList.remove('is-new'); void tour.offsetWidth; tour.classList.add('is-new');
    light(STOPS[i][0], STOPS[i][2]);
    var myHop = ++hopTok; hopPending = hopWaiting = false;
    if (STOPS[i][0] === 'about' && window.HopLine) {
      hopPending = true;
      setTimeout(function () {
        if (myHop !== hopTok) return;
        window.HopLine.replay(function () {
          if (myHop !== hopTok) return;
          hopPending = false;
          if (hopWaiting && !paused) { hopWaiting = false; clearTimeout(timer); timer = setTimeout(advance, HOP_HOLD); }
        }, { rest: HOP_REST });
      }, reduce ? 0 : 700);
    }
    bar.style.width = '0%';
    // With sound, move on when the sentence has been spoken; without it, after a fixed pause
    dwell = soundOn && (synth || clips[i]) ? Math.max(4200, STOPS[i][1].split(' ').length * 390 + 900) : DWELL;
    if (hopPending && !reduce) dwell = 2100 + 4 * (1300 + HOP_REST) + HOP_HOLD; // roughly how long her hops take
    schedule(dwell);
    var line = STOPS[i][1];
    speak(line, function () { if (!paused) timer = setTimeout(advance, clips[i] ? 600 : 900); });
  }
  function start() {
    paused = false; pauseBtn.textContent = 'Pause';
    tour.hidden = false; document.documentElement.classList.add('is-touring');
    if (synth && soundOn && !clips[0]) synth.speak(new SpeechSynthesisUtterance('')); // wakes speech on phones
    go(0);
    tour.querySelector('[data-tour="next"]').focus({ preventScroll: true });
  }
  function end() {
    hopTok++; hopPending = hopWaiting = false;
    clearTimeout(timer); cancelAnimationFrame(raf); token++; stopAudio(); if (synth) synth.cancel();
    tour.hidden = true; document.documentElement.classList.remove('is-touring');
    if (lit) lit.classList.remove('is-toured');
    lit = null;
  }
  function togglePause() {
    if (paused) { paused = false; pauseBtn.textContent = 'Pause'; if (hopWaiting && !hopPending) { hopWaiting = false; timer = setTimeout(advance, HOP_HOLD); } if (soundOn && audio) { player.play(); } else if (synth && soundOn) { if (synth.paused) synth.resume(); if (!synth.speaking) timer = setTimeout(advance, 900); } schedule(left); }
    else {
      paused = true; pauseBtn.textContent = 'Play';
      left = Math.max(0, left - (Date.now() - startedAt));
      clearTimeout(timer); cancelAnimationFrame(raf);
      clearTimeout(watch); // the clip's safety net restarts when it plays again
      if (audio) player.pause(); else if (synth && synth.speaking) synth.pause();
    }
  }
  // On phones the career line is taller than the space above this panel, so follow her down it
  var hopEl = document.getElementById('hop');
  if (hopEl) hopEl.addEventListener('hop:jump', function (e) {
    if (tour.hidden || STOPS[i][0] !== 'about' || window.innerWidth > 820) return;
    var li = hopEl.querySelectorAll('.career li')[e.detail]; if (!li) return;
    var top = li.getBoundingClientRect().top, room = window.innerHeight - tour.offsetHeight - 40;
    if (top > room - 120 || top < 76 + 110) window.scrollTo({ top: Math.max(0, window.scrollY + top - 76 - 130), behavior: reduce ? 'auto' : 'smooth' });
  });
  document.querySelectorAll('[data-tour-start]').forEach(function (b) { b.addEventListener('click', start); });
  tour.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tour]'); if (!b) return;
    var a = b.getAttribute('data-tour');
    if (a === 'next') { if (i < STOPS.length - 1) go(i + 1); else end(); }
    if (a === 'prev') go(i - 1);
    if (a === 'pause') togglePause();
    if (a === 'end') end();
    if (a === 'sound') {
      soundOn = !soundOn; syncSound();
      if (!soundOn) { token++; stopAudio(); if (synth) synth.cancel(); if (!paused) { clearTimeout(timer); timer = setTimeout(advance, 2500); } }
      else go(i);
    }
  });
  syncSound();
  document.addEventListener('keydown', function (e) {
    if (tour.hidden || document.querySelector('dialog[open]')) return;
    if (e.key === 'Escape') end();
    if (e.key === 'ArrowRight') { e.preventDefault(); if (i < STOPS.length - 1) go(i + 1); else end(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1); }
  });
})();
