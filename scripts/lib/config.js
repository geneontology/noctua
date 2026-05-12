const yaml = require('yamljs');
const path = require('node:path');
const tilde = require('expand-home-dir');

const CONF_FILE = path.join(__dirname, '../../startup.yaml');

// Load configuration once at startup so missing or malformed config fails before
// any child process is spawned.
function loadConfig() {
  try {
    return yaml.load(CONF_FILE);
  } catch (e) {
    console.error(`Could not find "${CONF_FILE}", look in ./config for examples.`);
    process.exit(-1);
  }
}

const config = loadConfig();

// startup.yaml stores each setting under a { value } wrapper. This helper hides
// that shape and supplies defaults for optional settings.
function getValue(key, defaultValue = null) {
  return (config[key] && config[key].value !== undefined) ? config[key].value : defaultValue;
}

// Minerva accepts comma-separated ontology paths, so expand each path before the
// caller joins the list.
function tildeExpandList(list) {
  return (list || []).map(ufile => tilde(ufile));
}

// Normalize URL-like config values before appending path separators in callers.
function ensureNoSlash(s) {
  if (!s) return '';
  return s.replace(/\/$/, '');
}

module.exports = {
  getValue,
  tildeExpandList,
  ensureNoSlash,
  configRaw: config
};
