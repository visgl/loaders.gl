/* eslint-disable @typescript-eslint/no-var-requires */
import test from 'tape';
import {version} from '../lerna.json';

// @ts-ignore TS2339: Property does not exist on type 'Window & typeof globalThis'.
test.onFinish(window.browserTestDriver_finish);
// @ts-ignore TS2339: Property does not exist on type 'Window & typeof globalThis'.
test.onFailure(window.browserTestDriver_fail);

// This constant will be inlined by babel plugin.
// To test source without transpilation, set a fallback here.
// @ts-ignore TS2339: Property does not exist on type 'Global'
window.__VERSION__ = version;
