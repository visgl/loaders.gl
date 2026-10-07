// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as internal from '../src/lib/fflate/index';
import * as upstream from 'fflate';

/** Registers hermetic, verified internal-versus-upstream compression baselines. */
export default function compressionBench(bench) {
  const input = new TextEncoder().encode('loaders.gl compression benchmark row,42\n'.repeat(4096));
  const options = {level: 6 as const, mtime: 0};
  for (const format of ['gzip', 'zlib', 'deflate'] as const) {
    const encode = format === 'gzip' ? 'gzipSync' : format === 'zlib' ? 'zlibSync' : 'deflateSync';
    const decode =
      format === 'gzip' ? 'gunzipSync' : format === 'zlib' ? 'unzlibSync' : 'inflateSync';
    const compressed = upstream[encode](input, options);
    bench.group(`Compression ${format} (${input.length} bytes → ${compressed.length} bytes)`);
    for (const [name, engine] of [
      ['internal', internal],
      ['fflate 0.7.4', upstream]
    ] as const) {
      const output = engine[decode](compressed);
      if (output.length !== input.length || output.some((value, index) => value !== input[index]))
        throw new Error(`${name}: incorrect output`);
      for (let iteration = 0; iteration < 3; iteration++) {
        engine[encode](input, options);
        engine[decode](compressed);
      }
      bench.add(
        `${format} ${name} encode`,
        {multiplier: input.length, unit: 'B', minIterations: 10, time: 250},
        () => engine[encode](input, options)
      );
      bench.add(
        `${format} ${name} decode`,
        {multiplier: input.length, unit: 'B', minIterations: 10, time: 250},
        () => engine[decode](compressed)
      );
    }
  }
  return bench;
}
