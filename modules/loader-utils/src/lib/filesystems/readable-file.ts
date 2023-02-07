// loaders.gl, MIT license

export type ReadableFile = {
  read: (position: number, length: number) => Promise<Buffer>;
  close: () => Promise<void>;
  /** Length of file in bytes */
  size: number;
};

/** Helper function to create an envelope reader for a binary memory input */
export function makeReadableFile(data: Blob | ArrayBuffer): ReadableFile {
  if (data instanceof ArrayBuffer) {
    const arrayBuffer: ArrayBuffer = data;
    return {
      read: async (start: number, length: number) => Buffer.from(data, start, length),
      close: async () => {},
      size: arrayBuffer.byteLength
    };
  }

  const blob: Blob = data;
  return {
    read: async (start: number, length: number) => {
      const arrayBuffer = await blob.slice(start, start + length).arrayBuffer();
      return Buffer.from(arrayBuffer);
    },
    close: async () => {},
    size: blob.size
  };
}
