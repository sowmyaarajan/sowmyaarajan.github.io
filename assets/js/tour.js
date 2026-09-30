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
    ['about', 'And this is how I got here. Watch me hop through the years!'],
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
  /* ---------- Sowmya's own voice: assets/audio/tour-N.webm (or .m4a), used whenever a clip exists ---------- */
  var clips = [], clipsChecked = false, audio = null;
  function checkClips() {
    if (clipsChecked) return Promise.resolve();
    clipsChecked = true;
    return Promise.all(STOPS.map(function (_, k) {
      var try1 = function (ext) { return fetch('assets/audio/tour-' + (k + 1) + '.' + ext, { method: 'HEAD' }).then(function (r) { return r.ok ? 'assets/audio/tour-' + (k + 1) + '.' + ext : null; }).catch(function () { return null; }); };
      return try1('webm').then(function (u) { return u || try1('m4a'); }).then(function (u) { clips[k] = u; if (u) return measure(k, u); });
    }));
  }
  // Find where the speech starts and ends in each clip, so the tour skips quiet lead-ins and moves on right after the last word
  var spans = [];
  function measure(k, url) {
    var AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!AC) return;
    return fetch(url).then(function (r) { return r.arrayBuffer(); }).then(function (buf) {
      return new AC(1, 44100, 44100).decodeAudioData(buf);
    }).then(function (a) {
      var d = a.getChannelData(0), n = d.length, th = 0.02, s0 = 0, s1 = n - 1;
      while (s0 < n && Math.abs(d[s0]) < th) s0++;
      while (s1 > 0 && Math.abs(d[s1]) < th) s1--;
      spans[k] = { start: Math.max(0, s0 / a.sampleRate - 0.15), end: Math.min(a.duration, s1 / a.sampleRate + 0.35) };
    }).catch(function () {});
  }
  function stopAudio() { if (audio) { audio.onended = audio.onerror = audio.ontimeupdate = null; audio.pause(); audio = null; } }
  // Say one line; call done when it has been spoken (with a safety net if the engine never reports the end)
  function speak(text, done) {
    var my = ++token;
    stopAudio();
    if (!soundOn) return false;
    if (clips[i]) {
      var a = audio = new Audio(clips[i]), fell = false;
      var fallback = function () { if (fell || my !== token) return; fell = true; audio = null; speakSynth(text, done, my); };
      var span = spans[i], ended = false, finishClip = function () { if (ended || my !== token) return; ended = true; a.pause(); done(); };
      a.onended = finishClip;
      if (span) {
        a.addEventListener('loadedmetadata', function () { try { a.currentTime = span.start; } catch (e) {} }, { once: true });
        a.ontimeupdate = function () { if (a.currentTime >= span.end) finishClip(); };
      }
      a.onerror = fallback;
      var pr = a.play(); if (pr && pr.catch) pr.catch(fallback);
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

  function light(id) {
    if (lit) lit.classList.remove('is-toured');
    lit = document.getElementById(id);
    if (!lit) return;
    lit.classList.add('is-toured');
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
    light(STOPS[i][0]);
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
    checkClips().then(function () { go(0); });
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
    if (paused) { paused = false; pauseBtn.textContent = 'Pause'; if (hopWaiting && !hopPending) { hopWaiting = false; timer = setTimeout(advance, HOP_HOLD); } if (soundOn && audio) { audio.play(); } else if (synth && soundOn) { if (synth.paused) synth.resume(); if (!synth.speaking) timer = setTimeout(advance, 900); } schedule(left); }
    else {
      paused = true; pauseBtn.textContent = 'Play';
      left = Math.max(0, left - (Date.now() - startedAt));
      clearTimeout(timer); cancelAnimationFrame(raf);
      if (audio) audio.pause(); else if (synth && synth.speaking) synth.pause();
    }
  }
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
