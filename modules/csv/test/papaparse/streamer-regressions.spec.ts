import {expect, test} from 'vitest';
import Papa from '../../src/papaparse/papaparse';

test('Papa.parse handles many tiny string chunks without recursive stack growth', () => {
  const rowCount = 12000;
  let parsedRowCount = 0;

  Papa.parse(`value\n${Array.from({length: rowCount}, () => 'row').join('\n')}`, {
    chunkSize: 1,
    step: results => {
      if (results.data[0] !== 'value') parsedRowCount++;
    }
  });

  expect(parsedRowCount).toBe(rowCount);
});

test('Papa.parse resumes a quoted row paused at a chunk boundary', async () => {
  const chunks: string[][] = [];
  const input = 'name,value\n"quoted, value",1\nsecond,2';

  await new Promise<void>((resolve, reject) => {
    let paused = false;
    Papa.parse(input, {
      chunkSize: 8,
      chunk(results, handle) {
        if (results.data.length > 0) chunks.push(results.data as string[][]);
        if (!paused) {
          paused = true;
          handle.pause();
          setTimeout(() => handle.resume(), 0);
        }
      },
      complete: () => resolve(),
      error: reject
    });
  });

  expect(chunks.flat()).toContainEqual(['quoted, value', '1']);
  expect(chunks.flat()).toContainEqual(['second', '2']);
});
