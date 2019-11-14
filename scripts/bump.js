const fs = require('fs');
const {resolve} = require('path');
const glob = require('glob');
const {execSync} = require('child_process');

const PACKAGES = {
  'deck.gl': [
    'deck.gl',
    '@deck.gl/aggregation-layers',
    '@deck.gl/core',
    '@deck.gl/extensions',
    '@deck.gl/geo-layers',
    '@deck.gl/google-maps',
    '@deck.gl/json',
    '@deck.gl/jupyter-widget',
    '@deck.gl/layers',
    '@deck.gl/mapbox',
    '@deck.gl/mesh-layers',
    '@deck.gl/react',
    '@deck.gl/test-utils'
  ],
  'luma.gl': [
    'luma.gl',
    '@luma.gl/addons',
    '@luma.gl/constants',
    '@luma.gl/core',
    '@luma.gl/debug',
    '@luma.gl/effects',
    '@luma.gl/glfx',
    '@luma.gl/gpgpu',
    '@luma.gl/shadertools',
    '@luma.gl/test-utils',
    '@luma.gl/webgl-state-tracker',
    '@luma.gl/webgl',
    '@luma.gl/webgl2-polyfill'
  ],
  'loaders.gl': [
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
  'math.gl': [
    'math.gl',
    '@math.gl/core',
    '@math.gl/culling',
    '@math.gl/geospatial',
    '@math.gl/sun',
    'viewport-mercator-project'
  ],
  'probe.gl': [
    'probe.gl',
    '@probe.gl/bench',
    '@probe.gl/stats-widget',
    '@probe.gl/test-utils'
  ]
};

const packageJsonFiles = glob.sync(resolve('**/package.json'), {ignore: '**/node_modules/**'});
console.log(packageJsonFiles);

function getVersions(packageName) {
  let versions;
  switch (packageName) {
  case 'deck.gl':
    versions = execSync('npm v @deck.gl/core dist-tags --json', {encoding: 'utf8'});
    break;
  case 'luma.gl':
    versions = execSync('npm v @luma.gl/core dist-tags --json', {encoding: 'utf8'});
    break;
  case 'loaders.gl':
    versions = execSync('npm v @loaders.gl/core dist-tags --json', {encoding: 'utf8'});
    break;
  case 'math.gl':
    versions = execSync('npm v math.gl dist-tags --json', {encoding: 'utf8'});
    break;
  case 'probe.gl':
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
  for (const file of packageJsonFiles) {
    let changed = false;
    let content = JSON.parse(fs.readFileSync(file, 'utf8'));
    const dependencies = content.dependencies || {};
    const devDependencies = content.devDependencies || {};

    for (const p of packages) {
      if (dependencies[p.name]) {
        dependencies[p.name] = `^${p.version}`;
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

    if (PACKAGES[packageName]) {
      packages = packages.concat(PACKAGES[packageName].map(function (p) {
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
