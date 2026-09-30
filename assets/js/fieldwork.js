/* Fieldwork: the page signal branches into three stories.
   Branch map · A the investigation (pinned, scroll-driven) · B the request (a console with memory)
   · C human + agent (feedback, reasoning, revision). */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function stamp(node) { node.classList.remove('is-stamp'); void node.offsetWidth; node.classList.add('is-stamp'); }

  /* The page trace branches into whichever case is in view */
  if ('IntersectionObserver' in window) {
    var live = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle('is-live', e.isIntersecting); });
    }, { rootMargin: '-35% 0px -35% 0px' });
    $$('.inv, .req, .ha').forEach(function (a) { live.observe(a); });
  }

  /* ---------- Branch map ---------- */
  var grid = $('.bmap__grid');
  if (grid) (function () {
    var stories = $$('.bmap__story', grid), trunk = $('.bmap__trunk', grid);
    stories.forEach(function (a, s) {
      var on = a.getAttribute('data-on'), first = on.indexOf('1'), last = on.lastIndexOf('1');
      a.setAttribute('data-s', s);
      var line = document.createElement('span'); line.className = 'bmap__line'; line.style.setProperty('--s', s); grid.appendChild(line);
      var run = document.createElement('span'); run.className = 'bmap__run'; run.dataset.s = s;
      run.style.cssText = '--s:' + s + ';--a:' + first + ';--b:' + last; grid.appendChild(run);
      for (var l = 0; l < on.length; l++) {
        var n = document.createElement('i'); n.className = 'bmap__n' + (on[l] === '1' ? ' on' : ''); n.dataset.s = s;
        n.style.cssText = '--s:' + s + ';--l:' + l; grid.appendChild(n);
      }
      var hot = function (v) {
        if (v) grid.setAttribute('data-hot', s); else grid.removeAttribute('data-hot');
        $$('[data-s]', grid).concat(stories).forEach(function (x) { x.classList.toggle('is-hot', v && (x === a || x.getAttribute('data-s') === String(s))); });
      };
      a.addEventListener('mouseenter', function () { hot(true); });
      a.addEventListener('mouseleave', function () { hot(false); });
      a.addEventListener('focus', function () { hot(true); });
      a.addEventListener('blur', function () { hot(false); });
    });
    // The trunk is the page trace itself, curving into each story
    function draw() {
      var g = grid.getBoundingClientRect(), rowsLayout = getComputedStyle(grid).gridTemplateColumns.split(' ').length > 4;
      trunk.setAttribute('viewBox', '0 0 ' + g.width + ' ' + g.height);
      trunk.innerHTML = '';
      stories.forEach(function (a, s) {
        var b = $('b', a).getBoundingClientRect(), d, r = 12;
        if (rowsLayout) {
          var y = b.top - g.top + b.height / 2, x2 = b.left - g.left;
          d = 'M0.5 -600 V' + (y - r) + ' Q0.5 ' + y + ' ' + (r + .5) + ' ' + y + ' H' + x2;
        } else {
          var x = b.left - g.left + b.width / 2, y2 = b.top - g.top, y0 = 10;
          d = 'M0.5 -600 V' + y0 + ' Q0.5 ' + (y0 + r) + ' ' + r + ' ' + (y0 + r) + ' H' + (x - r) + ' Q' + x + ' ' + (y0 + r) + ' ' + x + ' ' + (y0 + 2 * r) + ' V' + y2;
        }
        el('path', { d: d, 'data-s': s }, trunk);
      });
    }
    draw();
    window.addEventListener('resize', draw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  })();

  /* ---------- A · The investigation ---------- */
  var inv = $('#inv-demo') || $('#case-shipping');
  if (inv) (function () {
    var scroller = $('#inv-scroll', inv), stage = $('.inv__stage', inv), host = $('#inv-svg', inv), num = $('.inv__num', inv), unit = $('.inv__unit', inv);
    var logs = $$('.inv__log li', inv), rail = $$('.inv__rail button[data-go]', inv), trail = $$('.inv__trail span', inv);
    var svg = el('svg', { viewBox: '23 16 556 364', 'class': 'invg', 'data-s': '0', 'aria-hidden': 'true', focusable: 'false' });
    var pat = el('pattern', { id: 'inv-hatch', width: 4, height: 4, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, el('defs', {}, svg));
    el('rect', { width: 4, height: 4, fill: 'var(--paper)' }, pat);
    el('line', { x1: 0, y1: 0, x2: 0, y2: 4, stroke: 'var(--ink)', 'stroke-width': 1.4 }, pat);

    // Deterministic scatter: the same picture on every visit
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var N = 337, COLS = 25, STEP = 22, SZ = 16, OX = 28, OY = 20, i, j;
    var order = []; for (i = 0; i < N; i++) order.push(i);
    for (i = N - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; }
    var okSet = {}, defSet = {};
    order.slice(0, 40).forEach(function (k) { okSet[k] = 1; });                 // ~12% verified
    order.slice(40, 60).forEach(function (k, n) { defSet[k] = n; });            // 20 defects

    // Nine class bins; defects distributed schematically (sums to 20)
    var DIST = [3, 4, 2, 3, 2, 2, 2, 1, 1], BW = 54, BG = 8.5, BX = 25, BY = 20, BH = 78, MID = 130, slots = [];
    DIST.forEach(function (c, b) { for (var s = 0; s < c; s++) slots.push({ b: b, x: BX + b * (BW + BG) + 8 + (s % 2) * 22, y: BY + 26 + Math.floor(s / 2) * 24 }); });
    var bins = el('g', { 'class': 'bins' }, svg);
    for (var b = 0; b < 9; b++) {
      var bx = BX + b * (BW + BG);
      el('rect', { x: bx, y: BY, width: BW, height: BH, rx: 5, 'class': 'bin' + (b === 0 ? ' silent' : '') }, bins);
      el('text', { x: bx + 6, y: BY + 14, 'class': 'bin-l' + (b === 0 ? ' silent' : '') }, bins).textContent = 'c' + (b + 1);
    }
    var cells = el('g', {}, svg);
    for (i = 0; i < N; i++) {
      var x = OX + (i % COLS) * STEP, y = OY + Math.floor(i / COLS) * STEP;
      var c = el('rect', { x: x, y: y, width: SZ, height: SZ, rx: 2.5, 'class': 'cell' + (okSet[i] ? ' ok' : '') }, cells);
      if (i in defSet) {
        var n = defSet[i], sl = slots[n];
        c.classList.add('def'); if (sl.b === 0) c.classList.add('in-silent');
        c.style.setProperty('--d', (0.15 + (i % COLS) / COLS * 1.5).toFixed(2) + 's'); // lit as the scan passes its column
        c._mid = 'translate(' + (sl.x - x) + 'px,' + (sl.y + MID - y) + 'px)';
        c._top = 'translate(' + (sl.x - x) + 'px,' + (sl.y - y) + 'px)';
      }
    }
    var defCells = $$('.cell.def', cells);
    el('rect', { x: 16, y: 10, width: 3, height: 322, rx: 1.5, 'class': 'scan' }, svg);
    el('path', { d: 'M52 99 V132', 'class': 'link-p' }, svg);
    el('text', { x: 60, y: 122, 'class': 'link-l' }, svg).textContent = 'search the code for family c1';
    var marks = el('g', {}, svg), MC = 21, MSX = 550 / MC;
    for (i = 0; i < 231; i++) {
      var mx = 25 + (i % MC) * MSX + (MSX - 14) / 2, my = 142 + Math.floor(i / MC) * 22;
      var m = el('rect', { x: mx.toFixed(1), y: my, width: 14, height: 14, rx: 2, 'class': 'mark' }, marks);
      m.style.setProperty('--fx', (45 - mx).toFixed(1) + 'px');
      m.style.setProperty('--fy', (52 - my) + 'px');
      m.style.setProperty('--d', (i * 0.0018).toFixed(3) + 's');
    }
    host.appendChild(svg);

    var COUNT = [[337, 'parts in the invoice robot, about 1 in 10 ever checked'], [20, 'mistakes found by running it for real, all fixed'], [9, 'families of mistake, grouped by cause'], [231, 'places one silent mistake was hiding']];
    var cur = -1, tween = 0;
    function countTo(v) {
      cancelAnimationFrame(tween);
      if (reduce) { num.textContent = v; return; }
      var from = parseInt(num.textContent, 10) || 0, t0 = null;
      tween = requestAnimationFrame(function f(ts) {
        if (t0 == null) t0 = ts;
        var p = Math.min(1, (ts - t0) / 550), e = 1 - Math.pow(1 - p, 3);
        num.textContent = Math.round(from + (v - from) * e);
        if (p < 1) tween = requestAnimationFrame(f);
      });
    }
    function setState(s) {
      if (s === cur) return;
      var forward = s > cur;
      cur = s;
      svg.setAttribute('data-s', s);
      defCells.forEach(function (c) { c.style.transform = s === 2 ? c._mid : s > 2 ? c._top : ''; });
      countTo(COUNT[s][0]); unit.textContent = COUNT[s][1];
      logs.forEach(function (li, k) {
        li.classList.toggle('is-on', k === s);
        li.classList.toggle('is-past', k < s);
        li.classList.toggle('is-prev', k === s - 1);
        li.classList.remove('is-new');
      });
      if (forward && !reduce) { void logs[s].offsetWidth; logs[s].classList.add('is-new'); }
      trail.forEach(function (t, k) { t.classList.toggle('is-on', k <= s); t.classList.toggle('is-cur', k === s); });
      rail.forEach(function (b, k) { if (k === s) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    }
    // Scrolling through the pinned stage: progress 0..1 maps to four states
    if (inv.classList.contains('inv--auto')) {
      // Inside a demo window: play itself, a few seconds per step, while the window is open
      var timer = 0, playBtn = $('.inv__play', inv);
      var stopAuto = function () { clearInterval(timer); timer = 0; if (playBtn) playBtn.textContent = 'Play ▸'; };
      var startAuto = function () {
        stopAuto(); if (reduce) return;
        timer = setInterval(function () { setState((cur + 1) % 4); }, 4600);
        if (playBtn) playBtn.textContent = 'Pause ❚❚';
      };
      var box = inv.closest('dialog');
      if (box) {
        box.addEventListener('demo:open', function () { cur = -1; setState(0); startAuto(); });
        box.addEventListener('demo:close', stopAuto);
      }
      rail.forEach(function (b, k) { b.addEventListener('click', function () { stopAuto(); setState(k); }); });
      if (playBtn) playBtn.addEventListener('click', function () { if (timer) stopAuto(); else { if (cur === 3) setState(0); startAuto(); } });
      setState(0);
      return;
    }
    function onScroll() {
      var r = scroller.getBoundingClientRect();
      var p = Math.max(0, Math.min(0.999, -r.top / Math.max(1, r.height - stage.offsetHeight)));
      setState(Math.floor(p * 4));
    }
    var ticking = false;
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; onScroll(); }); } }, { passive: true });
    rail.forEach(function (b, k) {
      b.addEventListener('click', function () {
        var r = scroller.getBoundingClientRect();
        var top = window.scrollY + r.top + (r.height - stage.offsetHeight) * ((k + 0.5) / 4) - 1;
        window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
    setState(0); onScroll();
  })();

  /* ---------- B · The request: a console with memory ---------- */
  var con = $('#con');
  if (con) (function () {
    var sys = $('.con__flow', con), sig = $('.flow__sig', con), status = $('#con-status', con);
    var nodes = $$('.flow > li', con), exit = $('.flow__exit', con), all = nodes.concat([exit]);
    var reqBtns = $$('.con__req', con), qOpen = $('#q-open', con), qRet = $('#q-ret', con);
    var nId = $('#n-id', con), nTxt = $('#n-txt', con), act = $('#n-act', con);
    var F = {}; $$('.notice__f > div', con).forEach(function (d) { F[d.getAttribute('data-f')] = d; });
    var REQS = [
      { key: 'p104', lang: 'EN', text: 'Pump P-104 leaking at the seal. Needs isolating and a new seal.' },
      { key: 'cv07', lang: 'EN', text: 'Replace worn idlers on conveyor CV-07, tail end.' },
      { key: 'cv12', lang: 'ES', text: 'El reductor de la cinta CV-12 pierde aceite. Revisar retenes.' }
    ];
    var SEED = [
      { id: 'N-10388', key: 'cv12', text: 'Fuga de aceite en el reductor de la cinta CV-12.' },
      { id: 'N-10402', key: 'cv07', text: 'Replace worn idlers on conveyor CV-07, tail end.' }
    ];
    var open, ret, nextN, nextWO, busy = false, token = 0;

    function li(item, cls) {
      var l = document.createElement('li'); if (cls) l.className = cls;
      l.innerHTML = '<span></span><em></em>';
      l.firstChild.textContent = item.wo || item.id; l.lastChild.textContent = item.text; l.title = item.text;
      item.el = l; return l;
    }
    function addRet(item) { if (!ret.length) qRet.innerHTML = ''; ret.unshift(item); qRet.insertBefore(li(item, 'is-new'), qRet.firstChild); }
    function field(k, v, cls) {
      var dd = $('dd', F[k]); dd.textContent = v;
      if (v === '—') dd.className = 'is-empty'; else { dd.className = cls || ''; stamp(F[k]); }
    }
    function resetNotice() {
      nId.textContent = '—'; nTxt.textContent = 'No request in flight.';
      Object.keys(F).forEach(function (k) { field(k, '—'); });
      act.hidden = true; act.innerHTML = '';
    }
    function clearFlow() { all.forEach(function (n) { n.classList.remove('is-at', 'is-passed', 'is-wait'); }); }
    function centre(k) { var i = $('i', all[k]), r = i.getBoundingClientRect(), s = sys.getBoundingClientRect(); return [r.left - s.left + r.width / 2, r.top - s.top + r.height / 2]; }
    function moveSig(k, instant) {
      var p = centre(k);
      if (instant) sig.style.transition = 'none';
      sig.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px)';
      if (instant) { void sig.offsetWidth; sig.style.transition = ''; }
    }
    function setBusy(v) { busy = v; reqBtns.forEach(function (b) { b.disabled = v; }); }
    function say(t, human) { status.textContent = t; status.classList.toggle('is-human', !!human); }
    function reset() {
      token++; setBusy(false);
      open = SEED.map(function (o) { return { id: o.id, key: o.key, text: o.text }; });
      ret = []; nextN = 10421; nextWO = 20417;
      qOpen.innerHTML = ''; open.forEach(function (o) { qOpen.appendChild(li(o)); });
      qRet.innerHTML = '<li class="q__empty">none yet</li>';
      resetNotice(); clearFlow(); sig.classList.remove('is-on');
      reqBtns.forEach(function (b) { b.classList.remove('is-last'); });
      say('Pick a request to send.');
    }

    // Walk the signal to stage k; resolves once that stage has done its work
    function step(my, k, prev, text, hold) {
      if (my !== token) return Promise.reject(0);
      moveSig(k);
      return wait(prev == null ? 120 : 560).then(function () {
        if (my !== token) throw 0;
        if (prev != null) all[prev].classList.replace('is-at', 'is-passed');
        all[k].classList.add('is-at');
        say(text, k === 3);
        return wait(hold);
      });
    }
    // The human step: the visitor is the supervisor
    function decide(my, similar) {
      return new Promise(function (resolve) {
        all[3].classList.add('is-wait');
        field('sup', 'waiting for you', 'v-flag');
        act.hidden = false;
        act.innerHTML = similar
          ? '<p><b>Your call.</b> Is this the same repair as ' + similar.id + ', or a new one?</p><div><button type="button" class="btn btn--primary" data-a="approve">New repair, approve</button><button type="button" class="btn" data-a="dup">Same repair, send back</button></div>'
          : '<p><b>Your call.</b> No repair job is created without a person saying yes.</p><div><button type="button" class="btn btn--primary" data-a="approve">Approve</button></div>';
        var ar = act.getBoundingClientRect();
        if (ar.bottom > window.innerHeight || ar.top < 0) act.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
        if (con.contains(document.activeElement)) $('button', act).focus({ preventScroll: true });
        $$('button', act).forEach(function (b) {
          b.addEventListener('click', function () {
            if (my !== token) return;
            var a = b.getAttribute('data-a');
            all[3].classList.remove('is-wait');
            field('sup', a === 'approve' ? 'approved by you' : 'marked as a duplicate by you', a === 'approve' ? 'v-ok' : 'v-rej');
            act.hidden = true; act.innerHTML = '';
            if (similar && similar.el) similar.el.classList.remove('is-flag');
            resolve(a);
          });
        });
      });
    }
    function send(r) {
      if (busy) return;
      var my = ++token, q = REQS[r], id = 'N-' + (nextN++);
      setBusy(true); clearFlow(); resetNotice();
      reqBtns.forEach(function (b, i) { b.classList.toggle('is-last', i === r); });
      open.forEach(function (o) { o.el.classList.remove('is-flag', 'is-match'); });
      var exact = open.filter(function (o) { return o.key === q.key && o.text === q.text; })[0];
      var similar = !exact && open.filter(function (o) { return o.key === q.key; })[0];
      if (sys.getBoundingClientRect().top > window.innerHeight * 0.6 || sys.getBoundingClientRect().bottom < 0) con.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
      moveSig(0, true); sig.classList.add('is-on');
      nId.textContent = id; nTxt.textContent = '“' + q.text + '”';
      step(my, 0, null, 'Request ' + id + ' arrives from SAP, the company’s business software, in ' + (q.lang === 'ES' ? 'Spanish' : 'English') + '.', 700)
        .then(function () { field('lang', q.lang === 'ES' ? 'Spanish' : 'English'); return step(my, 1, 0, 'The AI reads it and grades how clear it is.', 900); })
        .then(function () { field('quality', 'graded by the AI', 'v-ok'); return step(my, 2, 1, 'The AI compares its meaning with every open request, even if the words are different.', 1000); })
        .then(function () {
          var m = exact || similar;
          if (m) m.el.classList.add(exact ? 'is-match' : 'is-flag');
          if (exact) {
            field('dup', 'same as ' + (m.wo || m.id) + ', sent back', 'v-rej');
            return step(my, 5, 2, 'It means the same as ' + (m.wo || m.id) + ', which is already open, so it is sent back automatically. No supervisor time wasted.', 300).then(function () {
              field('result', 'sent back as a repeat', 'v-rej');
              addRet({ id: id, text: q.text });
              return 'done';
            });
          }
          field('dup', similar ? 'maybe the same as ' + m.id : 'nothing similar', similar ? 'v-flag' : 'v-ok');
          return step(my, 3, 2, similar ? 'Hmm: it looks a lot like ' + m.id + '. The system stops and waits for a person to decide.' : 'Nothing similar is open. The system stops and waits for a person to approve it.', 0)
            .then(function () { return decide(my, similar); });
        })
        .then(function (res) {
          if (my !== token) return;
          if (res === 'approve') {
            var wo = 'WO-' + (nextWO++);
            return step(my, 4, 3, 'A repair job is created in SAP: ' + wo + '.', 200).then(function () {
              field('result', 'repair job ' + wo, 'v-ok');
              var item = { id: id, wo: wo, key: q.key, text: q.text }; open.push(item); qOpen.appendChild(li(item, 'is-new'));
            });
          }
          if (res === 'dup') {
            field('result', 'sent back as a repeat', 'v-rej');
            all[3].classList.replace('is-at', 'is-passed'); moveSig(5); all[5].classList.add('is-at');
            say('You said it is the same job, so it is sent back. The first request stays the only record of that repair.');
            addRet({ id: id, text: q.text });
          }
        })
        .then(function () { if (my === token) setBusy(false); }, function () {});
    }
    reqBtns.forEach(function (b, i) { b.addEventListener('click', function () { send(i); }); });
    $('#con-reset', con).addEventListener('click', reset);
    window.addEventListener('resize', function () {
      var at = all.filter(function (n) { return n.classList.contains('is-at'); })[0];
      if (at && sig.classList.contains('is-on')) moveSig(all.indexOf(at), true);
    });
    reset();
  })();

  /* ---------- C · Human + agent ---------- */
  var ha = $('#ha');
  if (ha) (function () {
    var sendBtn = $('#ha-send', ha), msg = $('#ha-msg', ha), trace = $('#ha-trace', ha), tag = $('#ha-tag', ha);
    var cmp = $('.ha__cmp', ha), cmpBtns = $$('button', cmp), again = $('#ha-reset', ha), after = $('.ha__after', ha);
    var pulse = $('.ha__pulse', ha), sr = $('#ha-sr', ha), states = $$('.ha__states li');
    var segs = {}; $$('.seg', ha).forEach(function (s) { segs[s.getAttribute('data-ch')] = s; });
    var V1 = { tv: 34, digital: 30, print: 20, video: 16 }, V2 = { tv: 34, digital: 30, print: 8, video: 28 };
    var NAMES = { tv: 'TV', digital: 'Digital', print: 'Print', video: 'Video' };
    var LINES = [
      ['planner says: move money from print to video', 'is-fb'],
      ['rule: the total must stay the same', ''],
      ['move 12% from print to video', ''],
      ['check: total still the same', ''],
      ['revised plan <span class="v">v2</span>', '']
    ];
    var base = trace.innerHTML, token = 0;
    function show(split, v) {
      Object.keys(segs).forEach(function (k) { segs[k].style.setProperty('--w', split[k] + '%'); $('em', segs[k]).textContent = split[k] + '%'; });
      ha.setAttribute('data-v', v);
      sr.textContent = 'Plan v' + v + ' (illustrative): ' + Object.keys(split).map(function (k) { return NAMES[k] + ' ' + split[k] + '%'; }).join(', ') + '.';
    }
    function lit(n) { states.forEach(function (s, i) { s.classList.toggle('is-lit', i <= n); }); }
    // A pulse carries the feedback from the planner to the agent
    function fly(from, to, colour) {
      if (reduce || !pulse.animate) return Promise.resolve();
      var h = ha.getBoundingClientRect(), a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
      var p0 = [a.left - h.left + a.width / 2, a.top - h.top + a.height / 2], p1 = [b.left - h.left + 12, b.bottom - h.top + 8];
      pulse.style.background = colour;
      return pulse.animate([
        { transform: 'translate(' + p0[0] + 'px,' + p0[1] + 'px)', opacity: 0 },
        { opacity: 1, offset: .15 },
        { transform: 'translate(' + p1[0] + 'px,' + p1[1] + 'px)', opacity: 1, offset: .9 },
        { transform: 'translate(' + p1[0] + 'px,' + p1[1] + 'px)', opacity: 0 }
      ], { duration: 800, easing: 'cubic-bezier(.45,0,.2,1)' }).finished;
    }
    function reset() {
      token++;
      ha.setAttribute('data-s', '1'); ha.classList.remove('is-check');
      msg.classList.remove('is-sent'); trace.innerHTML = base; tag.textContent = 'v1 · draft';
      cmp.hidden = true; again.hidden = true; after.hidden = true; sendBtn.disabled = false;
      show(V1, 1); lit(1);
    }
    sendBtn.addEventListener('click', function () {
      var my = ++token;
      sendBtn.disabled = true; msg.classList.add('is-sent');
      ha.setAttribute('data-s', '2'); lit(2);
      fly(msg, trace, 'var(--st-review)').then(function () {
        var p = Promise.resolve();
        LINES.forEach(function (l, i) {
          p = p.then(function () {
            if (my !== token) throw 0;
            $$('li.is-now', trace).forEach(function (x) { x.classList.remove('is-now'); x.classList.add('is-done'); });
            var li = document.createElement('li'); li.className = 'is-now is-in' + (l[1] ? ' ' + l[1] : ''); li.innerHTML = l[0]; trace.appendChild(li);
            if (i === 2) { ha.setAttribute('data-s', '3'); lit(3); show(V2, 2); }
            if (i === 3) { ha.classList.remove('is-check'); void ha.offsetWidth; ha.classList.add('is-check'); }
            return wait(i === 2 ? 1000 : 620);
          });
        });
        return p;
      }).then(function () {
        if (my !== token) return;
        $$('li.is-now', trace).forEach(function (x) { x.classList.remove('is-now'); x.classList.add('is-done'); });
        tag.textContent = 'v2 · revised'; lit(4);
        cmp.hidden = false; again.hidden = false; after.hidden = false;
        cmpBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-v') === '2')); });
      }, function () {});
    });
    cmpBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        cmpBtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        var v = +b.getAttribute('data-v'); show(v === 1 ? V1 : V2, v); tag.textContent = v === 1 ? 'v1 · draft' : 'v2 · revised';
      });
    });
    again.addEventListener('click', reset);
    reset();
  })();
})();
