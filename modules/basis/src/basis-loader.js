/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

const EXTENSIONS = ['basis'];

export const BasisLoader = {
  id: 'basis',
  name: 'Basis',
  version: VERSION,
  extensions: EXTENSIONS,
  parse: data => 'not implemented yet'
};
