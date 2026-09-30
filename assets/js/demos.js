/* Demo windows: the Try it buttons open a <dialog> with a small working prototype.
   Project demos (investigation, supervisor console, planning agent) live in the page;
   the nine tool demos share one window, filled from TOOLS below. All data is made up. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

  /* ---------- open / close ---------- */
  var opener = null;
  function open(d, from) {
    if (!d || d.open) return;
    opener = from || null;
    d.showModal();
    document.documentElement.classList.add('has-demo');
    d.dispatchEvent(new CustomEvent('demo:open'));
  }
  $$('dialog.demo').forEach(function (d) {
    d.addEventListener('close', function () {
      document.documentElement.classList.remove('has-demo');
      d.dispatchEvent(new CustomEvent('demo:close'));
      if (opener && opener.focus) opener.focus();
    });
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); // backdrop
    $$('[data-close]', d).forEach(function (b) { b.addEventListener('click', function () { d.close(); }); });
  });
  $$('[data-demo]').forEach(function (b) {
    b.addEventListener('click', function () { open(document.getElementById(b.getAttribute('data-demo')), b); });
  });

  /* ---------- tool demos ---------- */
  var TOOLS = {
    ixp: { name: 'IXP Document Wrapper', tag: 'for my team', c: 'extract', repo: 'https://github.com/sowmyaarajan/ixp-universal-document-wrapper',
      why: 'Every project that reads documents rebuilds the same plumbing just to open and convert the files.',
      what: 'A tool that takes almost any file (Word, Excel, images, ZIP folders, emails: 15+ types), cleans it up and hands back neatly organised data.',
      how: 'Converts and validates, then calls UiPath IXP and returns JSON. Ships as a REST service or as a drag-and-drop Studio activity that needs no server.',
      ask: 'Drop a file', choices: ['invoice.pdf', 'claim.eml', 'scans.zip', 'receipt.jpg'],
      steps: function (k) { return ['work out what kind of file it is: ' + ['a PDF', 'an email with 2 attachments', 'a ZIP of 3 files', 'a photo'][k], k === 2 ? 'unpack and convert each file' : 'convert it to a standard format', 'check the pages and text are readable', 'send it to the document AI (IXP)', 'hand back neat, organised data']; },
      out: function (k) { return ['{ "file": "invoice.pdf", "invoice_no": "INV-0042",\n  "total": "1,240.00", "currency": "EUR" }', '{ "file": "claim.eml", "claim_id": "CL-7781",\n  "attachments": 2, "policy": "HX-2210" }', '{ "file": "scans.zip", "documents": 3,\n  "types": ["invoice", "order", "receipt"] }', '{ "file": "receipt.jpg", "shop": "Cafe Nilgiri",\n  "total": "480.00", "currency": "INR" }'][k]; } },
    visionai: { name: 'VisionAI', tag: 'for my team', c: 'extract', repo: 'https://github.com/sowmyaarajan/VisionAI',
      why: 'When AI reads a document you can’t see what it is doing, so it is hard to show anyone or compare results.',
      what: 'An app that shows each step live as the AI reads a document, then asks another AI to double-check what it found.',
      how: 'FastAPI and React; server-sent events stream the IXP pipeline; fields are analysed with Claude, OpenAI or Gemini and compared across runs and models.',
      ask: 'Double-check the answers with', choices: ['Claude', 'OpenAI', 'Gemini'],
      steps: function (k) { return ['upload sample_invoice.pdf', 'turn the scan into text (live)', 'recognise it as an invoice', 'pull out 7 fields', 'ask ' + ['Claude', 'OpenAI', 'Gemini'][k] + ' to check them']; },
      out: function (k) { return '7 fields found · run #' + (k + 2) + '\n' + ['Claude', 'OpenAI', 'Gemini'][k] + ': “The total matches the line items. Payment is due 30 days after the invoice date.”\nCompare with run #1 →'; } },
    memory: { name: 'Agent Memory', tag: 'internal reference build', c: 'review',
      why: 'AI assistants keep asking people the same questions over and over.',
      what: 'When the AI agent gets stuck it asks a person, remembers the approved answer, and next time answers by itself.',
      how: 'Escalation to a human, approved answers stored as memory, retrieval before escalating. Designed, built and tested in one day.',
      ask: 'Ask the agent', choices: ['Can I expense a taxi after 10pm?', 'How do I reset my VPN token?'], memory: true,
      out: function (k, remembered) { return remembered ? 'Answered from memory in one step.\nNobody had to be interrupted this time.' : 'Asked a person once. The approved answer is now remembered.\nTry asking the same question again.'; } },
    maestro: { name: 'Maestro case flow', tag: 'internal reference build', c: 'review',
      why: 'Teams needed a working example of a complete job, from the first step to the last.',
      what: 'A repair-job case: a new record starts it, an AI agent sorts it, a person reviews anything unusual, and an automatic step closes it.',
      how: 'Entity trigger → intake → AI classifier agent → human review app for escalations → API workflow to close. Comes with a full implementation guide.',
      ask: 'New record', choices: ['Pump failure repair job', 'Access request'],
      steps: function (k) { return ['a new record is created', 'intake', 'AI agent sorts it: priority ' + (k === 0 ? 'high' : 'normal'), k === 0 ? 'sent to a person to review' : 'no review needed, approved', 'an automatic step closes the case']; },
      out: function (k) { return k === 0 ? 'Case closed · 5 steps · 1 decision by a person' : 'Case closed · 5 steps · no one needed to step in'; } },
    cortex: { name: 'Automation Cortex', tag: 'hackweek 2026', c: 'reason', repo: 'https://github.com/sowmyaarajan/automation-cortex',
      why: 'Nobody knows which automations are fragile, or what a small change will break.',
      what: 'It reads automation files, builds a “genome” for each one, scores how fragile it is, shows everything a change would affect, and writes up-to-date instructions.',
      how: 'Static parser → automation genome → fragility score and blast radius → living SOPs. A coded agent argues with design decisions as an adversarial consultant.',
      ask: 'Pick an automation', choices: ['Invoice_Posting.xaml', 'Vendor_Onboarding.xaml'],
      steps: function () { return ['read the automation files', 'build its “genome”', 'score how fragile it is', 'find everything a change would affect', 'write fresh instructions']; },
      out: function (k) { return k === 0 ? 'Fragility 7.2 / 10: 3 hard-coded screen positions\nA change here affects 14 steps in 2 processes\nInstructions updated · the consultant agent disagrees with 1 design choice' : 'Fragility 3.1 / 10\nA change here affects 4 steps in 1 process\nInstructions updated'; } },
    flowlens: { name: 'FlowLens', tag: 'hackweek 2026', c: 'reason', repo: 'https://github.com/sowmyaarajan/flowlens',
      why: 'The fix you need often already exists, but you can’t find it at the moment you need it.',
      what: 'A desktop helper that looks at what you just copied and which app you are in, and offers the right automation with one keyboard shortcut.',
      how: 'Electron app reading clipboard and active-window context, routed through a coded agent; remembers past fixes and flags repeated manual loops.',
      ask: 'On your clipboard', choices: ['Error 0x80070005 in SAP export', 'Order number PO-88213'],
      steps: function () { return ['read what you copied and which app is open', 'ask the AI agent what this is', 'look for fixes that worked before', 'offer an automation']; },
      out: function (k) { return k === 0 ? 'Suggested: rerun the SAP export with the right permissions\n(fixed this way 3 times before) · press Ctrl+Alt+L' : 'Suggested: open PO-88213 in the approval queue\nYou did this by hand 6 times this week, so it could be automated'; } },
    clausage: { name: 'Clausage Bar', tag: 'just for fun', c: 'ingest', repo: 'https://github.com/sowmyaarajan/clausage-bar',
      why: 'Checking how much of an AI assistant allowance is left means stopping work to look it up.',
      what: 'A tiny app on the Windows taskbar that shows how much of my Claude allowance I have used this session, this week and this month, and warns me at 50, 75 and 100%.',
      how: 'Python tray app. Unofficial, and it says so when its data source changes.',
      ask: 'What kind of day?', choices: ['A quiet morning', 'A busy afternoon', 'A long coding day'],
      steps: function () { return ['read this session’s usage', 'update this week', 'update this month', 'check the warning levels']; },
      out: function (k) { return ['Session 22% · week 31% · month 14%\nNo warnings', 'Session 58% · week 47% · month 21%\nWarning: this session passed 50%', 'Session 100% · week 78% · month 36%\nWarnings at 50%, 75% and 100%: limit reached, time for a break'][k]; } },
    halwa: { name: 'HalwaShare', tag: 'just for fun', c: 'ingest', repo: 'https://github.com/sowmyaarajan/halwashare',
      why: 'Sending a big file to someone sitting right next to you usually means uploading it somewhere first.',
      what: 'Send any file, of any size, straight to people nearby. Nothing is uploaded or stored: it goes directly from one device to the other.',
      how: 'Node.js and WebRTC: file.slice() → 256 KB chunks → DataChannel → receiver’s disk, with a server relay if no direct path appears within 10 seconds.',
      ask: 'Send a file', choices: ['holiday.jpg · 4 MB', 'demo.mp4 · 480 MB', 'dataset.zip · 2.1 GB, office firewall'],
      steps: function (k) { var s = ['offer the file (only its name and size are shared)', 'connect the two devices directly']; if (k === 2) s.push('no direct path after 10 seconds, switch to the relay'); return s.concat(['stream it in 256 KB pieces', 'save it straight to their phone']); },
      out: function (k) { return ['✓ 4 MB sent in 17 pieces · directly · nothing stored on a server', '✓ 480 MB sent in 1,920 pieces · directly · nothing stored on a server', '✓ 2.1 GB sent in 8,400 pieces · through the relay, which passes pieces along without keeping the file'][k]; } },
    gapscout: { name: 'GapScout', tag: 'just for fun', c: 'ingest', repo: 'https://github.com/sowmyaarajan/gapscout',
      why: 'It is hard to know what to build next that lots of people actually need.',
      what: 'Finds problems many developers are asking for help with on GitHub but nobody has solved yet, by grouping thousands of open requests.',
      how: 'MCP server and web UI; keyword and bigram clustering over open issues, scored by reactions, comments, age, repo spread and abandoned alternatives. No AI on the server: your own AI client does the reasoning.',
      ask: 'Language', choices: ['rust', 'python', 'typescript'],
      steps: function () { return ['fetch open requests from the most popular projects', 'group requests that ask for the same thing', 'score each group by how many people want it']; },
      out: function (k) { return [
        '1. Async cancellation guidance · 41 requests, 9 projects\n2. Cross-compiling to musl · 28 requests, 6 projects\n3. Readable macro error messages · 33 requests, 7 projects',
        '1. Typed config for command-line tools · 37 requests, 8 projects\n2. Windows path handling · 26 requests, 11 projects\n3. Async test fixtures · 22 requests, 5 projects',
        '1. ESM and CommonJS working together · 52 requests, 12 projects\n2. Faster type-checking in big repos · 31 requests, 7 projects\n3. Schema-to-API edge cases · 19 requests, 4 projects'][k]; } }
  };
  var box = document.getElementById('demo-tool'), host = document.getElementById('tdemo');
  if (!box || !host) return;
  var nameEl = document.getElementById('tool-name'), dotEl = document.getElementById('tool-dot');
  var remembered = {}, timer = 0;

  function row(dl, k, v) { var d = el('div'); d.appendChild(el('dt', '', k)); d.appendChild(el('dd', '', v)); dl.appendChild(d); }

  function render(key) {
    clearInterval(timer);
    var t = TOOLS[key], choice = 0;
    box.style.setProperty('--c', 'var(--st-' + t.c + ')');
    nameEl.textContent = t.name; dotEl.className = 'demo__dot';
    host.innerHTML = '';
    var about = el('div', 'tdemo__about');
    about.appendChild(el('p', 'meta', t.tag));
    var dl = el('dl', 'tdemo__dl');
    row(dl, 'Why', t.why); row(dl, 'What', t.what);
    about.appendChild(dl);
    var eng = el('p', 'eng'); eng.appendChild(el('span', '', 'For engineers')); eng.appendChild(document.createTextNode(' ' + t.how)); about.appendChild(eng);
    if (t.repo) { var a = el('a', 'link', 'Code on GitHub ↗'); a.href = t.repo; a.rel = 'noopener'; about.appendChild(a); }
    host.appendChild(about);

    var tryBox = el('div', 'tdemo__try');
    var head = el('p', 'tdemo__ask'); head.appendChild(el('b', '', t.ask)); head.appendChild(el('span', 'meta', 'dummy prototype · made-up data')); tryBox.appendChild(head);
    var chips = el('div', 'tdemo__chips');
    var chipBtns = t.choices.map(function (c, k) {
      var b = el('button', 'tdemo__chip', c); b.type = 'button'; b.setAttribute('aria-pressed', String(k === 0));
      b.addEventListener('click', function () { choice = k; chipBtns.forEach(function (x, j) { x.setAttribute('aria-pressed', String(j === k)); }); reset(); });
      chips.appendChild(b); return b;
    });
    tryBox.appendChild(chips);
    var list = el('ol', 'tdemo__steps'); tryBox.appendChild(list);
    var out = el('pre', 'tdemo__out'); out.hidden = true; tryBox.appendChild(out);
    var run = el('button', 'btn btn--primary btn--pill', 'Run it ▸'); run.type = 'button'; tryBox.appendChild(run);
    host.appendChild(tryBox);

    function stepsFor() {
      if (!t.memory) return t.steps(choice);
      return remembered[choice] ? ['the agent reads the question', 'finds an approved answer in memory', 'answers straight away, no one interrupted']
        : ['the agent reads the question', 'it is not sure of the answer', 'asks a person', 'the person writes the answer', 'the agent remembers it'];
    }
    function paint(steps, upto, running) {
      list.innerHTML = '';
      steps.forEach(function (s, i) {
        var li = el('li', i < upto ? 'is-done' : (running && i === upto ? 'is-now' : ''));
        li.appendChild(el('span', 'mk', i < upto ? '✓' : (running && i === upto ? '▸' : '·')));
        li.appendChild(el('span', '', s));
        if (/person/.test(s) && !/no one|Nobody/.test(s)) li.appendChild(el('span', 'who', 'a person'));
        list.appendChild(li);
      });
    }
    function reset() { clearInterval(timer); out.hidden = true; run.disabled = false; run.textContent = 'Run it ▸'; paint(stepsFor(), 0, false); }
    run.addEventListener('click', function () {
      clearInterval(timer);
      var steps = stepsFor(), was = !!remembered[choice], i = 0;
      out.hidden = true; run.disabled = true; run.textContent = 'Running…';
      var finish = function () {
        paint(steps, steps.length, false);
        if (t.memory) remembered[choice] = true;
        out.textContent = t.out(choice, was); out.hidden = false;
        run.disabled = false; run.textContent = 'Run again ↺';
      };
      if (reduce) return finish();
      paint(steps, 0, true);
      timer = setInterval(function () { i++; if (i >= steps.length) { clearInterval(timer); finish(); } else paint(steps, i, true); }, 650);
    });
    reset();
  }
  $$('[data-tool]').forEach(function (b) {
    b.addEventListener('click', function () { render(b.getAttribute('data-tool')); open(box, b); });
  });
  box.addEventListener('demo:close', function () { clearInterval(timer); });
})();
