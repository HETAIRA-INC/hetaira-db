// config.js
window.APP_CONFIG = {
  // Set to '' for same-domain local assets, or point to your external repo / CDN:
  // e.g., 'https://raw.githubusercontent.com/your-user/audio-assets-repo/main/'
  // e.g., 'https://media.yourdomain.com/'
  //ASSET_BASE_URL: 'https://raw.githubusercontent.com/HETAIRA-INC/hetaira-c1/refs/heads/main/',
  COVER_BASE_URL: 'https://raw.githubusercontent.com/HETAIRA-INC/hetaira-c1/refs/heads/main/',
  DB_BASE_URL: 'https://raw.githubusercontent.com/HETAIRA-INC/hetaira-data/refs/heads/main/',
  AUDIO_BASE_URL: 'https://media.githubusercontent.com/media/HETAIRA-INC/hetaira-c1/refs/heads/main/',
  //use this when multi artist is implemented. AUDIO_BASE_URL: 'https://media.githubusercontent.com/media/HETAIRA-INC/hetaira-c1/refs/heads/main/7ce7929c-7574-4a8e-8405-5422ff1f16dc/',

  // Items loaded per page on the main directory grid
  PAGE_SIZE: 12,

  // Path to data sources
  ARTISTS_JSON: 'artists.json',
  TAGS_JSON: 'tags.json',
  TRIGGERS_JSON: 'triggers.json',
  SUMMARY_JSON: 'summary-all.json',
  FALLBACK_DATA_JSON: 'data.json'
};

// Helper function to resolve media URLs
window.resolveAssetUrl = function(path, type = 'cover') {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  //const base = window.APP_CONFIG.ASSET_BASE_URL.replace(/\/+$/, '');
  const base = type === 'audio' ? window.APP_CONFIG.AUDIO_BASE_URL : window.APP_CONFIG.COVER_BASE_URL;
  const cleanPath = path.replace(/^\/+/, '');
  return base ? `${base.replace(/\/+$/, '')}/${cleanPath}` : cleanPath;
};

// Helper function to resolve Database/JSON URLs with cache busting
window.resolveDbUrl = function(filename) {
  if (!filename) return '';
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
    return filename;
  }
  const base = (window.APP_CONFIG.DB_BASE_URL || '').replace(/\/+$/, '');
  const cleanFilename = filename.replace(/^\/+/, '');
  // Append timestamp query parameter to bypass GitHub's 5-minute raw cache
  return `${base}/${cleanFilename}?_t=${Date.now()}`;
};