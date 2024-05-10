import type {
  Tiles3DLoaderOptions,
  Tiles3DTileContent,
  Tiles3DTileJSONPostprocessed,
  Tiles3DTilesetJSONPostprocessed
} from '@loaders.gl/3d-tiles';
import {Tiles3DArchive} from '@loaders.gl/3d-tiles';
import {LoaderWithParser, load} from '@loaders.gl/core';
import {FileHandleFile, FileProviderInterface} from '@loaders.gl/loader-utils';
import {
  CD_HEADER_SIGNATURE,
  ZipFileSystem,
  parseHashTable,
  parseZipCDFileHeader,
  parseZipLocalFileHeader,
  searchFromTheEnd
} from '@loaders.gl/zip';

/**
 * Load nested 3DTiles tileset. If the sourceTile is not nested tileset - do nothing
 * @param sourceTileset - source root tileset JSON
 * @param sourceTile - source tile JSON that is supposed to has link to nested tileset
 * @param tilesetLoadOptions - load options for Tiles3DLoader
 * @returns nothing
 */
export const loadNestedTileset = async (
  sourceTileset: Tiles3DTilesetJSONPostprocessed | null,
  sourceTile: Tiles3DTileJSONPostprocessed,
  tilesetLoadOptions: Tiles3DLoaderOptions
): Promise<void> => {
  const isTileset = isNestedTileset(sourceTile);
  if (!sourceTileset || !sourceTile.contentUrl || !isTileset) {
    return;
  }

  const loadOptions = {
    ...tilesetLoadOptions,
    [sourceTileset.loader.id]: {
      isTileset,
      assetGltfUpAxis: (sourceTileset.asset && sourceTileset.asset.gltfUpAxis) || 'Y'
    }
  };
  const tileContent = await loadFromArchive(
    sourceTile.contentUrl,
    sourceTileset.loader,
    loadOptions
  );

  if (tileContent.root) {
    sourceTile.children = [tileContent.root];
  }
};

/**
 * Load 3DTiles tile content, that includes glTF object
 * @param sourceTileset - source root tileset JSON
 * @param sourceTile - source tile JSON that has link to content data
 * @param tilesetLoadOptions - load options for Tiles3DLoader
 * @returns - 3DTiles tile content or null
 */
export const loadTile3DContent = async (
  sourceTileset: Tiles3DTilesetJSONPostprocessed | null,
  sourceTile: Tiles3DTileJSONPostprocessed,
  tilesetLoadOptions: Tiles3DLoaderOptions
): Promise<Tiles3DTileContent | null> => {
  const isTileset = isNestedTileset(sourceTile);
  if (!sourceTileset || !sourceTile.contentUrl || isTileset) {
    return null;
  }

  const loadOptions = {
    ...tilesetLoadOptions,
    [sourceTileset.loader.id]: {
      // @ts-ignore
      ...(tilesetLoadOptions[sourceTileset.loader.id] || {}),
      isTileset,
      assetGltfUpAxis: (sourceTileset.asset && sourceTileset.asset.gltfUpAxis) || 'Y'
    }
  };
  const tileContent = await loadFromArchive(
    sourceTile.contentUrl,
    sourceTileset.loader,
    loadOptions
  );

  return tileContent;
};

/**
 * Load a resource with load options and .3tz format support
 * @param url - resource URL
 * @param loader - loader to parse data (Tiles3DLoader / CesiumIonLoader)
 * @param loadOptions - 3d-tiles loader options
 * @returns 3d-tiles resource
 */
export async function loadFromArchive(
  url: string,
  loader: LoaderWithParser,
  loadOptions: Tiles3DLoaderOptions
) {
  const tz3UrlParts = url.split('.3tz');
  let filename: string | null;
  // No '.3tz'. The file will be loaded with global fetch function
  if (tz3UrlParts.length === 1) {
    filename = null;
  } else if (tz3UrlParts.length === 2) {
    filename = tz3UrlParts[1].slice(1);
    if (filename === '') {
      filename = 'tileset.json';
    }
  } else {
    throw new Error('Unexpected URL format');
  }
  if (filename) {
    const tz3Path = `${tz3UrlParts[0]}.3tz`;
    const fileProvider = new FileHandleFile(tz3Path);
    const hashTable = await loadHashTable(fileProvider);
    const archive = new Tiles3DArchive(fileProvider, hashTable, tz3Path);
    const fileSystem = new ZipFileSystem(archive);
    const content = await load(filename, loader, {
      ...loadOptions,
      fetch: fileSystem.fetch.bind(fileSystem)
    });
    await fileSystem.destroy();
    return content;
  }
  return await load(url, loader, loadOptions);
}

/**
 * Check if tile is nested tileset
 * @param tile - 3DTiles header data
 * @returns true if tile is nested tileset
 */
export function isNestedTileset(tile: Tiles3DTileJSONPostprocessed) {
  return tile?.type === 'json' || tile?.type === '3tz';
}

/**
 * Load hash file from 3TZ
 * @param fileProvider - binary reader of 3TZ
 * @returns hash table of the 3TZ file content or undefined if the hash file is not presented inside
 */
async function loadHashTable(
  fileProvider: FileProviderInterface
): Promise<undefined | Record<string, bigint>> {
  let hashTable: undefined | Record<string, bigint>;

  const hashCDOffset = await searchFromTheEnd(fileProvider, CD_HEADER_SIGNATURE);

  const cdFileHeader = await parseZipCDFileHeader(hashCDOffset, fileProvider);

  // '@3dtilesIndex1@' is index file that must be the last in the archive. It allows
  // to improve load and read performance when the archive contains a very large number
  // of files.
  if (cdFileHeader?.fileName === '@3dtilesIndex1@') {
    const localFileHeader = await parseZipLocalFileHeader(
      cdFileHeader.localHeaderOffset,
      fileProvider
    );
    if (!localFileHeader) {
      throw new Error('corrupted 3tz');
    }

    const fileDataOffset = localFileHeader.fileDataOffset;
    const hashFile = await fileProvider.slice(
      fileDataOffset,
      fileDataOffset + localFileHeader.compressedSize
    );

    hashTable = parseHashTable(hashFile);
  }

  return hashTable;
}
