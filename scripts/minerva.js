const { spawn } = require('node:child_process');
const { getValue, tildeExpandList, ensureNoSlash } = require('./lib/config');
const fs = require('node:fs');

const args = process.argv.slice(2);

// Run the Java commands assembled from startup.yaml while inheriting stdio so
// Minerva logs are visible in the console.
function runCommand(cmd, args) {
  console.log(`Executing: ${cmd} ${args.join(' ')}`);
  const proc = spawn(cmd, args, { stdio: 'inherit', shell: true });
  proc.on('exit', (code) => {
    if (code !== 0) {
      process.exit(code);
    }
  });
}

// Translate the Minerva-related startup.yaml values into CLI options.
const minervaMaxMem = getValue('MINERVA_MAX_MEMORY', 4);
const minervaJar = getValue('MINERVA_JAR');
const minervaReasoner = getValue('MINERVA_REASONER', 'slme-elk');
const minervaOntologyJournal = getValue('MINERVA_ONTOLOGY_JOURNAL');
const minervaLocation = getValue('MINERVA_LOCATION');

// Minerva wants the port as a separate argument, while startup.yaml stores the
// full service URL.
let minervaPort = 6800;
if (minervaLocation) {
  try {
    const url = new URL(minervaLocation);
    minervaPort = url.port || 80;
  } catch (e) {
    console.warn('Could not parse MINERVA_LOCATION, using default port 6800');
  }
}
const noctuaStore = getValue('NOCTUA_STORE');
const noctuaModels = getValue('NOCTUA_MODELS');
const ontologyList = tildeExpandList(getValue('ONTOLOGY_LIST', []));

const golrLookupUrl = ensureNoSlash(getValue('GOLR_LOOKUP_URL', ''));
const golrNeoLookupUrl = ensureNoSlash(getValue('GOLR_NEO_LOOKUP_URL', ''));

// Determine the reasoner flag based on the configuration.
function getReasonerFlag() {
  if (minervaReasoner === 'arachne') return '--arachne';
  if (minervaReasoner === 'slme-elk') return '--slme-elk';
  return '';
}

// Options shared by the normal Minerva server modes.
const baseOpts = [
  `-Xmx${minervaMaxMem}G`,
  '-cp', minervaJar,
  'org.geneontology.minerva.server.StartUpTool',
  '--use-golr-url-logging',
  '--use-request-logging',
  getReasonerFlag(),
  '-g', ontologyList.join(','),
  '--set-important-relation-parent', 'http://purl.obolibrary.org/obo/LEGOREL_0000000',
  '--port', minervaPort,
  '--ontojournal', minervaOntologyJournal,
  '-f', noctuaStore,
  '--export-folder', noctuaModels
].filter(Boolean);

// Lookup options are omitted only by no-lookup modes, which are not
// exposed as npm scripts yet.
const lookupOpts = [
  '--golr-labels', golrNeoLookupUrl,
  '--golr-seed', golrLookupUrl
];

if (args.includes('--batch-destroy')) {
  // The replacement for batch-minerva-destroy-journal removes the Blazegraph
  // journal directly instead of shelling out to rm.
  console.log(`Destroying journal: ${noctuaStore}`);
  if (fs.existsSync(noctuaStore)) {
    fs.unlinkSync(noctuaStore);
  }
} else if (args.includes('--batch-create')) {
  // Build a new journal from the configured model export directory.
  runCommand('java', [
    `-Xmx${minervaMaxMem}G`,
    '-jar', minervaJar,
    '--import-owl-models',
    '-j', noctuaStore,
    '-f', noctuaModels
  ]);
} else if (args.includes('--no-validation')) {
  // Start the server with lookup enabled but class-id validation disabled.
  runCommand('java', [...baseOpts, ...lookupOpts, '--skip-class-id-validation']);
} else {
  // Default run-minerva mode: lookup and validation both enabled.
  runCommand('java', [...baseOpts, ...lookupOpts]);
}
