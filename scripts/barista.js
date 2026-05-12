const { spawn } = require('node:child_process');
const { getValue } = require('./lib/config');

// Pull Barista's runtime settings from startup.yaml.
const userData = getValue('USER_DATA');
const groupData = getValue('GROUP_DATA');
const baristaLocation = getValue('BARISTA_LOCATION');
const loginSecretsDir = getValue('BARISTA_LOGIN_SECRETS');
const noctuaContext = getValue('NOCTUA_CONTEXT', 'go');
const baristaDefaultNamespace = getValue('BARISTA_DEFAULT_NAMESPACE');
const baristaReplPort = getValue('BARISTA_REPL_PORT');

// Build the Barista CLI invocation with auth files, service URL, namespace,
// and REPL port supplied by the active startup.yaml.
const args = [
  'barista.js',
  '--debug', '0',
  '--users', userData,
  '--groups', groupData,
  '--self', baristaLocation,
  '--secrets', loginSecretsDir,
  '--context', noctuaContext,
  '--default-namespace', baristaDefaultNamespace,
  '--repl', baristaReplPort
];

// Inherit stdio so supervisor/local logs contain the child process output.
console.log(`Executing: node ${args.join(' ')}`);
const proc = spawn('node', args, { stdio: 'inherit', shell: true });
proc.on('exit', (code) => {
  process.exit(code);
});
