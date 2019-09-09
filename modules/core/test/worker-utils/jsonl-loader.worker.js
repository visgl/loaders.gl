/* global self */
import {createWorker} from '../../../loader-utils/src';

createWorker({
  name: 'TEST-JSONL_LOADER',
  extensions: ['jsonl'],
  parse: async (arrayBuffer, options) => {
    const characters = new Uint8Array(arrayBuffer);
    const result = [];

    const len = characters.length;
    let startIndex = 0;
    for (let i = 0; i <= len; i++) {
      if (characters[i] === 10 || i === len) {
        // Note: we need to make a copy of the buffer here because we cannot
        // handover the ownership of arrayBuffer to the child process
        const json = characters.slice(startIndex, i);
        if (json.length > 1) {
          result.push(await self.parse(json.buffer, {}, 'line.json'));
        }
        startIndex = i + 1;
      }
    }

    return result;
  }
});
