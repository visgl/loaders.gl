const LENGTH = 1e3;
const ARRAY = new Array(LENGTH).fill(0);

// TODO - Async benchmarks pending probe.gl update
async function* asyncIterator(array) {
  for (const element of array) {
    yield Promise.resolve(element);
  }
}

export default function coreBench(bench) {
  bench.group('Core Module - Async Iteration');

  bench.add('Sync Iteration', {multiplier: LENGTH}, () => {
    let sum = 0;
    for (const element of ARRAY) {
      sum += element;
    }
    return sum;
  });

  bench.addAsync('Async Iteration', {multiplier: LENGTH}, async () => {
    let sum = 0;
    for await (const element of asyncIterator(ARRAY)) {
      sum += element;
    }
    return sum;
  });
}
