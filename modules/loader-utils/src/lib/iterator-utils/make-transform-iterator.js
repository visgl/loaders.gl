export async function* makeTransformIterator(asyncIterator, IncrementalTransform, options) {
  const transform = new IncrementalTransform(options);
  for await (const chunk of asyncIterator) {
    const output = await transform.write(chunk);
    if (output) {
      yield output;
    }
  }
  const output = await transform.end();
  if (output) {
    yield output;
  }
}
