import {_ClarinetParser} from '@loaders.gl/json';

const loadJSON = async (relativePath) => {
  const url = new URL(relativePath, import.meta.url);
  if (url.protocol === 'file:' && typeof window === 'undefined') {
    const {readFile} = await import('fs/promises');
    return JSON.parse(await readFile(url, 'utf8'));
  }
  const response = await fetch(url);
  return response.json();
};

const BASIC = await loadJSON('../../data/clarinet/basic.json');

export default function clarinetBench(bench) {
  const STRING = JSON.stringify(BASIC);

  const parser = new _ClarinetParser();

  bench.group('Clarinet - JSON parsing from string');

  bench.add('ClarinetParser', {multiplier: STRING.length, unit: 'bytes'}, () => {
    parser.write(STRING);
  });

  bench.add('JSON.parse', {multiplier: STRING.length, unit: 'bytes'}, () => {
    JSON.parse(STRING);
  });
}
