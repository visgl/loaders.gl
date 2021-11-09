// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const version = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '';

// @ts-ignore
globalThis.loaders = Object.assign(globalThis.loaders || {}, {
  VERSION: version
});

// @ts-ignore
export default globalThis.loaders;
