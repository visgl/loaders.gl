export default function parseJSONSync(jsonText, options) {
  try {
    const json = JSON.parse(jsonText);
    if (options.json.table) {
      return getFirstArray(json) || json;
    }
    return json;
  } catch (error) {
    throw new Error('JSONLoader: failed to parse JSON');
  }
}

function getFirstArray(json) {
  if (Array.isArray(json)) {
    return json;
  }
  if (json && typeof json === 'object') {
    for (const value of Object.values(json)) {
      const array = getFirstArray(value);
      if (array) {
        return array;
      }
    }
  }
  return null;
}
