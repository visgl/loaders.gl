import {createWorker} from '@loaders.gl/loader-utils';

createWorker({
  name: 'TEST-1',
  extensions: ['test1'],
  parseTextSync: str => JSON.parse(str)
});
