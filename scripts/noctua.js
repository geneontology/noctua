const { spawn } = require('node:child_process');
const { getValue, ensureNoSlash } = require('./lib/config');

// Public lookup URLs are passed with trailing slashes because noctua.js expects
// them in that form.
const golrLookupUrl = ensureNoSlash(getValue('GOLR_LOOKUP_URL', '')) + '/';
const golrNeoLookupUrl = ensureNoSlash(getValue('GOLR_NEO_LOOKUP_URL', '')) + '/';
const baristaLookupUrl = getValue('BARISTA_LOOKUP_URL');
const noctuaContext = getValue('NOCTUA_CONTEXT', 'go');
const noctuaLookupUrl = getValue('NOCTUA_LOOKUP_URL');
const noctuaLocation = getValue('NOCTUA_LOCATION');
const defAppDef = getValue('DEFAULT_APP_DEFINITION');

// noctua.js expects several startup.yaml arrays as space-delimited CLI strings.
const workbenchDirsStr = (getValue('WORKBENCHES', [])).join(' ');
const collapsibleRelationsStr = (getValue('COLLAPSIBLE_RELATIONS', [])).join(' ');
const collapsibleReverseRelationsStr = (getValue('COLLAPSIBLE_REVERSE_RELATIONS', [])).join(' ');
const externalBrowserLocation = getValue('EXTERNAL_BROWSER_LOCATION');

// GitHub integration is optional and only enabled when all three values exist.
const githubApi = getValue('GITHUB_API');
const githubOrg = getValue('GITHUB_ORG');
const githubRepo = getValue('GITHUB_REPO');

// Assemble the noctua.js command from startup.yaml. List-like values
// are quoted because the downstream CLI parses them as one string argument.
const args = [
  'noctua.js',
  '--golr', golrLookupUrl,
  '--golr-neo', golrNeoLookupUrl,
  '--barista', baristaLookupUrl,
  '--noctua-context', noctuaContext,
  '--noctua-public', noctuaLookupUrl,
  '--noctua-self', noctuaLocation,
  '--minerva-definition', defAppDef,
  '--workbenches', `"${workbenchDirsStr}"`
];

// Include optional relation/browser switches only when configured.
if (collapsibleRelationsStr) {
  args.push('--collapsible-relations');
  args.push(`"${collapsibleRelationsStr}"`);
}
if (collapsibleReverseRelationsStr) {
  args.push('--collapsible-reverse-relations');
  args.push(`"${collapsibleReverseRelationsStr}"`);
}
if (externalBrowserLocation) {
  args.push('--external-browser-location');
  args.push(`"${externalBrowserLocation}"`);
}
if (githubApi && githubOrg && githubRepo) {
  args.push('--github-api');
  args.push(githubApi);
  args.push('--github-org');
  args.push(githubOrg);
  args.push('--github-repo');
  args.push(githubRepo);
}

// Keep shell execution for compatibility with the quoted list arguments above.
console.log(`Executing: node ${args.join(' ')}`);
const proc = spawn('node', args, { stdio: 'inherit', shell: true });
proc.on('exit', (code) => {
  process.exit(code);
});
