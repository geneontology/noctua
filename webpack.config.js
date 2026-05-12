const path = require('path');
const webpack = require('webpack');

module.exports = {
  // Build deployable bundles by default; scripts/build.js overrides this to
  // development mode for watch builds.
  mode: 'production',

  // Map the desired output filename to the source entry point. Each entry emits a separate bundle.
  entry: {
    'NoctuaEditor.js': './js/NoctuaEditor.js',
    'NoctuaLanding.js': './js/NoctuaLanding.js',
  },

  // Keep the [name] path segments so entries emit as deploy/*.
  output: {
    path: path.resolve(__dirname, 'deploy'),
    filename: '[name]',
  },

  // Recreate the browser-field and shim mappings in webpack.
  resolve: {
    alias: {
      // These aliases force imports to use the browser-ready files that were
      // formerly copied or shimmed by the build.
      'bootstrap': path.resolve(__dirname, 'node_modules/bootstrap/dist/js/bootstrap.min.js'),
      'jquery-ui': path.resolve(__dirname, 'external_js/jquery-ui-1.10.3.custom.min.js'),
      'tablesorter': path.resolve(__dirname, 'external_js/jquery.tablesorter.min.js'),
      'datatables': path.resolve(__dirname, 'external_js/jquery.dataTables.min.js'),
      'selectize': path.resolve(__dirname, 'node_modules/selectize/dist/js/standalone/selectize.min.js'),
      'toastr': path.resolve(__dirname, 'node_modules/toastr/toastr.js'),
      'connectors-sugiyama': path.resolve(__dirname, 'js/connectors-sugiyama.js'),
      'noctua-widgetry': path.resolve(__dirname, 'js/lib/noctua-widgetry/widgetry.js'),
      'bs-table': path.resolve(__dirname, 'external_js/bs-table.min.js'),
      'angular-animate': path.resolve(__dirname, 'node_modules/angular-animate/angular-animate.min.js'),
      'angular-xeditable': path.resolve(__dirname, 'external_js/xeditable.min.js'),
      'angular-toastr': path.resolve(__dirname, 'node_modules/angular-toastr/dist/angular-toastr.min.js'),
      'angular-toastr-tpls': path.resolve(__dirname, 'node_modules/angular-toastr/dist/angular-toastr.tpls.min.js'),
      'angular': path.resolve(__dirname, 'node_modules/angular/angular.min.js'),
      'angular-sanitize': path.resolve(__dirname, 'node_modules/angular-sanitize/angular-sanitize.min.js'),
      'angular-ui-grid': path.resolve(__dirname, 'node_modules/angular-ui-grid/ui-grid.js'),
      'ui-select': path.resolve(__dirname, 'node_modules/ui-select/dist/select.min.js'),
    },
    extensions: ['.js', '.json'],

    // Some shared bbop-era modules contain server-only requires. The browser
    // bundles do not need those modules, so mark them unavailable instead of
    // pulling in large polyfills.
    fallback: {
      "ringo/httpclient": false,
      "http": false,
      "https": false,
      "url": false,
      "path": false,
      "fs": false,
      "util": false,
      "stream": false,
      "buffer": false,
      "querystring": false,
      "zlib": false,
      "os": false,
      "crypto": false
    }
  },

  // Treat page-level globals as externals so webpack reuses the same instances
  // loaded from deploy/*.js before the bundles.
  externals: {
    // noctua.js loads these legacy globals before the webpack bundles.
    // Keep require('jquery') aligned with the instance extended by Bootstrap,
    // jQuery UI, and other page-level plugins.
    jquery: 'jQuery',
    // Bundling jsPlumb causes its legacy CommonJS/AMD export path to run before
    // AnchorManager is attached.
    jsplumb: 'jsPlumb',
  },

  // Wrap legacy global-oriented libraries so their jQuery plugin code attaches to
  // the external jQuery object.
  module: {
    rules: [
      {
        test: /jquery-ui|datatables/,
        use: 'imports-loader?wrapper=window&additionalCode=var%20jQuery=require("jquery");',
      },
    ],
  },

  // Provide jQuery names for modules that expect browser globals during module
  // evaluation.
  plugins: [
    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
      'window.jQuery': 'jquery',
    }),
  ],

  // Keep production output minimized.
  optimization: {
    minimize: true,
  },
};
