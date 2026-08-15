import {register} from 'node:module';

register('../test/utils/bench-loader.mjs', import.meta.url);

await import('../test/bench/node.js');
