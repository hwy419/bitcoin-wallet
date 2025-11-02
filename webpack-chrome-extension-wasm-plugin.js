/**
 * Webpack plugin to fix WASM loading in Chrome extensions
 * Replaces fetch() calls with chrome.runtime.getURL() for all extension pages
 */
class ChromeExtensionWasmPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('ChromeExtensionWasmPlugin', (compilation, callback) => {
      // Process all JS assets that might load WASM (background, index, wizard)
      const jsAssets = ['background.js', 'index.js', 'wizard.js'];

      jsAssets.forEach(assetName => {
        const asset = compilation.assets[assetName];

        if (asset) {
          let source = asset.source();

          // Replace the WASM fetch calls to use chrome.runtime.getURL with a variable
          // Original: var req = fetch(__webpack_require__.p + "" + wasmModuleHash + ".module.wasm");
          // New: var wasmUrl = __webpack_require__.p + "" + wasmModuleHash + ".module.wasm"; var req = fetch(chrome.runtime.getURL(wasmUrl));
          source = source.replace(
            /var req = fetch\(__webpack_require__\.p\s*\+\s*""\s*\+\s*([a-zA-Z0-9_]+)\s*\+\s*"\.module\.wasm"\);/g,
            'var wasmUrl = __webpack_require__.p + "" + $1 + ".module.wasm"; var req = fetch(chrome.runtime.getURL(wasmUrl));'
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
