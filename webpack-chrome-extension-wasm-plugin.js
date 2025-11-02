/**
 * Webpack plugin to fix WASM loading in Chrome extensions
 * Replaces fetch() calls with chrome.runtime.getURL() for extension pages
 * Uses different strategies for service workers vs regular extension pages
 */
class ChromeExtensionWasmPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('ChromeExtensionWasmPlugin', (compilation, callback) => {
      // Process all JS assets that might load WASM
      const jsAssets = ['background.js', 'index.js', 'wizard.js'];

      jsAssets.forEach(assetName => {
        const asset = compilation.assets[assetName];

        if (asset) {
          let source = asset.source();

          // For all extension pages, use chrome.runtime.getURL to get proper extension:// URL
          // Then fetch with proper headers
          source = source.replace(
            /var req = fetch\(__webpack_require__\.p\s*\+\s*""\s*\+\s*([a-zA-Z0-9_]+)\s*\+\s*"\.module\.wasm"\);/g,
            'var wasmUrl = chrome.runtime.getURL(($1 + ".module.wasm")); var req = fetch(wasmUrl);'
          );

          compilation.assets[assetName] = {
            source: () => source,
            size: () => source.length
          };
        }
      });

      callback();
    });
  }
}

module.exports = ChromeExtensionWasmPlugin;
