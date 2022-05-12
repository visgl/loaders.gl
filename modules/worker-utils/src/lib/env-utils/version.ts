// Version constant cannot be imported, it needs to correspond to the build version of **this** module.
// __VERSION__ is injected by babel-plugin-version-inline

// Change to `latest` on production branches
const DEFAULT_VERSION = 'latest';
declare let __VERSION__: string;
export const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : DEFAULT_VERSION;
if (typeof __VERSION__ === 'undefined') {
  // eslint-disable-next-line
  console.error(
    'loaders.gl: The __VERSION__ variable is not injected using babel plugin. Latest unstable workers would be fetched from the CDN.'
  );
}
