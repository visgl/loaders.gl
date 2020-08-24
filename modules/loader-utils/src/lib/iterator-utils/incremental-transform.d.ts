export interface IncrementalTransform {
  write(chunk: ArrayBuffer): ArrayBuffer | null;
  end(): ArrayBuffer | null;
}
