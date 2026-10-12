import {openTileConversionArchive} from '@loaders.gl/tile-converter/v5/adapters';
import type {TileConversionArchiveInput} from '@loaders.gl/tile-converter/v5/adapters';

/** Cloneable example archive descriptor; browser selections retain immutable Files. */
export interface ConversionArchiveInput extends TileConversionArchiveInput {
  /** Local File or remote HTTP(S) URL. */
  readonly input: File | string;
}

/** Opens the shared bounded archive transport while preserving the example's File contract. */
export async function openConversionArchive(
  descriptor: ConversionArchiveInput,
  maxInputBytes: number,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch
) {
  const transport = await openTileConversionArchive(descriptor, maxInputBytes, signal, fetcher);
  return {...transport, descriptor: transport.descriptor! as ConversionArchiveInput};
}
