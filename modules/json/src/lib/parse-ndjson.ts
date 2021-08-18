export default function parseNDJSONSync(ndjsonText: string) {
  try {
    const lines = ndjsonText.split('\n');
    return lines.map(JSON.parse);
  } catch (error) {
    throw new Error('NDJSONLoader: failed to parse NDJSON');
  }
}
