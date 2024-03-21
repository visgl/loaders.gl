import {LoaderWithParser, load} from '@loaders.gl/core';
import {
  I3STileContent,
  I3STileHeader,
  I3STilesetHeader,
  I3SLoader,
  I3SLoaderOptions,
  parseSLPKArchive
} from '@loaders.gl/i3s';
import {FileHandleFile} from '@loaders.gl/loader-utils';
import {ZipFileSystem, makeZipCDHeaderIterator} from '@loaders.gl/zip';

export type SLPKUrlParts = {slpkFileName: string; internalFileName: string};

/**
 * Load I3S node content
 * @param sourceTileset - source layer JSON
 * @param sourceTile - source I3S node metadata
 * @param tilesetLoadOptions - load options for Tiles3DLoader
 * @param slpkFilesystem - loaded instance of ZipFileSystem for local convertion from SLPK file
 * @returns - 3DTiles tile content or null
 */
export const loadI3SContent = async (
  sourceTileset: I3STilesetHeader | null,
  sourceTile: I3STileHeader,
  tilesetLoadOptions: I3SLoaderOptions,
  slpkFilesystem: ZipFileSystem | null
): Promise<I3STileContent | null> => {
  if (!sourceTileset || !sourceTile.contentUrl) {
    return null;
  }

  const loadOptions: I3SLoaderOptions = {
    ...tilesetLoadOptions,
    i3s: {
      ...tilesetLoadOptions.i3s,
      // @ts-expect-error
      isTileset: false,
      // @ts-expect-error
      isTileHeader: false,
      _tileOptions: {
        attributeUrls: sourceTile.attributeUrls || [],
        textureUrl: sourceTile.textureUrl,
        textureFormat: sourceTile.textureFormat,
        textureLoaderOptions: sourceTile.textureLoaderOptions,
        materialDefinition: sourceTile.materialDefinition,
        isDracoGeometry: sourceTile.isDracoGeometry,
        mbs: sourceTile.mbs
      },
      _tilesetOptions: {
        store: sourceTileset.store,
        // @ts-expect-error
        attributeStorageInfo: sourceTileset.attributeStorageInfo,
        // @ts-expect-error
        fields: sourceTileset.fields
      }
    }
  };
  const tileContent = await loadFromArchive(
    sourceTile.contentUrl,
    I3SLoader,
    loadOptions,
    slpkFilesystem
  );

  return tileContent;
};

/**
 * Load local SLPK file to ZipFileSystem instance
 * @param url - path to SLPK file
 * @returns instance of ZipFileSystem or null if url is not an SLPK file
 */
export async function openSLPK(url: string): Promise<ZipFileSystem | null> {
  const slpkUrlParts = url.split('.slpk');
  if (slpkUrlParts.length === 2) {
    const slpkFileName = `${slpkUrlParts[0]}.slpk`;
    const fileProvider = new FileHandleFile(slpkFileName);
    const archive = await parseSLPKArchive(fileProvider, undefined, slpkFileName);
    const fileSystem = new ZipFileSystem(archive);
    return fileSystem;
  }
  return null;
}

/**
 * Load a resource with load options and .3tz format support
 * @param url - resource URL
 * @param loader - loader to parse data (Tiles3DLoader / CesiumIonLoader)
 * @param loadOptions - i3s loader options
 * @returns i3s resource
 */
export async function loadFromArchive(
  url: string,
  loader: LoaderWithParser,
  loadOptions: I3SLoaderOptions,
  fileSystem: ZipFileSystem | null
) {
  if (fileSystem !== null) {
    const content = await load(url, loader, {
      ...loadOptions,
      fetch: fileSystem.fetch.bind(fileSystem)
    });
    return content;
  }
  return await load(url, loader, loadOptions);
}

/**
 * Get nodes count inside SLPK
 * @param fileSystem - file system of SLPK
 * @returns number of nodes
 */
export async function getNodeCount(fileSystem: ZipFileSystem | null): Promise<number> {
  if (!fileSystem?.fileProvider) {
    return 0;
  }
  let count = 0;
  const filesIterator = makeZipCDHeaderIterator(fileSystem.fileProvider);
  for await (const file of filesIterator) {
    const filename = file.fileName;
    if (filename.indexOf('3dNodeIndexDocument.json.gz') >= 0) {
      count++;
    }
  }
  return count;
}
