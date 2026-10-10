// common.js — helpers shared by every page. Requires config.js first. Exposes window.H
(function () {
  const H = (window.H = {});

  /* ---------- safety ---------- */
  H.esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /** Only http(s) links may reach an href; everything else becomes "#". */
  H.safeUrl = u => (/^https?:\/\//i.test(String(u || '').trim()) ? String(u).trim() : '#');
  H.q = p => new URLSearchParams(location.search).get(p) || '';
  H.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  H.errorBox = (msg, extra = '') =>
    `<div style="grid-column:1/-1;color:var(--crimson-lust);text-align:center;padding:3rem;font-family:var(--font-mono);">${H.esc(msg)}${extra}</div>`;

  /* ---------- cover fallback ---------- */
  // encodeURIComponent leaves ' ( ) unescaped, so encode them too: the URI is then safe anywhere.
  H.FALLBACK_SVG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="#120715"/>
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,0,127,0.12)" stroke-width="1"/></pattern>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff007f"/><stop offset="100%" stop-color="#00f0ff"/></linearGradient>
      </defs>
      <rect width="400" height="400" fill="url(#grid)"/>
      <circle cx="200" cy="175" r="65" fill="none" stroke="url(#grad)" stroke-width="2" opacity="0.6"/>
      <polygon points="200,135 235,195 165,195" fill="none" stroke="#ff007f" stroke-width="2"/>
      <text x="200" y="275" text-anchor="middle" font-family="Orbitron, monospace, sans-serif" font-size="13" font-weight="700" fill="#ff4d8d" letter-spacing="2">[ NO COVER ARTWORK ]</text>
      <text x="200" y="300" text-anchor="middle" font-family="monospace" font-size="11" fill="#00f0ff" opacity="0.8">// SIGNAL_OFFLINE</text>
    </svg>`).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');

  // One delegated handler replaces every inline onerror="" (no quoting pitfalls, no loops).
  document.addEventListener('error', e => {
    const img = e.target;
    if (img && img.tagName === 'IMG' && !img.dataset.fallback) {
      img.dataset.fallback = '1';
      img.src = H.FALLBACK_SVG;
    }
  }, true);

  /** Resolved cover URL for a record, or the built-in fallback art. */
  H.cover = item => (item && item.cover && window.resolveAssetUrl(item.cover, 'cover')) || H.FALLBACK_SVG;

  /* ---------- slugs & vocabularies (must mirror hetaira-data/lib/catalog.js) ---------- */
  H.slugify = s => {
    const slug = String(s).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slug || String(s).trim().toLowerCase();
  };
  function buildLookup(vocab) {
    const map = new Map();
    for (const e of vocab) map.set(e.slug, e);
    for (const e of vocab) {
      const ls = H.slugify(e.label);
      if (!map.has(ls)) map.set(ls, e);
      for (const a of e.aliases || []) if (!map.has(H.slugify(a))) map.set(H.slugify(a), e);
    }
    return map;
  }

  /* ---------- catalog ---------- */
  H.json = async path => {
    const res = await fetch(window.resolveDbUrl(path), { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    return res.json();
  };

  H.isFree = r => /FREE/i.test(r.tier || 'FREE');
  H.dateOf = r => (r && r.releaseDate) || '';

  let catalogPromise = null;
  /**
   * Loads artists/tags/triggers/summary-all once and annotates every item:
   *   _artists [artist objects], _artistNames, _tagEntries, _trigEntries, _q (search text)
   * Returns { artists, tags, triggers, all (every status), items (ACTIVE only), tagLookup, trigLookup, artistBySlug, artistByUuid }
   */
  H.loadCatalog = () => catalogPromise || (catalogPromise = (async () => {
    const [artists, tags, triggers, all] = await Promise.all([
      H.json('artists.json').catch(() => []),
      H.json('tags.json').catch(() => []),
      H.json('triggers.json').catch(() => []),
      H.json('summary-all.json')
    ]);
    if (!Array.isArray(all)) throw new Error('summary-all.json is not a list');
    const artistByUuid = new Map(artists.map(a => [a.uuid, a]));
    const artistBySlug = new Map(artists.map(a => [a.slug, a]));
    const tagLookup = buildLookup(tags), trigLookup = buildLookup(triggers);
    const entry = (lookup, raw) => lookup.get(H.slugify(raw)) || { slug: H.slugify(raw), label: String(raw), aliases: [], count: 0, _unlisted: true };

    for (const r of all) {
      r.tags = Array.isArray(r.tags) ? r.tags : [];
      r.triggers = Array.isArray(r.triggers) ? r.triggers : [];
      r._artists = (r.artistUuids && r.artistUuids.length ? r.artistUuids : [r.artistUuid]).map(u => artistByUuid.get(u)).filter(Boolean);
      r._artistNames = r._artists.length ? r._artists.map(a => a.name) : [r.artist || r.author || 'Unknown'];
      r._tagEntries = r.tags.map(t => entry(tagLookup, t));
      r._trigEntries = r.triggers.map(t => entry(trigLookup, t));
      r._free = H.isFree(r);
      r._q = [r.title, r.id, r.tag, r.variant, r.audience, r.author, ...r._artistNames, ...r.tags, ...r.triggers, ...(r.collaborators || [])]
        .filter(Boolean).join(' ').toLowerCase();
    }
    const items = all.filter(r => !r.status || r.status === 'ACTIVE');
    return { artists, tags, triggers, all, items, tagLookup, trigLookup, artistByUuid, artistBySlug };
  })());

  /** Resolve ?tag= / ?trigger= style params (slug, label or alias) to a vocabulary entry. */
  H.findTerm = (cat, kind, raw) => {
    if (!raw) return null;
    const lookup = kind === 'triggers' ? cat.trigLookup : cat.tagLookup;
    return lookup.get(H.slugify(raw)) || null;
  };
  /** Count active items per vocabulary entry: [{slug,label,description,count}] sorted by count desc */
  H.termCounts = (cat, kind) => {
    const key = kind === 'triggers' ? '_trigEntries' : '_tagEntries';
    const m = new Map();
    for (const r of cat.items) {
      for (const e of new Set(r[key])) {
        const cur = m.get(e.slug) || { slug: e.slug, label: e.label, description: e.description || '', count: 0 };
        cur.count++;
        m.set(e.slug, cur);
      }
    }
    return [...m.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  };
  H.sortBy = (list, mode, nameOf, countOf) => list.sort((a, b) => {
    if (mode === 'COUNT_DESC') return countOf(b) - countOf(a);
    if (mode === 'COUNT_ASC') return countOf(a) - countOf(b);
    if (mode === 'NAME_ASC') return nameOf(a).localeCompare(nameOf(b));
    if (mode === 'NAME_DESC') return nameOf(b).localeCompare(nameOf(a));
    return 0;
  });

  /* ---------- infinite scroll that cannot stall ---------- */
  /**
   * step() renders one batch and returns true if it rendered something.
   * The observer is re-armed after every batch, so a tall viewport keeps loading until the sentinel is pushed
   * off-screen (a plain IntersectionObserver only fires on *changes* and stalls when the first batch is too short).
   * Call the returned kick() after you reset the list.
   */
  H.infiniteScroll = (sentinel, step, margin = '200px') => {
    const io = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && step()) requestAnimationFrame(kick);
    }, { rootMargin: margin });
    function kick() { io.unobserve(sentinel); io.observe(sentinel); }
    kick();
    return kick;
  };

  /* ---------- shared nav (pages without one get it injected) ---------- */
  H.navHtml = active => `
  <nav class="cyber-navbar">
    <div class="nav-container">
      <a href="index.html" class="brand-logo">HETAIRA<span>.EROS</span></a>
      <ul class="nav-links">
        ${[['index.html', 'Files', 'files'], ['artists.html', 'Artists', 'artists'], ['tags.html', 'Tags', 'tags'], ['triggers.html', 'Triggers', 'triggers'], ['about.html', 'About', 'about']]
          .map(([href, label, key]) => `<li><a href="${href}" class="nav-link${key === active ? ' active' : ''}">${label}</a></li>`).join('')}
      </ul>
    </div>
  </nav>`;
})();
