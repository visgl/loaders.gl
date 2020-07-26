export interface IncrementalTransform {
  write(chunk: any): any;
  end(): any;
}
