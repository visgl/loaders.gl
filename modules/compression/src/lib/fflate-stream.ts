// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Minimal interface shared by fflate's streaming codecs. */
export type FflateStreamProcessor = {
  ondata: (data: Uint8Array, final: boolean) => void;
  push: (data: Uint8Array, final?: boolean) => void;
};

/** Streams input batches through an fflate codec. */
export async function* transformFflateBatches(
  processor: FflateStreamProcessor,
  inputBatches: AsyncIterable<ArrayBuffer> | Iterable<ArrayBuffer>
): AsyncIterable<ArrayBuffer> {
  const chunks: ArrayBuffer[] = [];
  processor.ondata = data => {
    chunks.push(data.slice().buffer as ArrayBuffer);
  };

  for await (const batch of inputBatches) {
    processor.push(new Uint8Array(batch), false);
    yield* chunks.splice(0);
  }
  processor.push(new Uint8Array(0), true);
  yield* chunks;
}
