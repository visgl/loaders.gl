type DBFRowsOutput = object[];

interface DBFTableOutput {
  schema;
  rows: DBFRowsOutput;
}

export function parseDBF(arrayBuffer: ArrayBuffer, options): DBFRowsOutput | DBFTableOutput;

export function parseDBFInBatches(
  asyncIterator: AsyncIterable<ArrayBuffer>,
  options
): AsyncIterable<DBFRowsOutput | DBFTableOutput>;
