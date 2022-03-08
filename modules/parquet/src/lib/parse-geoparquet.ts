// eslint-disable
import type {Table} from 'apache-arrow';

import initWasm, {readParquet} from 'parquet-wasm';
import {tableFromIPC} from 'apache-arrow';
import { assert } from 'console';

let INIT_CALLED = false;

export async function parseGeoParquet(arrayBuffer: ArrayBuffer, options) {
  // await initialize(options?.geoparquet?.cdn);

  const table = parseParquetToArrow(arrayBuffer);

  const geoMeta = JSON.parse(table?.schema?.metadata?.get('geo'))
  const geoCol = geoMeta.primaryColumn;

  return table;
}

// async function initialize(cdn: string | null) {
//   if (INIT_CALLED) {
//     return;
//   }

//   if (cdn !== null) {
//     await initWasm(cdn);
//   } else {
//     await initWasm();
//   }

//   INIT_CALLED = true;
// }

function reproject(table: Table, geoColumn: string, geoMeta): Table {
  const sourceCrs = geoMeta.columns[geoColumn]
  for (const row of table[geoColumn]) {
    reproj(row[geoColumn], sourceCrs, destCRS);
  }

}

function decodeWKB(table: Table, geoColumn: string, geoMeta) {
  assert(geoMeta.columns[geoColumn].encoding === 'WKB');

  for (const row of table[geoColumn]) {
    context.parse(row[geoColumn], WKBLoader);
  }
}

function parseParquetToArrow(arrayBuffer: ArrayBuffer): Table {
  const arr = new Uint8Array(arrayBuffer);
  const arrowIPCBytes = readParquet(arr);
  const arrowTable = tableFromIPC(arrowIPCBytes);
  return arrowTable;
}

// const resp = await fetch(url);
// const buffer = await resp.arrayBuffer();
// const table = arrow.tableFromIPC(readParquet(buffer));
// const projection = table.schema.metadata.get('geo')
// for (const row in table) {
//   const geom = parse(row, WKBLoader)
//   Proj4Projection(geom)
// }
// return geojson;
