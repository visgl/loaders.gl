import {BlobFile, HttpFile} from '@loaders.gl/loader-utils';
import type {HttpFileIdentity, ReadableFile} from '@loaders.gl/loader-utils';
import {parseSLPKArchive} from '@loaders.gl/i3s';
import {Tiles3DArchive} from '@loaders.gl/3d-tiles';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import {createTileConversionResourceFetcher} from '@loaders.gl/tile-converter/v5/adapters';

/** Cloneable archive input; a remote identity is retained across inspection and conversion. */
export interface ConversionArchiveInput {
  /** Local browser file or HTTP(S) archive URL, including any query credentials. */
  readonly input: File | string;
  /** Explicit archive format, including for URLs without a filename extension. */
  readonly format: 'slpk' | '3tz';
  /** Pinned remote length and validator; local File contents are immutable. */
  readonly identity?: HttpFileIdentity;
}

/** Opens an indexed archive with bounded reads and confines dependency URLs to its virtual root. */
export async function openConversionArchive(
  descriptor: ConversionArchiveInput,
  maxInputBytes: number,
  signal: AbortSignal,
  fetcher: typeof fetch = fetch
) {
  signal.throwIfAborted();
  const rootUrl = `https://conversion.invalid/input.${descriptor.format}`;
  const transport = createTileConversionResourceFetcher({
    maxInputBytes,
    signal,
    fetcher: async (url, options) => {
      const response = await fetcher(url, options);
      if (response.status !== 206) {
        await response.body?.cancel();
        throw new Error('Remote conversion archives require HTTP 206 byte-range responses.');
      }
      return response;
    }
  });
  let file: ReadableFile | undefined;
  try {
    if (typeof descriptor.input === 'string') {
      if (!['http:', 'https:'].includes(new URL(descriptor.input).protocol))
        throw new Error('Use an HTTP(S) archive URL.');
      const remote = new HttpFile(descriptor.input, {
        fetch: (url, options) => transport(url, options),
        consistency: 'strict',
        ...descriptor.identity
      });
      file = remote;
      await remote.open(signal);
    } else file = new BlobFile(descriptor.input);
    if (file.size > maxInputBytes)
      throw new Error('Conversion archive input must be at most 16 MiB.');
    let readBytes = 0;
    const boundedFile: ReadableFile = {
      handle: file.handle,
      size: file.size,
      bigsize: file.bigsize,
      url: file.url,
      stat: () => file!.stat!(),
      close: () => file!.close(),
      /** Checks indexed reads before allocation and forwards operation cancellation. */
      read: async (start, length) => {
        signal.throwIfAborted();
        if (!Number.isSafeInteger(length) || length! < 0 || length! > maxInputBytes - readBytes)
          throw new TileConversionError(
            'INPUT_RESOURCE_TOO_LARGE',
            'Archive indexed reads exceed the input budget'
          );
        readBytes += length!;
        const bytes = await file!.read(start, length, signal);
        signal.throwIfAborted();
        return bytes;
      }
    };
    const archive =
      descriptor.format === 'slpk'
        ? await parseSLPKArchive(boundedFile)
        : new Tiles3DArchive(boundedFile);
    const root = new URL(rootUrl);
    return {
      rootUrl: descriptor.format === '3tz' ? `${rootUrl}/tileset.json` : rootUrl,
      descriptor: {
        ...descriptor,
        ...(file instanceof HttpFile ? {identity: file.getIdentitySnapshot()!} : {})
      },
      /** Resolves only resources belonging to this archive, without external network fallback. */
      fetcher: (async (input, options) => {
        signal.throwIfAborted();
        options?.signal?.throwIfAborted();
        const url = new URL(input instanceof Request ? input.url : String(input));
        if (
          url.origin !== root.origin ||
          (url.pathname !== root.pathname && !url.pathname.startsWith(`${root.pathname}/`))
        )
          throw new Error('Conversion dependencies must resolve inside the selected archive.');
        const path = decodeURIComponent(
          url.pathname.slice(root.pathname.length).replace(/^\//, '')
        );
        if (
          path.includes('\\') ||
          path.split('/').some(segment => segment === '..' || segment === '.')
        )
          throw new Error('Archive dependency path cannot escape its root.');
        const bytes =
          descriptor.format === 'slpk'
            ? await archive.getFile(path, 'http')
            : await archive.getFile(path);
        signal.throwIfAborted();
        options?.signal?.throwIfAborted();
        return new Response(bytes);
      }) satisfies typeof fetch,
      /** Releases the readable file on success, failure or cancellation. */
      close: () => file!.close()
    };
  } catch (error) {
    await file?.close();
    throw error;
  }
}
