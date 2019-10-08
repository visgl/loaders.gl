const fs = require('fs');
const path = require('path');
const glob = require('glob').Glob;
const {execSync} = require('child_process');

const INTERNAL = {
  deck: [
    '@deck.gl/aggregation-layers',
    '@deck.gl/core',
    '@deck.gl/extensions',
    '@deck.gl/geo-layers',
    '@deck.gl/google-maps',
    '@deck.gl/json',
    '@deck.gl/jupyter-widget',
    '@deck.gl/json',
    '@deck.gl/layers',
    '@deck.gl/main',
    '@deck.gl/mapbox',
    '@deck.gl/mesh-layers',
    '@deck.gl/react'
  ],
  luma: [
    '@luma.gl/addons',
    '@luma.gl/constants',
    '@luma.gl/core',
    '@luma.gl/debug',
    '@luma.gl/effects',
    '@luma.gl/glfx',
    '@luma.gl/gpgpu',
    '@luma.gl/main',
    '@luma.gl/script',
    '@luma.gl/shadertools',
    '@luma.gl/webgl',
    '@luma.gl/webgl-state-tracker',
    '@luma.gl/webgl2-polyfill'
  ],
  loaders: [
    '@loaders.gl/3d-tiles',
    '@loaders.gl/arrow',
    '@loaders.gl/basis',
    '@loaders.gl/core',
    '@loaders.gl/csv',
    '@loaders.gl/draco',
    '@loaders.gl/experimental',
    '@loaders.gl/gltf',
    '@loaders.gl/images',
    '@loaders.gl/kml',
    '@loaders.gl/las',
    '@loaders.gl/loader-utils',
    '@loaders.gl/math',
    '@loaders.gl/obj',
    '@loaders.gl/pcd',
    '@loaders.gl/ply',
    '@loaders.gl/polyfills',
    '@loaders.gl/potree',
    '@loaders.gl/zip'
  ],
  math: [
    'math.gl',
    '@math.gl/culling',
    '@math.gl/geospatial',
    '@math.gl/main',
    '@math.gl/sun'
  ],
  probe: [
    'probe.gl',
    '@probe.gl/bench',
    '@probe.gl/stats-widget',
    '@probe.gl/test-utils'
  ]
};

function getPackageJsonFiles(pattern) {
  switch (pattern) {
  case 'modules':
    return glob('./modules/*/package.json', {sync: true}).found;
  case 'examples':
    return glob('./examples/*/*/package.json', {sync: true}).found;
  default:
    return glob(pattern, {sync: true}).found;
  }
}

// root and website
let packageJsonFiles = [
  path.resolve('./package.json'),
  path.resolve('./website/package.json')
];

// modules
const modulesPackageFiles = getPackageJsonFiles('modules');
const examplePackageFiles = getPackageJsonFiles('examples');
packageJsonFiles = packageJsonFiles.concat(modulesPackageFiles, examplePackageFiles);
console.log(packageJsonFiles);

function getVersions(packageName) {
  let versions;
  switch (packageName) {
  case 'deck':
    versions = execSync('npm v @deck.gl/core dist-tags --json', {encoding: 'utf8'});
    break;
  case 'luma':
    versions = execSync('npm v @luma.gl/core dist-tags --json', {encoding: 'utf8'});
    break;
  case 'loaders':
    versions = execSync('npm v @loaders.gl/core dist-tags --json', {encoding: 'utf8'});
    break;
  case 'math':
    versions = execSync('npm v math.gl dist-tags --json', {encoding: 'utf8'});
    break;
  case 'probe':
    versions = execSync('npm v probe.gl dist-tags --json', {encoding: 'utf8'});
    break;
  default:
    versions = execSync(`npm v ${packageName} dist-tags`, {encoding: 'utf8'});
  }

  return versions ? JSON.parse(versions) : null;
}

function getTargetVersion(packageAndVersion) {
  const [packageName, targetVersion] = packageAndVersion;
  let version = targetVersion;
  if (targetVersion === 'beta' || targetVersion === 'latest') {
    const versions = getVersions(packageName);
    version = versions && versions[targetVersion];
  }
  return version;
}

function bumpPackages(packages) {
  let changed = false;
  for (const file of packageJsonFiles) {
    let content = JSON.parse(fs.readFileSync(file, 'utf8'));
    const dependencies = content.dependencies || {};
    const devDependencies = content.devDependencies || {};

    for (const p of packages) {
      if (dependencies[p.name]) {
        dependencies[p.name] = p.version;
        changed = true;
      }
      if (devDependencies[p.name]) {
        devDependencies[p.name] = `^${p.version}`;
        changed = true;
      }
    }

    if (changed) {
      content = JSON.stringify(content, null, 2);
      fs.writeFileSync(file, `${content}\n`);
    }
  }
}

function main() {
  let packages = [];
  const args = process.argv;
  if (!args || args.length < 3) {
    console.error('Should provide at lease one package.');
    return;
  }

  const argLen = args.length;
  for (let i = 2; i < argLen; i++) {
    const packageAndVersion = args[i].split('=');
    if (!packageAndVersion) {
      console.error('Should use format "yarn bump package" or "yarn bump package=target_version".');
      return;
    }

    // default to latest version
    if (packageAndVersion.length === 1) {
      packageAndVersion.push('latest');
    }

    const [packageName] = packageAndVersion;
    const targetVersion = getTargetVersion(packageAndVersion);

    if (INTERNAL[packageName]) {
      packages = packages.concat(INTERNAL[packageName].map(function (p) {
        return {
          name: p,
          version: targetVersion
        };
      }));
    } else {
      packages.push({
        name: packageName,
        version: targetVersion
      });
    }
  }

  bumpPackages(packages);
}

main();
