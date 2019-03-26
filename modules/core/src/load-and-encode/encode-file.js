export function encodeFile(data, writer, options, url) {
  if (writer.encode) {
    return writer.encode(data, options);
  }
  if (writer.encodeSync) {
    return Promise.resolve(writer.encodeSync(data, options));
  }
  // TODO - handle encodeStream?
  throw new Error('Writer could not encode data');
}

export function encodeFileSync(data, writer, options, url) {
  if (writer.encodeSync) {
    return Promise.resolve(writer.encodeSync(data, options));
  }
  throw new Error('Writer could not synchronously encode data');
}

export function encodeToStream(data, writer, options, url) {
  if (writer.encodeToStream) {
    return writer.encodeToStream(data, options);
  }
  throw new Error('Writer could not encode data to stream');
}
