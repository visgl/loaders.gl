export default function parseNDJSONSync(ndjsonText: string) {
  const lines = ndjsonText.trim().split('\n');
  return lines.map((line, counter) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`NDJSONLoader: failed to parse JSON on line ${counter + 1}`);
    }
  });
}
