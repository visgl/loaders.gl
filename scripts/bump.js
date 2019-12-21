#!/usr/bin/env node

const fs = require('fs');
const {resolve} = require('path');
const glob = require('glob');
const {execSync} = require('child_process');

const packageJsonFiles = glob.sync(resolve('**/package.json'), {ignore: '**/node_modules/**'});
console.log(packageJsonFiles);

function getVersions(packageName) {
  const versions = execSync(`npm v ${packageName} dist-tags --json`, {encoding: 'utf8'});
  return versions ? JSON.parse(versions) : null;
}

function getTargetVersion(packageAndVersion, moduleName) {
  const [, targetVersion] = packageAndVersion;
  let version = targetVersion;
  if (targetVersion === 'beta' || targetVersion === 'latest') {
    const versions = getVersions(moduleName);
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
    const modules = JSON.parse(execSync(`npm search ${packageName} --json`, {encoding: 'utf8'}));

    if (modules) {
      packages = packages.concat(modules.map(function (module) {
        const version = getTargetVersion(packageAndVersion, module.name);
        return {
          name: module.name,
          version
        };
      }));
    }
  }

  if (packages.length) {
    bumpPackages(packages);
  }
}

main();
