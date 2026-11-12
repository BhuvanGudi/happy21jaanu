/* Time-based birthday experience. Content is kept in config/schedule.js + config/letter.js. */
(() => {
  'use strict';

  const PLAN = window.BIRTHDAY_PLAN;
  const LETTER = window.LETTER || {};
  const root = document.getElementById('story');
  const hud = document.getElementById('hud');
  const bar = document.getElementById('bar');
  const notice = document.getElementById('unlock-notice');
  const countdown = document.getElementById('countdown');
  const nextTitle = document.getElementById('next-title');
  const nextTime = document.getElementById('next-time');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);
  const preview = PLAN.allowPreview === true && params.get('preview') === '1';
  const previewHour = Math.max(0, Math.min(24, Number.parseInt(params.get('hour') || '0', 10) || 0));
  const $ = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const escapeText = value => String(value ?? '');
  const isVideo = file => /\.(mp4|webm|mov|m4v)$/i.test(file || '');
  const dateParts = PLAN.date.split('-').map(Number);
  const baseYear = dateParts[0], baseMonth = dateParts[1], baseDay = dateParts[2];
  const OFFSET = Number(PLAN.utcOffsetMinutes || 330);

  // Build absolute instants from the configured IST wall-clock schedule.
  function atHour(hour) {
    const dayOffset = hour >= 24 ? 1 : 0;
    const wallHour = hour >= 24 ? hour - 24 : hour;
    return new Date(Date.UTC(baseYear, baseMonth - 1, baseDay + dayOffset, wallHour, 0, 0) - OFFSET * 60000);
  }
  const releases = [{
    id: 'opening', hour: 0, title: PLAN.opening.title, subtitle: PLAN.opening.subtitle,
    kind: 'opening', message: PLAN.opening.message, items: PLAN.opening.items || [], at: atHour(0)
  }, ...PLAN.hours.map(h => ({ ...h, id: `hour-${h.hour}`, at: atHour(h.hour) })), {
    id: 'final-letter', hour: 24, title: PLAN.final.title || LETTER.heading || 'One last letter',
    kind: 'final-letter', items: [], at: atHour(24)
  }];

  const timeFmt = new Intl.DateTimeFormat('en-IN', {
    timeZone: PLAN.timeZone || 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false
  });
  const dateTimeFmt = new Intl.DateTimeFormat('en-IN', {
    timeZone: PLAN.timeZone || 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
  });
  const dayFmt = new Intl.DateTimeFormat('en-GB', { timeZone: PLAN.timeZone || 'Asia/Kolkata', day: 'numeric', month: 'long' });
  // Labels are derived from PLAN.date, so changing the date in schedule.js updates every label.
  const releaseLabel = r => `${String(r.hour % 24).padStart(2, '0')}:00 · ${dayFmt.format(r.at)} IST`;
  const now = () => new Date();
  let renderedCount = 0;
  let previousCount = -1;
  let toastTimer;
  const videoObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
  }, { rootMargin: '60% 0px' }) : null;

  // Adds .in to each figure when it scrolls into view (needed by the fx-wipe / fx-color effects).
  const figureObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('in'); figureObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.25 }) : null;

  function unlockedCount(current) {
    if (preview) return Math.min(releases.length, previewHour + 1); // 0..23 unlock hourly releases; 24 includes final letter.
    return releases.filter(r => r.at.getTime() <= current.getTime()).length;
  }

  function addReveal(el) {
    root.append(el);
    if (reduceMotion) el.classList.add('in');
    else requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
    return el;
  }

  const mediaUrl = file => 'media/' + String(file).split('/').map(encodeURIComponent).join('/');

  function createMedia(file, item) {
    const media = isVideo(file) ? $('video', '') : $('img', '');
    if (media.tagName === 'VIDEO') {
      media.src = mediaUrl(file);
      media.controls = item.controls !== false;
      media.playsInline = true;
      media.preload = 'metadata';
      media.muted = true;
      media.loop = item.loop !== false;
      if (videoObserver) videoObserver.observe(media);
      else media.addEventListener('canplay', () => media.play().catch(() => {}), { once: true });
    } else {
      media.src = mediaUrl(file);
      media.alt = item.alt || item.caption || '';
      media.loading = 'lazy';
      media.decoding = 'async';
    }
    media.addEventListener('error', () => {
      const figure = media.closest('figure');
      if (figure) figure.remove();
    }, { once: true });
    return media;
  }

  function renderItems(items, section) {
    (items || []).forEach(item => {

      if (item.layout === 'split-row' || item.layout === 'columns') {
        const row = $('div', 'memory-split-row');
        if (Array.isArray(item.columns)) {
          if (item.columns.length === 3) {
            row.style.display = 'grid';
            row.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
            row.style.gap = '1rem';
          }
          renderItems(item.columns, row);
        }
        section.append(row);
        return;
      }

      if (item.type === 'poem' || item.type === 'note') {
        const block = $('div', `content-note ${item.type}`);
        if (item.title) block.append($('h3', '', item.title));
        if (item.text) block.append($('p', '', item.text));
        section.append(block);
        return;
      }
      const files = item.files || (item.file ? [item.file] : []);
      if (!files.length) return;

      const layout = item.layout || 'center';
      const figure = $('figure', `memory-media ${layout}${item.fx ? ` fx-${item.fx.split(' ').join(' fx-')}` : ''}`);

      if (layout === 'stack') {
        const box = $('div', 'box st');
        files.forEach(file => {
          const ph = $('div', 'ph');
          ph.append(createMedia(file, item));
          box.append(ph);
        });
        box.addEventListener('click', () => {
          if (box.children.length > 1) {
            box.prepend(box.lastElementChild);
          }
        });
        figure.append(box);
      } else if (layout === 'gallery') {
        const gal = $('div', 'gal');
        files.forEach(file => {
          const ph = $('div', 'ph');
          ph.append(createMedia(file, item));
          gal.append(ph);
        });
        figure.append(gal);
      } else if (layout === 'accordion' || layout === 'acc') {
        const acc = $('div', 'acc');
        files.forEach(file => {
          const ph = $('div', 'ph');
          ph.append(createMedia(file, item));
          acc.append(ph);
        });
        figure.append(acc);
      } else if (layout === 'ticker' || layout === 'marquee') {
        const wrap = $('div', 'ticker-wrap');
        const track = $('div', 'ticker-track');

        // Render two identical sets of items to make the loop seamless
        [...files, ...files].forEach((file, index) => {
          const ph = $('div', 'ticker-item');
          ph.append(createMedia(file, item));
          track.append(ph);
        });

        wrap.append(track);
        figure.append(wrap);
      } else if (layout === 'stack' || layout === 'stack-vertical') {
        const stackWrap = $('div', 'stack-inner');
        files.forEach((file, idx) => {
          const card = $('div', 'stack-card');
          card.dataset.index = idx;
          card.append(createMedia(file, item));
          stackWrap.append(card);
        });

        // Click to cycle top card to bottom
        stackWrap.addEventListener('click', () => {
          const first = stackWrap.firstElementChild;
          if (!first) return;
          first.style.transform = 'translateY(-120%) rotate(8deg)';
          first.style.opacity = '0';
          setTimeout(() => {
            stackWrap.append(first);
            first.style.transform = '';
            first.style.opacity = '';
          }, 320);
        });

        figure.append(stackWrap);
      } else {
        // duo, pair, trio, card, frame
        files.forEach(file => figure.append(createMedia(file, item)));
      }

      if (figure.classList.contains('fx-tilt') && matchMedia('(hover:hover)').matches && !reduceMotion) {
        figure.addEventListener('pointermove', event => {
          const rect = figure.getBoundingClientRect();
          figure.style.setProperty('--x', `${event.clientX - rect.left}px`);
          figure.style.setProperty('--y', `${event.clientY - rect.top}px`);
          figure.style.setProperty('--fx', String((event.clientX - rect.left) / rect.width));
          figure.style.setProperty('--fy', String((event.clientY - rect.top) / rect.height));
        });
        figure.addEventListener('pointerleave', () => ['--x', '--y', '--fx', '--fy'].forEach(prop => figure.style.removeProperty(prop)));
      }

      if (item.date || item.caption || item.message) {
        const caption = $('figcaption', 'memory-caption');
        if (item.date) caption.append($('time', '', item.date));
        if (item.caption || item.message) caption.append($('p', '', item.caption || item.message));
        figure.append(caption);
      }
      section.append(figure);
      if (figureObserver) figureObserver.observe(figure); else figure.classList.add('in');
    });
  }

  function renderRelease(release) {
    if (release.kind === 'final-letter') return renderFinalLetter(release);
    const section = $('section', `release ${release.kind || 'memory'}`);
    section.id = release.id;
    section.dataset.hour = String(release.hour);

    const header = $('header', 'release-heading');
    header.append($('time', 'release-time', releaseLabel(release)));
    if (release.subtitle) header.append($('p', 'release-subtitle', release.subtitle));
    header.append($('h2', '', release.title || 'A memory from us'));
    section.append(header);

    // Password lock check
    const isLocked = release.password && localStorage.getItem(`unlocked_${release.id}`) !== 'true';

    // Content container holding secret message & media
    const secretContent = $('div', 'secret-content');
    if (release.message) secretContent.append($('p', 'release-message', release.message));
    renderItems(release.items, secretContent);
    if (!release.message && !(release.items || []).length) {
      secretContent.append($('p', 'content-pending', preview ? 'Preview chapter — add its message and media in config/schedule.js when ready.' : ''));
    }

    if (isLocked) {
      secretContent.style.display = 'none';

      const lockBox = $('div', 'password-lock-box');
      lockBox.append($('p', 'lock-title', '🔒 This chapter is locked with our code'));

      // Check if current time has reached 9:00 AM IST for the hint
      const currentHour = now().getHours(); // Current IST hour
      const showHint = preview ? true : (currentHour >= 9 || now() >= atHour(9));

      if (release.hint && showHint) {
        lockBox.append($('p', 'lock-hint', `Hint: "${release.hint}"`));
      } else if (release.hint) {
        lockBox.append($('p', 'lock-hint pending', 'Hint unlocks at 09:00 AM IST...'));
      }

      const form = $('form', 'lock-form');
      const input = $('input', 'lock-input');
      input.type = 'text';
      input.placeholder = 'Enter the secret code...';
      input.autocomplete = 'off';

      const button = $('button', 'lock-btn', 'Unlock');
      button.type = 'submit';

      const errorMsg = $('p', 'lock-error', '');

      form.append(input, button);
      lockBox.append(form, errorMsg);

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const entered = input.value.trim().toLowerCase();
        const expected = String(release.password).trim().toLowerCase();

        // Accepts "curtains" or full phrase "curtains close cheyyu"
        if (entered === expected || (release.acceptedPasswords && release.acceptedPasswords.map(p => p.toLowerCase()).includes(entered))) {
          localStorage.setItem(`unlocked_${release.id}`, 'true');
          lockBox.remove();
          secretContent.style.display = 'block';
          if (reduceMotion) secretContent.classList.add('in');
          else requestAnimationFrame(() => requestAnimationFrame(() => secretContent.classList.add('in')));
        } else {
          errorMsg.textContent = 'Nope, not quite! Think about our little phrase :)';
          input.value = '';
          input.focus();
        }
      });

      section.append(lockBox);
    }

    section.append(secretContent);
    addReveal(section);
    return section;
  }

  function renderFinalLetter(release) {
    const section = $('section', 'release final-letter');
    section.id = release.id;
    const bgFile = PLAN.final.backgroundFile || LETTER.file || '';
    if (bgFile) section.style.setProperty('--final-photo', `url("${mediaUrl(bgFile)}")`);
    const opacity = Math.max(0, Math.min(1, Number(PLAN.final.backgroundOpacity ?? 0.2)));
    section.style.setProperty('--final-photo-opacity', String(opacity));
    const header = $('header', 'release-heading final-heading');
    header.append($('time', 'release-time', releaseLabel(release)));
    header.append($('h2', '', LETTER.heading || release.title || 'One last letter'));
    section.append(header);
    const paper = $('article', 'final-paper');
    const text = $('div', 'final-letter-text', LETTER.text || 'Your final letter will go here.');
    paper.append(text);
    if (LETTER.signature) paper.append($('p', 'final-signature', LETTER.signature));
    section.append(paper);
    addReveal(section);
    return section;
  }

  function renderLanding() {
    const landing = $('section', 'open timed-landing');
    landing.id = 'landing';
    landing.append($('p', 'eyebrow', 'A birthday made of our memories'));
    landing.append($('h1', '', 'Something is waiting for you'));
    landing.append($('p', 'line', 'The first chapter opens at midnight, IST.'));
    const timer = $('p', 'landing-countdown');
    timer.id = 'landing-countdown';
    landing.append(timer);
    root.append(landing);
    updateLandingCountdown();
  }

  function showToast(release) {
    if (!notice) return;
    notice.replaceChildren();
    notice.append($('span', '', `A new memory is unlocked: ${release.title}`));
    const button = $('button', '', 'View memory');
    button.type = 'button';
    button.addEventListener('click', () => {
      document.getElementById(release.id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      notice.classList.remove('visible');
    });
    notice.append(button);
    notice.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => notice.classList.remove('visible'), 12000);
  }

  function updateHud() {
    const page = document.documentElement;
    const scrollable = page.scrollHeight - innerHeight;
    bar.style.setProperty('--w', `${scrollable > 0 ? (scrollY / scrollable) * 100 : 0}%`);
    const visibleSections = [...root.querySelectorAll('.release')];
    if (!visibleSections.length) { hud.classList.remove('on'); return; }
    const mid = innerHeight * 0.45;
    let active = visibleSections[0];
    visibleSections.forEach(s => { if (s.getBoundingClientRect().top <= mid) active = s; });
    const time = active.querySelector('.release-time')?.textContent || '';
    const title = active.querySelector('h2')?.textContent || '';
    hud.replaceChildren($('span', '', 'OUR STORY'), $('span', '', `${time}  ·  ${title}`));
    hud.classList.add('on');
  }

  function nextReleaseInfo(count, current) {
    const next = releases[count];
    if (!next) {
      if (nextTitle) nextTitle.textContent = 'Every chapter is now unlocked';
      if (nextTime) nextTime.textContent = 'The whole journey is here.';
      if (countdown) countdown.textContent = '';
      return;
    }
    if (nextTitle) nextTitle.textContent = next.hour === 24 ? 'The final letter' : next.title;
    if (nextTime) nextTime.textContent = `Unlocks ${releaseLabel(next)}`;
    const target = preview ? current : next.at;
    const diff = Math.max(0, target.getTime() - current.getTime());
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    if (countdown) countdown.textContent = preview ? 'Preview mode is active' : `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function updateLandingCountdown() {
    const el = document.getElementById('landing-countdown');
    if (!el) return;
    const diff = Math.max(0, atHour(0).getTime() - now().getTime());
    const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000);
    el.textContent = preview ? `Preview mode · showing releases through ${previewHour === 24 ? 'the final letter' : `${String(previewHour).padStart(2, '0')}:00 IST`}` :
      diff > 0 ? `Opens in ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : 'Opening your story…';
  }

  function setupPreviewTools() {
    if (!preview) return;
    const panel = $('aside', 'preview-tools');
    panel.append($('label', '', 'Preview releases'));
    const select = $('select', '');
    select.setAttribute('aria-label', 'Choose release to preview');
    for (let h = 0; h <= 24; h++) {
      const option = $('option', '', h === 24 ? 'Final letter · 00:00 next day' : `${String(h).padStart(2, '0')}:00 IST`);
      option.value = String(h);
      option.selected = h === previewHour;
      select.append(option);
    }
    select.addEventListener('change', () => {
      const query = new URLSearchParams(location.search);
      query.set('preview', '1'); query.set('hour', select.value);
      location.search = query.toString();
    });
    panel.append(select, $('p', '', 'Testing only. Remove ?preview=1 before sharing the site.'));
    document.body.append(panel);
  }

  function tick() {
    const current = now();
    const count = unlockedCount(current);
    if (!root.querySelector('#landing') && count === 0) renderLanding();
    if (count > 0) document.getElementById('landing')?.remove();
    while (renderedCount < count) {
      const release = releases[renderedCount];
      renderRelease(release);
      renderedCount++;
      if (previousCount >= 0 && renderedCount === count) showToast(release);
    }
    if (count !== previousCount) {
      previousCount = count;
      if (count > 0) document.getElementById('landing')?.remove();
    }
    nextReleaseInfo(count, current);
    updateLandingCountdown();
    updateHud();
  }

  setupPreviewTools();
  tick();
  setInterval(tick, 1000);
  addEventListener('scroll', updateHud, { passive: true });
})();
