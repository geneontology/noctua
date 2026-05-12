const fs = require('node:fs');
const path = require('node:path');
const webpack = require('webpack');
const glob = require('glob');
const webpackConfig = require('../webpack.config.js');

// Set up webpack output directory
const DEPLOY_DIR = path.join(__dirname, '../deploy');
if (!fs.existsSync(DEPLOY_DIR)) {
  fs.mkdirSync(DEPLOY_DIR, { recursive: true });
}

// Copy legacy browser-global libraries that are loaded by the templates outside
// the webpack bundles. These need to stay standalone so plugins attach to the
// same global jQuery/jsPlumb instances the browser page uses.
async function readyNonCommonjsLibs() {
  console.log('Copying non-commonjs libs...');
  const libs = {
    "jquery": "./node_modules/jquery/dist/jquery.min.js",
    "bootstrap": "./node_modules/bootstrap/dist/js/bootstrap.min.js",
    "jquery-ui": "./external_js/jquery-ui-1.10.3.custom.min.js",
    "jsplumb": "./external_js/jquery.jsPlumb-1.5.5.js",
    "tablesorter": "./external_js/jquery.tablesorter.min.js",
    "datatables": "./external_js/jquery.dataTables.min.js",
    "selectize": "./node_modules/selectize/dist/js/standalone/selectize.min.js",
    "toastr": "./node_modules/toastr/toastr.js",
    "connectors-sugiyama": "./js/connectors-sugiyama.js",
    "noctua-widgetry": "./js/lib/noctua-widgetry/widgetry.js",
    "bs-table": "./external_js/bs-table.min.js",
    "angular-animate": "./node_modules/angular-animate/angular-animate.min.js",
    "angular-xeditable": "./external_js/xeditable.min.js",
    "angular-toastr": "./node_modules/angular-toastr/dist/angular-toastr.min.js",
    "angular-toastr-tpls": "./node_modules/angular-toastr/dist/angular-toastr.tpls.min.js",
    "angular:": "./node_modules/angular/angular.min.js",
    "angular-sanitize": "./node_modules/angular-sanitize/angular-sanitize.min.js",
    "angular-ui-grid": "./node_modules/angular-ui-grid/ui-grid.js",
    "ui-select": "./node_modules/ui-select/dist/select.min.js"
  }
  for (const [key, val] of Object.entries(libs)) {
    if (val.startsWith('./')) {
      const srcPath = path.join(__dirname, '..', val);
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(DEPLOY_DIR, path.basename(val));
        console.log(`copy: ${key} (${val}) -> ${destPath}`);
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// Flatten dependency CSS into the output directory where existing templates expect to find it.
function copyCssFromNpmDeps() {
  console.log('Copying CSS from npm deps...');
  const files = glob.sync('node_modules/**/*.css', { nodir: true });
  files.forEach(file => {
    const destPath = path.join(DEPLOY_DIR, path.basename(file));
    fs.copyFileSync(path.join(__dirname, '..', file), destPath);
  });
}

const args = process.argv.slice(2);
const isWatch = args.includes('--watch');

// Run webpack once for production builds, or keep it open in development watch
// mode for the npm watch script.
async function runWebpack() {
  if (isWatch) {
    console.log('Running Webpack in watch mode...');
    const compiler = webpack({ ...webpackConfig, mode: 'development' });
    compiler.watch({}, (err, stats) => {
      if (err) {
        console.error(err);
        return;
      }
      console.log(stats.toString({
        chunks: false,
        colors: true
      }));
    });
    return Promise.resolve();
  }

  console.log('Running Webpack...');
  return new Promise((resolve, reject) => {
    webpack(webpackConfig, (err, stats) => {
      if (err || stats.hasErrors()) {
        if (err) {
          console.error(err);
        }
        if (stats) {
          console.error(stats.toString({
            chunks: false,
            colors: true
          }));
        }
        return reject(new Error('Webpack build failed'));
      }
      console.log(stats.toString({
        chunks: false,
        colors: true
      }));
      resolve();
    });
  });
}

// Remove generated files before rebuilding, while preserving the output
// directory's checked-in README.
async function clean() {
  console.log('Cleaning deploy directory...');
  const files = glob.sync('deploy/**/*', { nodir: true });
  files.forEach(file => {
    if (!file.endsWith('README.org')) {
      fs.unlinkSync(file);
    }
  });
}

// Sequential build order: clean, copy browser-global assets, copy CSS,
// then compile the webpack entry points into deploy.
async function main() {
  await clean();
  await readyNonCommonjsLibs();
  copyCssFromNpmDeps();

  try {
    await runWebpack();
  } catch (e) {
    console.error('Failed to run Webpack:', e);
    process.exit(1);
  }
}

main().catch(console.error);
