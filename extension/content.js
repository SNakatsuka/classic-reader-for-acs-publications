(() => {
  const ROOT = 'acs-classic-2008';
  const $all = (selector) => [...document.querySelectorAll(selector)];
  const relocatedVisuals = [];
  let listObserver;
  let visualObserver;
  let visualPrefetchEnabled = false;
  let visualFetchActive = false;
  const visualQueue = [];

  function hideNoise() {
    const noise = [
      'aside', '.sidebar', '.right-rail', '.advertisement', '.ad-container',
      '.related-content', '.recommended-content', '.recommendations',
      '[data-testid*="recommend"]', '.article-metrics', '.citation-alerts'
    ];
    $all(noise.join(',')).filter((el) => !el.classList.contains('acs-classic-list-visual'))
      .forEach((el) => el.classList.add('acs-classic-hide'));
  }

  function promoteAbstract() {
    const headings = $all('h2, h3, [role="heading"]');
    const heading = headings.find((el) => /^abstract$/i.test(el.textContent.trim()));
    if (!heading) return;
    const section = heading.closest('section, article, .abstract, [class*="abstract"]') || heading.parentElement;
    const anchor = document.querySelector('article, main, .article-content, [class*="article"]');
    if (section && anchor && !section.dataset.acsClassicMoved) {
      section.dataset.acsClassicMoved = 'true';
      anchor.prepend(section);
    }
  }

  function placeVisualAbstract() {
    if (document.querySelector('.acs-classic-intro')) return;
    const abstractHeading = $all('h2, h3, [role="heading"]').find((el) => /^abstract$/i.test(el.textContent.trim()));
    const abstract = abstractHeading?.closest('section, article, .abstract, [class*="abstract"]') || abstractHeading?.parentElement;
    const visualHeading = $all('h2, h3, h4, figcaption, [role="heading"]').find((el) => /visual\s+abstract/i.test(el.textContent.trim()));
    const visual = visualHeading?.closest('section, figure, [class*="visual"], [class*="graphic"]') || visualHeading?.parentElement;
    if (!abstract || !visual || abstract.contains(visual) || !visual.querySelector('img')) return;

    const marker = document.createComment('acs-classic-visual-original-position');
    visual.before(marker);
    const intro = document.createElement('div');
    intro.className = 'acs-classic-intro';
    abstract.before(intro);
    intro.append(abstract, visual);
    visual.classList.add('acs-classic-visual');
    visual.querySelectorAll('img').forEach((img) => {
      img.loading = 'lazy'; img.decoding = 'async'; img.setAttribute('fetchpriority', 'low');
    });
    relocatedVisuals.push({ intro, abstract, visual, marker });
  }

  function findVisualElement(root) {
    const visualLabel = [...root.querySelectorAll('*')]
      .find((el) => /^(visual\s+abstract|graphical\s+abstract)$/i.test(el.textContent.trim()));
    let visual = visualLabel;
    while (visual && visual !== root && !visual.querySelector?.('img')) visual = visual.parentElement;
    return visual && visual !== root && visual.querySelector('img') ? visual : null;
  }

  function addVisualSide(box, src) {
    if (!src || box.querySelector(':scope > .acs-classic-list-visual')) return null;
    const side = document.createElement('aside');
    side.className = 'acs-classic-list-visual';
    const title = document.createElement('div');
    title.textContent = 'Visual Abstract';
    side.append(title);
    const preview = document.createElement('img');
    preview.src = src;
    preview.loading = 'lazy'; preview.decoding = 'async'; preview.setAttribute('fetchpriority', 'low');
    preview.addEventListener('load', () => box.classList.add('acs-classic-visual-ready'), { once: true });
    preview.addEventListener('error', () => {
      side.remove();
      box.classList.remove('acs-classic-list-with-visual', 'acs-classic-visual-ready');
    }, { once: true });
    side.append(preview);
    box.append(side);
    if (preview.complete && preview.naturalWidth) box.classList.add('acs-classic-visual-ready');
    box.classList.add('acs-classic-list-with-visual');
    return side;
  }

  function placeListVisual(box) {
    const visual = findVisualElement(box);
    const existing = box.querySelector(':scope > .acs-classic-list-visual');
    if (existing) {
      visual?.classList.add('acs-classic-visual-source');
      return;
    }
    if (!visual) return;
    const image = visual.querySelector('img');
    const side = addVisualSide(box, image.currentSrc || image.src);
    if (!side) return;
    visual.classList.add('acs-classic-visual-source');
    relocatedVisuals.push({ intro: side, abstract: null, visual, listBox: box });
  }

  async function fetchVisualPreview(box) {
    const link = box.querySelector('.al-title a, a.viewArticleLink');
    if (!link || box.querySelector(':scope > .acs-classic-list-visual')) return;
    const key = `acs-classic-visual:${link.href}`;
    let src = sessionStorage.getItem(key);
    if (!src) {
      const response = await fetch(link.href, { credentials: 'same-origin' });
      if (!response.ok) return;
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const visual = findVisualElement(page);
      const image = visual?.querySelector('img');
      src = image?.getAttribute('src') || image?.getAttribute('data-src');
      if (!src) return;
      src = new URL(src, link.href).href;
      sessionStorage.setItem(key, src);
    }
    const side = addVisualSide(box, src);
    if (side) relocatedVisuals.push({ intro: side, abstract: null, visual: null, listBox: box });
  }

  function processVisualQueue() {
    if (!visualPrefetchEnabled || visualFetchActive || !visualQueue.length) return;
    const box = visualQueue.shift();
    visualFetchActive = true;
    fetchVisualPreview(box).catch(() => {}).finally(() => {
      visualFetchActive = false;
      setTimeout(processVisualQueue, 1200);
    });
  }

  function enableVisualFirst(boxes) {
    if (visualObserver) return;
    visualPrefetchEnabled = true;
    visualObserver = new IntersectionObserver((entries) => {
      entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
        const box = entry.target;
        visualObserver.unobserve(box);
        if (!box.dataset.acsClassicVisualQueued) {
          box.dataset.acsClassicVisualQueued = 'true';
          visualQueue.push(box); processVisualQueue();
        }
      });
    }, { rootMargin: '500px 0px' });
    boxes.forEach((box) => visualObserver.observe(box));
  }

  function expandArticleList() {
    const boxes = $all('.al-article-box');
    if (!boxes.length) return;
    boxes.forEach((box) => {
      box.classList.add('acs-classic-list-card');
      const response = box.querySelector('.abstract-response-placeholder:not(.hide)');
      if (response?.textContent.trim()) box.classList.add('acs-classic-abstract-ready');
      placeListVisual(box);
    });
    if (!listObserver) {
      listObserver = new MutationObserver(() => boxes.forEach((box) => {
        const response = box.querySelector('.abstract-response-placeholder:not(.hide)');
        if (response?.textContent.trim()) box.classList.add('acs-classic-abstract-ready');
        placeListVisual(box);
      }));
      listObserver.observe(document.body, { childList: true, subtree: true });
    }
    enableVisualFirst(boxes);
  }

  function emphasizePdf() {
    const links = $all('a').filter((a) => /\b(pdf|view pdf|download pdf)\b/i.test(a.textContent));
    links.forEach((a) => a.classList.add('acs-classic-pdf'));
  }

  function apply() {
    document.documentElement.classList.add(ROOT);
    hideNoise(); promoteAbstract(); placeVisualAbstract(); expandArticleList(); emphasizePdf();
  }
  function remove() {
    document.documentElement.classList.remove(ROOT);
    $all('.acs-classic-hide').forEach((el) => el.classList.remove('acs-classic-hide'));
    listObserver?.disconnect(); listObserver = undefined;
    visualObserver?.disconnect(); visualObserver = undefined;
    visualPrefetchEnabled = false; visualQueue.splice(0);
    $all('.acs-classic-list-card').forEach((box) => box.classList.remove('acs-classic-list-card'));
    relocatedVisuals.splice(0).forEach(({ intro, abstract, visual, marker, listBox }) => {
      if (abstract) intro.before(abstract);
      if (marker) marker.replaceWith(visual);
      intro.remove();
      visual?.classList.remove('acs-classic-visual', 'acs-classic-visual-source');
      listBox?.classList.remove('acs-classic-list-with-visual');
      listBox?.classList.remove('acs-classic-visual-ready');
    });
  }

  chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
    if (!enabled) return;
    apply();
    // ACS uses client-side rendering, so reapply after late-loaded sections appear.
    setTimeout(apply, 800);
    setTimeout(apply, 2000);
  });
  chrome.runtime.onMessage.addListener(({ type, enabled }) => {
    if (type === 'acs-classic-toggle') enabled ? apply() : remove();
  });
})();
