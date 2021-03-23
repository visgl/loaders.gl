import {concatenateChunksAsync, concatenateArrayBuffers} from '@loaders.gl/loader-utils';

export default async function loaderUtilsBench(suite) {
  const hundredMegabytes = new Array(100).fill(new ArrayBuffer(1e6));

  suite.group('@loaders.gl/loader-utils');

  const options = {multiplier: 0.1, unit: 'gigabytes'};

  suite.add('concatenateArrayBuffers(100x1MB chunks)', options, () => {
    concatenateArrayBuffers(...hundredMegabytes);
  });

  suite.addAsync('concatenateChunksAsync(100x1MB chunks)', options, async () => {
    // @ts-ignore
    await concatenateChunksAsync(hundredMegabytes);
  });

  if (typeof File !== 'undefined') {
    suite.add('new File(100x1MB chunks)', options, () => new File(hundredMegabytes, 'filename'));

    suite.add('new File(10x1MB TEXT chunks) SLOW!', {...options, multiplier: 0.01}, () => {
      let bigString = 'a';
      for (let i = 0; i < 20; ++i) {
        bigString += bigString;
      }

      const tenMegabytesText = new Array(10).fill(bigString);
      return new File(tenMegabytesText, 'filename');
    });
  }
}
