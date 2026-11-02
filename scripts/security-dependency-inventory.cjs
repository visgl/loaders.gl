// Inventory runtime dependencies in the current Yarn node-modules installation.
// This deliberately excludes peer and development dependencies; see docs/security.md.
const fs = require('node:fs');
const path = require('node:path');
const {createRequire} = require('node:module');

const root = process.cwd();
const modules = new Map();
function collectModules(directory) {
  const file = path.join(directory, 'package.json');
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (data.name && !data.private) modules.set(data.name, {data, file});
    return;
  }
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
      collectModules(path.join(directory, entry.name));
    }
  }
}
collectModules(path.join(root, 'modules'));

const unresolved = new Set();
const inventory = new Set();
// Project membership does not imply a particular publishing configuration.
const visScopes = ['@loaders.gl/', '@math.gl/', '@luma.gl/', '@deck.gl/', '@vis.gl/'];
const visPackages = new Set(['probe.gl', 'mjolnir.js']);
const isVisDependency = name => visScopes.some(scope => name.startsWith(scope)) || visPackages.has(name);
const peerRequirements = new Set();
const results = [];
for (const [name, manifest] of modules) {
  for (const [peer, range] of Object.entries(manifest.data.peerDependencies || {})) {
    peerRequirements.add(`${peer}@${range}`);
  }
  const direct = Object.keys({...manifest.data.dependencies, ...manifest.data.optionalDependencies});
  const externalDirect = new Set(direct.filter(dependency => !modules.has(dependency)));
  const reached = new Map();
  const reachedLocal = new Set();
  const visited = new Set([manifest.file]);
  const queue = direct.map(dependency => [dependency, manifest.file]);
  while (queue.length) {
    const [dependency, parent] = queue.shift();
    let file = modules.get(dependency)?.file;
    if (!file) {
      for (const directory of createRequire(parent).resolve.paths(`${dependency}/`) || []) {
        if (!path.resolve(directory).startsWith(`${root}${path.sep}`)) continue;
        const candidate = path.join(directory, dependency, 'package.json');
        if (fs.existsSync(candidate)) {
          file = fs.realpathSync(candidate);
          break;
        }
      }
    }
    if (!file) {
      unresolved.add(`${dependency} (from ${path.relative(root, parent)})`);
      continue;
    }
    if (modules.has(dependency) && dependency !== name) reachedLocal.add(dependency);
    if (visited.has(file)) continue;
    visited.add(file);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!modules.has(dependency)) {
      const identity = `${data.name}@${data.version}`;
      reached.set(identity, data.name);
      inventory.add(identity);
    }
    for (const [peer, range] of Object.entries(data.peerDependencies || {})) {
      peerRequirements.add(`${peer}@${range}`);
    }
    for (const child of Object.keys({...data.dependencies, ...data.optionalDependencies})) {
      queue.push([child, file]);
    }
  }
  const names = new Set(reached.values());
  const vis = new Set([...reachedLocal, ...[...names].filter(isVisDependency)]);
  const nonVis = new Set([...names].filter(dependency => !isVisDependency(dependency)));
  const transitive = [...nonVis].filter(dependency => !externalDirect.has(dependency)).length;
  results.push({name, direct: direct.length, vis: vis.size, transitive, total: nonVis.size});
}

const inventoryName = identity => identity.slice(0, identity.lastIndexOf('@'));
const ecosystemInventory = [...inventory].filter(identity => isVisDependency(inventoryName(identity))).sort();
const thirdPartyInventory = [...inventory].filter(identity => !isVisDependency(inventoryName(identity))).sort();
console.log(`Published modules: ${modules.size}`);
console.log(`Installed vis.gl package names: ${new Set(ecosystemInventory.map(inventoryName)).size}`);
console.log(`Installed non-vis.gl package names: ${new Set(thirdPartyInventory.map(inventoryName)).size}`);
console.log(`Installed non-vis.gl name/version pairs: ${thirdPartyInventory.length}`);
console.log('\n| Module | Direct | vis.gl total | Non-vis.gl transitive only | Non-vis.gl total |');
console.log('| --- | ---: | ---: | ---: | ---: |');
for (const result of results) {
  console.log(`| \`${result.name}\` | ${result.direct} | ${result.vis} | ${result.transitive} | ${result.total} |`);
}
console.log('\nInstalled vis.gl package versions (outside the local modules):\n');
for (const identity of ecosystemInventory) console.log(`- \`${identity}\``);
console.log('\nInstalled non-vis.gl package versions:\n');
for (const identity of thirdPartyInventory) console.log(`- \`${identity}\``);
console.log('\nPeer requirements (not resolved or counted above):\n');
for (const peer of [...peerRequirements].sort()) console.log(`- \`${peer}\``);
console.log('\nUnresolved dependencies:\n');
if (!unresolved.size) console.log('- None');
for (const dependency of [...unresolved].sort()) console.log(`- \`${dependency}\``);
