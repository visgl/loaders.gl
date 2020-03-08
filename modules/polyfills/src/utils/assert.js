export default function assert(condition, message) {
  if (!condition) {
    throw new Error(`@loaders.gl/polyfills assertion ${message}`);
  }
}
