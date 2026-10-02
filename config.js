// config.js
window.APP_CONFIG = {
  // Set to '' for same-domain local assets, or point to your external repo / CDN:
  // e.g., 'https://raw.githubusercontent.com/your-user/audio-assets-repo/main/'
  // e.g., 'https://media.yourdomain.com/'
  ASSET_BASE_URL: '',

  // Items loaded per page on the main directory grid
  PAGE_SIZE: 12,

  // Path to data sources
  SUMMARY_JSON: 'summary.json',
  FALLBACK_DATA_JSON: 'data.json'
};

// Helper function to resolve media URLs
window.resolveAssetUrl = function(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const base = window.APP_CONFIG.ASSET_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return base ? `${base}/${cleanPath}` : cleanPath;
};