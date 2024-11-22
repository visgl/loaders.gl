/* tslint:disable */
/* eslint-disable */
export class WasmLasZipDecompressor {
  free(): void;
  /**
   * @param {Uint8Array} buf
   */
  constructor(buf: Uint8Array);
  /**
   * @param {Uint8Array} out
   */
  decompress_many(out: Uint8Array): void;
  header: WasmQuickHeader;
}
export class WasmQuickHeader {
  free(): void;
  header_size: number;
  major: number;
  minor: number;
  num_points: bigint;
  num_vlrs: number;
  offset_to_points: number;
  point_format_id: number;
  point_size: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_wasmquickheader_free: (a: number, b: number) => void;
  readonly __wbg_get_wasmquickheader_major: (a: number) => number;
  readonly __wbg_set_wasmquickheader_major: (a: number, b: number) => void;
  readonly __wbg_get_wasmquickheader_minor: (a: number) => number;
  readonly __wbg_set_wasmquickheader_minor: (a: number, b: number) => void;
  readonly __wbg_get_wasmquickheader_offset_to_points: (a: number) => number;
  readonly __wbg_set_wasmquickheader_offset_to_points: (a: number, b: number) => void;
  readonly __wbg_get_wasmquickheader_num_vlrs: (a: number) => number;
  readonly __wbg_set_wasmquickheader_num_vlrs: (a: number, b: number) => void;
  readonly __wbg_get_wasmquickheader_point_format_id: (a: number) => number;
  readonly __wbg_set_wasmquickheader_point_format_id: (a: number, b: number) => void;
  readonly __wbg_get_wasmquickheader_point_size: (a: number) => number;
  readonly __wbg_set_wasmquickheader_point_size: (a: number, b: number) => void;
  readonly __wbg_get_wasmquickheader_num_points: (a: number) => number;
  readonly __wbg_set_wasmquickheader_num_points: (a: number, b: number) => void;
  readonly __wbg_get_wasmquickheader_header_size: (a: number) => number;
  readonly __wbg_set_wasmquickheader_header_size: (a: number, b: number) => void;
  readonly __wbg_wasmlaszipdecompressor_free: (a: number, b: number) => void;
  readonly __wbg_get_wasmlaszipdecompressor_header: (a: number) => number;
  readonly __wbg_set_wasmlaszipdecompressor_header: (a: number, b: number) => void;
  readonly wasmlaszipdecompressor_new: (a: number) => Array;
  readonly wasmlaszipdecompressor_decompress_many: (a: number, b: number, c: number, d: number) => Array;
  readonly __wbindgen_export_0: WebAssembly.Table;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
