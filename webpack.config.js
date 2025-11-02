const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ChromeExtensionWasmPlugin = require('./webpack-chrome-extension-wasm-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  // Load development environment variables from .env.local (gitignored)
  let devPassword = '';
  let devMnemonic = '';
  let blockstreamProxyUrl = '';

  if (isDevelopment) {
    const envLocalPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envLocalPath)) {
      const envContent = fs.readFileSync(envLocalPath, 'utf-8');

      // Extract DEV_PASSWORD
      const passwordMatch = envContent.match(/DEV_PASSWORD=(.+)/);
      if (passwordMatch && passwordMatch[1]) {
        devPassword = passwordMatch[1].trim();
      }

      // Extract DEV_MNEMONIC (may span multiple lines or be on one line)
      const mnemonicMatch = envContent.match(/DEV_MNEMONIC=(.+)/);
      if (mnemonicMatch && mnemonicMatch[1]) {
        devMnemonic = mnemonicMatch[1].trim();
      }

      // Extract BLOCKSTREAM_PROXY_URL (for testing Lambda proxy locally)
      const proxyUrlMatch = envContent.match(/BLOCKSTREAM_PROXY_URL=(.+)/);
      if (proxyUrlMatch && proxyUrlMatch[1]) {
        blockstreamProxyUrl = proxyUrlMatch[1].trim();
      }
    }
  } else {
    // Production: Use testnet Lambda proxy by default (can override with env var)
    blockstreamProxyUrl = process.env.BLOCKSTREAM_PROXY_URL || 'https://o785rls4nd.execute-api.us-east-1.amazonaws.com/dev/blockstream';
  }

  return {
    entry: {
      index: './src/tab/index.tsx',
      background: './src/background/index.ts',
      wizard: './src/wizard/index.tsx',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
      publicPath: '',
      webassemblyModuleFilename: '[hash].module.wasm',
    },
    experiments: {
      asyncWebAssembly: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: true, // Skip type checking for faster builds
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            'postcss-loader',
          ],
        },
        {
          test: /\.wasm$/,
          type: 'webassembly/async',
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      fallback: {
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        'process/browser': require.resolve('process/browser'),
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/tab/index.html',
        filename: 'index.html',
        chunks: ['index'],
      }),
      new HtmlWebpackPlugin({
        template: './src/wizard/wizard.html',
        filename: 'wizard.html',
        chunks: ['wizard'],
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'manifest.json', to: 'manifest.json' },
          { from: 'src/assets', to: 'assets', noErrorOnMissing: true },
        ],
      }),
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      }),
      // Fix WASM loading for Chrome extension service workers
      new ChromeExtensionWasmPlugin(),
      // Inject environment variables
      new webpack.DefinePlugin({
        // Development-only variables (auto-fill password/mnemonic)
        'process.env.DEV_PASSWORD': JSON.stringify(isDevelopment ? devPassword : ''),
        'process.env.DEV_MNEMONIC': JSON.stringify(isDevelopment ? devMnemonic : ''),
        // Lambda proxy URL (works in both dev and production)
        'process.env.BLOCKSTREAM_PROXY_URL': JSON.stringify(blockstreamProxyUrl),
        // Node environment
        'process.env.NODE_ENV': JSON.stringify(isDevelopment ? 'development' : 'production'),
      }),
    ],
    devtool: isDevelopment ? 'inline-source-map' : false,
    optimization: {
      minimize: !isDevelopment,
    },
    performance: {
      hints: false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000,
    },
  };
};
