/* global TextDecoder */
import {default as parseEPTHierarchySync} from './parsers/parse-ept-hierarchy';

export default {
  name: 'EPT Hierarchy Chunk',
  extensions: ['json'],
  mimeType: 'application/json',
  test: text => text.indexOf('0-0-0-0') >= 0,
  parse: async arrayBuffer => parseEPTHierarchySync(JSON.parse(TextDecoder().decode(arrayBuffer)))
};
