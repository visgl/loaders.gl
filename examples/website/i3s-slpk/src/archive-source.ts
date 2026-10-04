import {Tiles3DArchiveSource, Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {I3SLoader, SLPKSource} from '@loaders.gl/i3s';

/** Supported archive selection; auto detects the file name or URL pathname. */
export type ArchiveFormat = 'auto' | 'slpk' | '3tz';

/** Creates a random-access source without reading the complete archive into memory. */
export function createArchiveSource(
  input: File | string,
  format: ArchiveFormat = 'auto'
): SLPKSource | Tiles3DArchiveSource {
  let name: string;
  if (typeof input === 'string') {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol))
      throw new Error('Use an HTTP or HTTPS archive URL.');
    name = url.pathname;
  } else name = input.name;
  const selectedFormat =
    format === 'auto' ? /\.(slpk|3tz)$/i.exec(name)?.[1].toLowerCase() : format;
  if (selectedFormat === 'slpk')
    return new SLPKSource({url: input, loader: I3SLoader}, {worker: false});
  if (selectedFormat === '3tz')
    return new Tiles3DArchiveSource({url: input, loader: Tiles3DLoader}, {worker: false});
  throw new Error(
    'Choose an .slpk or .3tz archive, or select its format for a URL without an extension.'
  );
}
