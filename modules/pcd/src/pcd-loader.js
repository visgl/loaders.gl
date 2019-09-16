import parsePCDSync from './lib/parse-pcd';

export default {
  name: 'PCD',
  extensions: ['pcd'],
  mimeType: 'text/plain', // TODO - can be both text and binary
  parse: parsePCDSync,
  parseSync: parsePCDSync
};
