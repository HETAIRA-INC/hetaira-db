// config.js — shared by every page (load it BEFORE common.js)
(function () {
  const cfg = {
    // Cover art (hetaira-c1 repo). Record paths look like "<artist-uuid>/cover/<uuid>.jpg"
    COVER_BASE_URL: 'https://raw.githubusercontent.com/HETAIRA-INC/hetaira-c1/refs/heads/main/',
    // Audio (hetaira-c1 repo, stored with Git LFS). Record paths look like "<artist-uuid>/audio/<uuid>.mp3"
    AUDIO_BASE_URL: 'https://media.githubusercontent.com/media/HETAIRA-INC/hetaira-c1/refs/heads/main/',
    // JSON catalog (hetaira-data repo): artists.json, tags.json, triggers.json, summary-all.json, <artist-uuid>/records/<uuid>.json
    DB_BASE_URL: 'https://raw.githubusercontent.com/HETAIRA-INC/hetaira-data/refs/heads/main/',

    // Items loaded per batch on the main directory grid
    PAGE_SIZE: 12
  };

  // Local development overrides — honoured ONLY when the page itself is served from localhost,
  // so a crafted link on the public site can never point visitors at someone else's data.
  //   ?local=1   use the admin server (npm start in hetaira-data, http://localhost:3000)
  //   ?local=0   go back to the production URLs above
  //   ?db=URL  ?covers=URL  ?audio=URL   override a single base URL (value "reset" clears it)
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
    try {
      const q = new URLSearchParams(location.search);
      const KEYS = { db: 'DB_BASE_URL', covers: 'COVER_BASE_URL', audio: 'AUDIO_BASE_URL' };
      const store = (k, v) => (v === null ? localStorage.removeItem('hetaira.' + k) : localStorage.setItem('hetaira.' + k, v));
      if (q.get('local') === '1') {
        store('DB_BASE_URL', 'http://localhost:3000/');
        store('COVER_BASE_URL', 'http://localhost:3000/media/');
        store('AUDIO_BASE_URL', 'http://localhost:3000/media/');
      } else if (q.get('local') === '0') {
        Object.values(KEYS).forEach(k => store(k, null));
      }
      for (const [param, key] of Object.entries(KEYS)) {
        if (q.has(param)) store(key, q.get(param) === 'reset' ? null : q.get(param));
        const saved = localStorage.getItem('hetaira.' + key);
        if (saved) cfg[key] = saved;
      }
    } catch (e) { /* storage blocked: use defaults */ }
  }

  window.APP_CONFIG = cfg;

  const join = (base, path) => (base ? base.replace(/\/+$/, '') + '/' : '') + path.replace(/^\/+/, '');
  const encodePath = p => p.split('/').map(s => encodeURIComponent(decodeSafe(s))).join('/');
  function decodeSafe(s) { try { return decodeURIComponent(s); } catch (e) { return s; } }

  /** Resolve a JSON path inside the data repo. */
  window.resolveDbUrl = function (path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return join(cfg.DB_BASE_URL, encodePath(path));
  };

  /** Resolve a record's cover/audio path to a full URL. Absolute http(s) URLs pass through untouched. */
  window.resolveAssetUrl = function (path, type = 'cover') {
    path = String(path || '').trim();
    if (!path) return '';
    if (/^https?:\/\//i.test(path) || /^data:image\//i.test(path)) return path;
    if (/^[a-z][a-z0-9+.-]*:/i.test(path)) return '';           // javascript:, file:, ... never allowed
    return join(type === 'audio' ? cfg.AUDIO_BASE_URL : cfg.COVER_BASE_URL, encodePath(path));
  };
})();
