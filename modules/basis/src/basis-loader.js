/* global __VERSION__ */ // __VERSION__ is injected by babel-plugin-version-inline
const EXTENSIONS = ['basis'];

export const BasisLoader = {
  id: 'basis',
  name: 'Basis',
  version: __VERSION__,
  extensions: EXTENSIONS,
  parse: data => 'not implemented yet'
};
