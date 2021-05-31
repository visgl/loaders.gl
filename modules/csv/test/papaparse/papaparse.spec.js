// This is a fork of papaparse under MIT License
// https://github.com/mholt/PapaParse

/* @license
Papa Parse
v5.0.0-beta.0
https://github.com/mholt/PapaParse
License: MIT
*/

/* eslint-disable quotes, no-var, prefer-template, curly */
import test from 'tape-promise/tape';

import Papa from '@loaders.gl/csv/libs/papaparse';
import {CORE_PARSER_TESTS, PARSE_TESTS, PARSE_ASYNC_TESTS} from './csv-test-cases';

const BASE_PATH = `${__dirname}/../../data/csv/`;
const FILES_ENABLED = false;
const XHR_ENABLED = false;

const CUSTOM_TESTS = [
  {
    description: 'Complete is called with all results if neither step nor chunk is defined',
    expected: [
      ['A', 'b', 'c'],
      ['d', 'E', 'f'],
      ['G', 'h', 'i']
    ],
    disabled: !FILES_ENABLED,
    run(callback) {
      Papa.parse(new File(['A,b,c\nd,E,f\nG,h,i'], 'sample.csv'), {
        chunkSize: 3,
        complete: response => callback(response.data)
      });
    }
  },
  {
    description: 'Step is called for each row',
    expected: 2,
    run(callback) {
      var callCount = 0;
      Papa.parse('A,b,c\nd,E,f', {
        step() {
          callCount++;
        },
        complete() {
          callback(callCount);
        }
      });
    }
  },
  {
    description: 'Data is correctly parsed with steps',
    expected: [
      ['A', 'b', 'c'],
      ['d', 'E', 'f']
    ],
    run(callback) {
      var data = [];
      Papa.parse('A,b,c\nd,E,f', {
        step(results) {
          data.push(results.data);
        },
        complete() {
          callback(data);
        }
      });
    }
  },
  {
    description: 'Data is correctly parsed with steps (headers)',
    expected: [
      {One: 'A', Two: 'b', Three: 'c'},
      {One: 'd', Two: 'E', Three: 'f'}
    ],
    run(callback) {
      var data = [];
      Papa.parse('One,Two,Three\nA,b,c\nd,E,f', {
        header: true,
        step(results) {
          data.push(results.data);
        },
        complete() {
          callback(data);
        }
      });
    }
  },
  {
    description: 'Data is correctly parsed with steps and worker (headers)',
    expected: [
      {One: 'A', Two: 'b', Three: 'c'},
      {One: 'd', Two: 'E', Three: 'f'}
    ],
    run(callback) {
      var data = [];
      Papa.parse('One,Two,Three\nA,b,c\nd,E,f', {
        header: true,
        worker: true,
        step(results) {
          data.push(results.data);
        },
        complete() {
          callback(data);
        }
      });
    }
  },
  {
    description: 'Data is correctly parsed with steps and worker',
    expected: [
      ['A', 'b', 'c'],
      ['d', 'E', 'f']
    ],
    run(callback) {
      var data = [];
      Papa.parse('A,b,c\nd,E,f', {
        worker: true,
        step(results) {
          data.push(results.data);
        },
        complete() {
          callback(data);
        }
      });
    }
  },
  {
    description: 'Step is called with the contents of the row',
    expected: ['A', 'b', 'c'],
    run(callback) {
      Papa.parse('A,b,c', {
        step(response) {
          callback(response.data);
        }
      });
    }
  },
  {
    description: 'Step is called with the last cursor position',
    expected: [6, 12, 17],
    run(callback) {
      var updates = [];
      Papa.parse('A,b,c\nd,E,f\nG,h,i', {
        step(response) {
          updates.push(response.meta.cursor);
        },
        complete() {
          callback(updates);
        }
      });
    }
  },
  {
    description: 'Step exposes cursor for downloads',
    expected: [129, 287, 452, 595, 727, 865, 1031, 1209],
    disabled: !XHR_ENABLED,
    run(callback) {
      var updates = [];
      Papa.parse(BASE_PATH + 'long-sample.csv', {
        download: true,
        step(response) {
          updates.push(response.meta.cursor);
        },
        complete() {
          callback(updates);
        }
      });
    }
  },
  {
    description: 'Step exposes cursor for chunked downloads',
    expected: [129, 287, 452, 595, 727, 865, 1031, 1209],
    disabled: !XHR_ENABLED,
    run(callback) {
      var updates = [];
      Papa.parse(BASE_PATH + 'long-sample.csv', {
        download: true,
        chunkSize: 500,
        step(response) {
          updates.push(response.meta.cursor);
        },
        complete() {
          callback(updates);
        }
      });
    }
  },
  {
    description: 'Step exposes cursor for workers',
    expected: [452, 452, 452, 865, 865, 865, 1209, 1209],
    disabled: !XHR_ENABLED,
    run(callback) {
      var updates = [];
      Papa.parse(BASE_PATH + 'long-sample.csv', {
        download: true,
        chunkSize: 500,
        worker: true,
        step(response) {
          updates.push(response.meta.cursor);
        },
        complete() {
          callback(updates);
        }
      });
    }
  },
  {
    description: 'Chunk is called for each chunk',
    expected: [3, 3, 2],
    disabled: !XHR_ENABLED,
    run(callback) {
      var updates = [];
      Papa.parse(BASE_PATH + 'long-sample.csv', {
        download: true,
        chunkSize: 500,
        chunk(response) {
          updates.push(response.data.length);
        },
        complete() {
          callback(updates);
        }
      });
    }
  },
  {
    description: 'Chunk is called with cursor position',
    expected: [452, 865, 1209],
    disabled: !XHR_ENABLED,
    run(callback) {
      var updates = [];
      Papa.parse(BASE_PATH + 'long-sample.csv', {
        download: true,
        chunkSize: 500,
        chunk(response) {
          updates.push(response.meta.cursor);
        },
        complete() {
          callback(updates);
        }
      });
    }
  },
  {
    description: 'Chunk functions can pause parsing',
    expected: [[['A', 'b', 'c']]],
    run(callback) {
      var updates = [];
      Papa.parse('A,b,c\nd,E,f\nG,h,i', {
        chunkSize: 10,
        chunk(response, handle) {
          updates.push(response.data);
          handle.pause();
          callback(updates);
        },
        complete() {
          callback(new Error('incorrect complete callback'));
        }
      });
    }
  },
  {
    description: 'Chunk functions can resume parsing',
    expected: [
      [['A', 'b', 'c']],
      [
        ['d', 'E', 'f'],
        ['G', 'h', 'i']
      ]
    ],
    run(callback) {
      var updates = [];
      var handle = null;
      var first = true;
      Papa.parse('A,b,c\nd,E,f\nG,h,i', {
        chunkSize: 10,
        chunk(response, h) {
          updates.push(response.data);
          if (!first) return;
          handle = h;
          handle.pause();
          first = false;
        },
        complete() {
          callback(updates);
        }
      });
      setTimeout(() => {
        handle.resume();
      }, 500);
    }
  },
  {
    description: 'Chunk functions can abort parsing',
    expected: [[['A', 'b', 'c']]],
    run(callback) {
      var updates = [];
      Papa.parse('A,b,c\nd,E,f\nG,h,i', {
        chunkSize: 1,
        chunk(response, handle) {
          if (response.data.length) {
            updates.push(response.data);
            handle.abort();
          }
        },
        complete(response) {
          callback(updates);
        }
      });
    }
  },
  {
    description: 'Step exposes indexes for files',
    expected: [6, 12, 17],
    disabled: !FILES_ENABLED,
    run(callback) {
      var updates = [];
      Papa.parse(new File(['A,b,c\nd,E,f\nG,h,i'], 'sample.csv'), {
        download: true,
        step(response) {
          updates.push(response.meta.cursor);
        },
        complete() {
          callback(updates);
        }
      });
    }
  },
  {
    description: 'Step exposes indexes for chunked files',
    expected: [6, 12, 17],
    disabled: !FILES_ENABLED,
    run(callback) {
      var updates = [];
      Papa.parse(new File(['A,b,c\nd,E,f\nG,h,i'], 'sample.csv'), {
        chunkSize: 3,
        step(response) {
          updates.push(response.meta.cursor);
        },
        complete() {
          callback(updates);
        }
      });
    }
  },
  {
    description: 'Quoted line breaks near chunk boundaries are handled',
    expected: [
      ['A', 'B', 'C'],
      ['X', 'Y\n1\n2\n3', 'Z']
    ],
    disabled: !FILES_ENABLED,
    run(callback) {
      var updates = [];
      Papa.parse(new File(['A,B,C\nX,"Y\n1\n2\n3",Z'], 'sample.csv'), {
        chunkSize: 3,
        step(response) {
          updates.push(response.data);
        },
        complete() {
          callback(updates);
        }
      });
    }
  },
  {
    description: 'Step functions can abort parsing',
    expected: [['A', 'b', 'c']],
    run(callback) {
      var updates = [];
      Papa.parse('A,b,c\nd,E,f\nG,h,i', {
        step(response, handle) {
          updates.push(response.data);
          handle.abort();
          callback(updates);
        },
        chunkSize: 6
      });
    }
  },
  {
    description: 'Complete is called after aborting',
    expected: true,
    run(callback) {
      Papa.parse('A,b,c\nd,E,f\nG,h,i', {
        step(response, handle) {
          handle.abort();
        },
        chunkSize: 6,
        complete(response) {
          callback(response.meta.aborted);
        }
      });
    }
  },
  {
    description: 'Step functions can pause parsing',
    expected: [['A', 'b', 'c']],
    run(callback) {
      var updates = [];
      Papa.parse('A,b,c\nd,E,f\nG,h,i', {
        step(response, handle) {
          updates.push(response.data);
          handle.pause();
          callback(updates);
        },
        complete() {
          callback('incorrect complete callback');
        }
      });
    }
  },
  {
    description: 'Step functions can resume parsing',
    expected: [
      ['A', 'b', 'c'],
      ['d', 'E', 'f'],
      ['G', 'h', 'i']
    ],
    run(callback) {
      var updates = [];
      var handle = null;
      var first = true;
      Papa.parse('A,b,c\nd,E,f\nG,h,i', {
        step(response, h) {
          updates.push(response.data);
          if (!first) return;
          handle = h;
          handle.pause();
          first = false;
        },
        complete() {
          callback(updates);
        }
      });
      setTimeout(() => {
        handle.resume();
      }, 500);
    }
  },
  {
    description: 'Step functions can abort workers',
    expected: 1,
    disabled: !XHR_ENABLED,
    run(callback) {
      var updates = 0;
      Papa.parse(BASE_PATH + 'long-sample.csv', {
        worker: true,
        download: true,
        chunkSize: 500,
        step(response, handle) {
          updates++;
          handle.abort();
        },
        complete() {
          callback(updates);
        }
      });
    }
  },
  {
    description: 'beforeFirstChunk manipulates only first chunk',
    expected: 7,
    disabled: !XHR_ENABLED,
    run(callback) {
      var updates = 0;
      Papa.parse(BASE_PATH + 'long-sample.csv', {
        download: true,
        chunkSize: 500,
        beforeFirstChunk(chunk) {
          return chunk.replace(/.*?\n/, '');
        },
        step(response) {
          updates++;
        },
        complete() {
          callback(updates);
        }
      });
    }
  },
  {
    description: 'First chunk not modified if beforeFirstChunk returns nothing',
    expected: 8,
    disabled: !XHR_ENABLED,
    run(callback) {
      var updates = 0;
      Papa.parse(BASE_PATH + 'long-sample.csv', {
        download: true,
        chunkSize: 500,
        beforeFirstChunk(chunk) {},
        step(response) {
          updates++;
        },
        complete() {
          callback(updates);
        }
      });
    }
  },
  {
    description: 'Should correctly guess custom delimiter when passed delimiters to guess.',
    expected: '~',
    run(callback) {
      var results = Papa.parse('"A"~"B"~"C"~"D"', {
        delimitersToGuess: ['~', '@', '%']
      });
      callback(results.meta.delimiter);
    }
  },
  {
    description:
      'Should still correctly guess default delimiters when delimiters to guess are not given.',
    expected: ',',
    run(callback) {
      // @ts-ignore
      var results = Papa.parse('"A","B","C","D"');
      callback(results.meta.delimiter);
    }
  }
];

test('papaparse#Core Parser Tests', t => {
  for (const testCase of CORE_PARSER_TESTS) {
    if (!testCase.disabled) {
      // @ts-ignore
      var actual = new Papa.Parser(testCase.config).parse(testCase.input);
      t.deepEqual(
        JSON.stringify(actual.errors),
        JSON.stringify(testCase.expected.errors),
        testCase.description
      );
      t.deepEqual(actual.data, testCase.expected.data, testCase.description);
    }
  }
  t.end();
});

test('papaparse#Parse Tests', t => {
  for (const testCase of PARSE_TESTS) {
    if (!testCase.disabled) {
      const actual = Papa.parse(testCase.input, testCase.config);
      // allows for testing the meta object if present in the test
      if (testCase.expected.meta) {
        t.deepEqual(actual.meta, testCase.expected.meta, testCase.description);
      }
      t.deepEqual(
        JSON.stringify(actual.errors),
        JSON.stringify(testCase.expected.errors),
        testCase.description
      );
      t.deepEqual(actual.data, testCase.expected.data, testCase.description);
    }
  }
  t.end();
});

test('Parse Async Tests', t => {
  for (const testCase of PARSE_ASYNC_TESTS) {
    if (!testCase.disabled) {
      var config = testCase.config;

      config.complete = function(actual) {
        t.deepEqual(
          JSON.stringify(actual.errors),
          JSON.stringify(testCase.expected.errors),
          testCase.description
        );
        t.deepEqual(actual.data, testCase.expected.data, testCase.description);
        t.end();
      };

      config.error = function(err) {
        t.end();
        throw err;
      };

      Papa.parse(testCase.input, config);
    }
  }
});

test('papaparse#Custom Tests', t => {
  for (const testCase of CUSTOM_TESTS) {
    if (!testCase.disabled) {
      testCase.run(function(actual) {
        t.deepEqual(
          JSON.stringify(actual),
          JSON.stringify(testCase.expected),
          testCase.description
        );
        t.end();
      });
    }
  }
});

/*
function assertLongSampleParsedCorrectly(parsedCsv) {
  assert.equal(8, parsedCsv.data.length);
  assert.deepEqual(parsedCsv.data[0], [
    'Grant',
    'Dyer',
    'Donec.elementum@orciluctuset.example',
    '2013-11-23T02:30:31-08:00',
    '2014-05-31T01:06:56-07:00',
    'Magna Ut Associates',
    'ljenkins'
  ]);
  assert.deepEqual(parsedCsv.data[7], [
    'Talon',
    'Salinas',
    'posuere.vulputate.lacus@Donecsollicitudin.example',
    '2015-01-31T09:19:02-08:00',
    '2014-12-17T04:59:18-08:00',
    'Aliquam Iaculis Incorporate',
    'Phasellus@Quisquetincidunt.example'
  ]);
  assert.deepEqual(parsedCsv.meta, {
    delimiter: ",",
    linebreak: "\n",
    aborted: false,
    truncated: false,
    cursor: 1209
  });
  assert.equal(parsedCsv.errors.length, 0);
}

test('CSVLoader#PapaParse', t => {
  it('synchronously parsed CSV should be correctly parsed', () => {
    assertLongSampleParsedCorrectly(Papa.parse(longSampleRawCsv));
  });

  it('asynchronously parsed CSV should be correctly parsed', function(done) {
    Papa.parse(longSampleRawCsv, {
      complete(parsedCsv) {
        assertLongSampleParsedCorrectly(parsedCsv);
        done();
      },
    });
  });

  it('asynchronously parsed streaming CSV should be correctly parsed', function(done) {
    Papa.parse(fs.createReadStream(__dirname + '/long-sample.csv', 'utf8'), {
      complete(parsedCsv) {
        assertLongSampleParsedCorrectly(parsedCsv);
        done();
      },
    });
  });

  it('reports the correct row number on FieldMismatch errors', function(done) {
    Papa.parse(fs.createReadStream(__dirname + '/verylong-sample.csv'), {
      header: true,
      fastMode: true,
      complete(parsedCsv) {
        assert.deepEqual(parsedCsv.errors, [
          {
            type: "FieldMismatch",
            code: "TooFewFields",
            message: "Too few fields: expected 3 fields but parsed 2",
            row: 498
          },
          {
            type: "FieldMismatch",
            code: "TooFewFields",
            message: "Too few fields: expected 3 fields but parsed 2",
            row: 998
          },
          {
            type: "FieldMismatch",
            code: "TooFewFields",
            message: "Too few fields: expected 3 fields but parsed 2",
            row: 1498
          },
          {
            type: "FieldMismatch",
            code: "TooFewFields",
            message: "Too few fields: expected 3 fields but parsed 2",
            row: 1998
          }
        ]);
        assert.strictEqual(2000, parsedCsv.data.length);
        done();
      },
    });
  });

  it('piped streaming CSV should be correctly parsed', function(done) {
    var data = [];
    var readStream = fs.createReadStream(__dirname + '/long-sample.csv', 'utf8');
    var csvStream = readStream.pipe(Papa.parse(Papa.NODE_STREAM_INPUT));
    csvStream.on('data', function(item) {
      data.push(item);
    });
    csvStream.on('end', () => {
      assert.deepEqual(data[0], [
        'Grant',
        'Dyer',
        'Donec.elementum@orciluctuset.example',
        '2013-11-23T02:30:31-08:00',
        '2014-05-31T01:06:56-07:00',
        'Magna Ut Associates',
        'ljenkins'
      ]);
      assert.deepEqual(data[7], [
        'Talon',
        'Salinas',
        'posuere.vulputate.lacus@Donecsollicitudin.example',
        '2015-01-31T09:19:02-08:00',
        '2014-12-17T04:59:18-08:00',
        'Aliquam Iaculis Incorporate',
        'Phasellus@Quisquetincidunt.example'
      ]);
      done();
    });
  });

  it('should support pausing and resuming on same tick when streaming', function(done) {
    var rows = [];
    Papa.parse(fs.createReadStream(__dirname + '/long-sample.csv', 'utf8'), {
      chunk(results, parser) {
        rows = rows.concat(results.data);
        parser.pause();
        parser.resume();
      },
      error(err) {
        done(new Error(err));
      },
      complete() {
        assert.deepEqual(rows[0], [
          'Grant',
          'Dyer',
          'Donec.elementum@orciluctuset.example',
          '2013-11-23T02:30:31-08:00',
          '2014-05-31T01:06:56-07:00',
          'Magna Ut Associates',
          'ljenkins'
        ]);
        assert.deepEqual(rows[7], [
          'Talon',
          'Salinas',
          'posuere.vulputate.lacus@Donecsollicitudin.example',
          '2015-01-31T09:19:02-08:00',
          '2014-12-17T04:59:18-08:00',
          'Aliquam Iaculis Incorporate',
          'Phasellus@Quisquetincidunt.example'
        ]);
        done();
      }
    });
  });

  it('should support pausing and resuming asynchronously when streaming', function(done) {
    var rows = [];
    Papa.parse(fs.createReadStream(__dirname + '/long-sample.csv', 'utf8'), {
      chunk(results, parser) {
        rows = rows.concat(results.data);
        parser.pause();
        setTimeout(() => {
          parser.resume();
        }, 200);
      },
      error(err) {
        done(new Error(err));
      },
      complete() {
        assert.deepEqual(rows[0], [
          'Grant',
          'Dyer',
          'Donec.elementum@orciluctuset.example',
          '2013-11-23T02:30:31-08:00',
          '2014-05-31T01:06:56-07:00',
          'Magna Ut Associates',
          'ljenkins'
        ]);
        assert.deepEqual(rows[7], [
          'Talon',
          'Salinas',
          'posuere.vulputate.lacus@Donecsollicitudin.example',
          '2015-01-31T09:19:02-08:00',
          '2014-12-17T04:59:18-08:00',
          'Aliquam Iaculis Incorporate',
          'Phasellus@Quisquetincidunt.example'
        ]);
        done();
      }
    });
  });

  it('handles errors in beforeFirstChunk', function(done) {
    var expectedError = new Error('test');
    Papa.parse(fs.createReadStream(__dirname + '/long-sample.csv', 'utf8'), {
      beforeFirstChunk() {
        throw expectedError;
      },
      error(err) {
        assert.deepEqual(err, expectedError);
        done();
      }
    });
  });

  it('handles errors in chunk', function(done) {
    var expectedError = new Error('test');
    Papa.parse(fs.createReadStream(__dirname + '/long-sample.csv', 'utf8'), {
      chunk() {
        throw expectedError;
      },
      error(err) {
        assert.deepEqual(err, expectedError);
        done();
      }
    });
  });

  it('handles errors in step', function(done) {
    var expectedError = new Error('test');
    Papa.parse(fs.createReadStream(__dirname + '/long-sample.csv', 'utf8'), {
      step() {
        throw expectedError;
      },
      error(err) {
        assert.deepEqual(err, expectedError);
        done();
      }
    });
  });
});
*/
