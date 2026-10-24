import {version} from '../lerna.json';

// This constant will be inlined by babel plugin.
// To test source without transpilation, set a fallback here.
// @ts-ignore TS2339: Property does not exist on type 'Global'
window.__VERSION__ = version;
