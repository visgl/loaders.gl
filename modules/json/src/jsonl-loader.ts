/* TODO JSONL loader
export const JSONLoader: LoaderWithParser = {
  name: 'JSON',
  id: 'json',
  module: 'json',
  version: VERSION,
  extensions: ['json', 'geojson'],
  mimeTypes: ['application/json'],
  // TODO - support various line based JSON formats
  /*
  extensions: {
    json: null,
    jsonl: {stream: true},
    ndjson: {stream: true}
  },
  mimeTypes: {
    'application/json': null,
    'application/json-seq': {stream: true},
    'application/x-ndjson': {stream: true}
  },
  *
  category: 'table',
  text: true,
  parse,
  parseTextSync,
  parseInBatches,
  options: DEFAULT_JSON_LOADER_OPTIONS
};
{
  name: 'TEST-JSONL_LOADER',
  extensions: ['jsonl'],
  parse: async (arrayBuffer, options, context) => {
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
          result.push(await context.parse(json.buffer, {}, 'line.json'));
        }
        startIndex = i + 1;
      }
    }

    return result;
  }
};
*/
