import {
  parse3DTileHeaderSync,
  parse3DTileTablesSync,
  parsePointCloudTileSync
} from './parse-3d-file-header';

const MAGIC = {
  COMPOSITE: 'cmpt',
  BATCHED_3D_MODEL: 'b3dm',
  INSTANCED_3D_MODEL: 'i3dm',
  POINT_CLOUD: 'pnts'
};

export default function parse3DTileSync(arrayBuffer, byteOffset = 0, options = {}) {
  let header = parse3DTileHeaderSync(arrayBuffer, byteOffset);

  switch (header.magic) {
    case MAGIC.COMPOSITE:
      return parseComposite3DTileSync(header, arrayBuffer, header.byteOffset);

    case MAGIC.BATCHED_3D_MODEL:
      header = parse3DTileTablesSync(header, arrayBuffer, header.byteOffset);
      return parseBatchedModel3DTileSync(header, arrayBuffer, header.byteOffset);

    case MAGIC.INSTANCED_3D_MODEL:
      header = parse3DTileTablesSync(header, arrayBuffer, header.byteOffset);
      return parseInstancedModel3DTileSync(header, arrayBuffer, header.byteOffset);

    case MAGIC.POINTCLOUD:
      header = parse3DTileTablesSync(header, arrayBuffer, header.byteOffset);
      return parsePointCloudTileSync(header, arrayBuffer, header.byteOffset);

    default:
      // Ignore unknown tiles
      // log.warn('Unknown magicx')
      return null;
  }
}

function parseComposite3DTileSync(header, arrayBuffer, byteOffset) {
  const view = new DataView(arrayBuffer);

  const tilesLength = view.getUint32(byteOffset, true);
  byteOffset += 4;

  const tiles = [];

  // extract views of the tiles;
  while (header.byteLength - byteOffset > 12) {
    const tileHeader = parse3DTileHeaderSync(arrayBuffer, byteOffset);
    tileView = new Uint8Array();
    // parse3DTile()
    tiles.push({
      ...tileHeader,
      tileView
    });
  }

  return {
    ...header,
    tilesLength,
    tiles,

    // Update byteOffset
    byteOffset // TODO - should be 8 byte aligned?
  };
}
