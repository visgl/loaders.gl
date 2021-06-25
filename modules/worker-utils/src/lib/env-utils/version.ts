import {assert} from './assert';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
export const VERSION = __VERSION__;
assert(typeof VERSION !== 'undefined', 'VERSION not injected');
