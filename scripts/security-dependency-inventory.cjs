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
const peerRequirements = new Set();
const results = [];
for (const [name, manifest] of modules) {
  for (const [peer, range] of Object.entries(manifest.data.peerDependencies || {})) {
    peerRequirements.add(`${peer}@${range}`);
  }
  const direct = Object.keys({...manifest.data.dependencies, ...manifest.data.optionalDependencies});
  const externalDirect = new Set(direct.filter(dependency => !modules.has(dependency)));
  const reached = new Map();
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
  const transitive = [...names].filter(dependency => !externalDirect.has(dependency)).length;
  results.push({name, direct: direct.length, transitive, total: names.size});
}

console.log(`Published modules: ${modules.size}`);
console.log(`Distinct external package names: ${new Set([...inventory].map(identity => identity.slice(0, identity.lastIndexOf('@')))).size}`);
console.log(`Distinct external name/version pairs: ${inventory.size}`);
console.log('\n| Module | Direct | External transitive only | External total |');
console.log('| --- | ---: | ---: | ---: |');
for (const result of results) {
  console.log(`| \`${result.name}\` | ${result.direct} | ${result.transitive} | ${result.total} |`);
}
console.log('\nExternal package versions:\n');
for (const identity of [...inventory].sort()) console.log(`- \`${identity}\``);
console.log('\nPeer requirements (not resolved or counted above):\n');
for (const peer of [...peerRequirements].sort()) console.log(`- \`${peer}\``);
console.log('\nUnresolved dependencies:\n');
if (!unresolved.size) console.log('- None');
for (const dependency of [...unresolved].sort()) console.log(`- \`${dependency}\``);
