export type CodecCursor = {
  offset: number;
  buffer: Buffer;
};

export type CodecOptions = {
  bitWidth: number;
  disableEnvelope: boolean;
  typeLength?: number;
};
