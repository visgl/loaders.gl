export interface SHXOutput {
  offsets: Int32Array;
  lengths: Int32Array;
}

export function parseShx(arrayBuffer: ArrayBuffer): SHXOutput;
