/**
 * peerDependencies are excluded using `externals`
 * https://webpack.js.org/configuration/externals/
 * e.g. @deck.gl/core is not bundled with @deck.gl/geolayers
 * @param {{peerDependencies: any, browser: any}} packageInfo
 */
module.exports.getExternals = function getExternals(packageInfo) {
  /** @type {Record<string, string>} */
  const externals = {
    // Hard coded externals
  };

  const {peerDependencies = {}, browser} = packageInfo;

  Object.assign(externals, browser);

  for (const depName in peerDependencies) {
    if (depName.startsWith('@loaders.gl')) {
      // Instead of bundling the dependency, import from the global `deck` object
      externals[depName] = 'loaders';
    }
  }

  return externals;
}
