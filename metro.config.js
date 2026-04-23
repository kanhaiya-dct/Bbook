const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 1. Add wasm to assets
config.resolver.assetExts.push('wasm');

// 2. Fix for web worker wasm resolution
config.resolver.sourceExts.push('mjs');

// 3. Add SharedArrayBuffer headers for web (wa-sqlite needs these)
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
