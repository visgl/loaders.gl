// Version constant cannot be imported, it needs to correspond to the build version of **this** module.
// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
export const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';
