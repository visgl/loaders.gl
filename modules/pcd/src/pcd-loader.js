import parsePCD from './parse-pcd';

export default {
  name: 'PCD',
  extensions: ['pcd'],
  parseSync: parsePCD
};
