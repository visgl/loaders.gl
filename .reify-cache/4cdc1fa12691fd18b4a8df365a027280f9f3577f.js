"use strict";module.export({encode:()=>encode,encodeSync:()=>encodeSync,encodeInBatches:()=>encodeInBatches});function encode(data, writer, options, url) {
  if (writer.encode) {
    return writer.encode(data, options);
  }
  if (writer.encodeSync) {
    return Promise.resolve(writer.encodeSync(data, options));
  }
  // TODO - Use encodeToBatches?
  throw new Error('Writer could not encode data');
}

function encodeSync(data, writer, options, url) {
  if (writer.encodeSync) {
    return writer.encodeSync(data, options);
  }
  throw new Error('Writer could not synchronously encode data');
}

function encodeInBatches(data, writer, options, url) {
  if (writer.encodeInBatches) {
    return writer.encodeInBatches(data, options);
  }
  // TODO -fall back to atomic encode?
  throw new Error('Writer could not encode data in batches');
}
