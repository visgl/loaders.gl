const LENGTH = 10000;
const ARRAY = new Array(LENGTH).fill(0);

// TODO - Async benchmarks pending probe.gl update
// async function *asyncIterator(array) {
//   for (const element of array) {
//     yield Promise.resolve(element);
//   }
// }

export default function coreBench(bench) {
  return bench.group('Core Module - Async Iteration').add('Normal Iteration 10K', () => {
    let sum = 0;
    for (const element of ARRAY) {
      sum += element;
    }
    return sum;
  });
  // .addAsync('Async Iteration 10K', async () => {
  //   let sum = 0;
  //   for await (const element of asyncIterator(ARRAY)) {
  //     sum += element;
  //   }
  //   return sum;
  // });
}
