export default function parseNDJSONSync(ndjsonText: string) {
  try {
    const lines = ndjsonText.trim().split('\n');
    return lines.map((line) => JSON.parse(line));
  } catch (error) {
    throw new Error('NDJSONLoader: failed to parse NDJSON');
  }
}
