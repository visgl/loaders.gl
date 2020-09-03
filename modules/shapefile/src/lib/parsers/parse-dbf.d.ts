type DBFRowsOutput = object[];

interface DBFTableOutput {
  schema;
  rows: DBFRowsOutput;
}

export function parseDBF(arrayBuffer: ArrayBuffer, options): DBFRowsOutput | DBFTableOutput;

export function parseDBFInBatches(
  asyncIterator: AsyncIterator<ArrayBuffer> | Iterator<ArrayBuffer>,
  options
): AsyncIterator<DBFRowsOutput | DBFTableOutput>;
