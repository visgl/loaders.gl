/* global TextDecoder */
import {default as parseEPTSync} from './parsers/parse-potree-hierarchy-chunk';

export default {
  name: 'Entwine Point Tile',
  extensions: ['json'],
  mimeType: 'application/json',
  testText: text => text.indexOf('schema') >= 0,
  parse: async arrayBuffer => parseEPTSync(JSON.parse(TextDecoder().decode(arrayBuffer)))
};
