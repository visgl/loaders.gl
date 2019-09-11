import {createWorker} from '../../../loader-utils/src';

createWorker({
  name: 'TEST-JSON-LOADER',
  extensions: ['json'],
  parseTextSync: str => {
    console.log('TEST-JSON-LOADER:processing'); // eslint-disable-line
    return JSON.parse(str);
  }
});
