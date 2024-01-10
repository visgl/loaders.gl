// tool to dump spatial index tree
// run with fx. TS_NODE_PROJECT=config/tsconfig.test.json node --loader ts-node/esm.mjs src/ts/dumptree.ts

import flatbuffers from 'flatbuffers';
import Envelope from 'jsts/org/locationtech/jts/geom/Envelope.js';
import GeometryFactory from 'jsts/org/locationtech/jts/geom/GeometryFactory.js';
import GeoJSONWriter from 'jsts/org/locationtech/jts/io/GeoJSONWriter.js';
import {readFileSync, writeFileSync} from 'fs';

import {magicbytes, SIZE_PREFIX_LEN} from './constants.js';
import {fromByteBuffer} from './header-meta.js';
import {calcTreeSize, generateLevelBounds} from './packedrtree.js';

const buffer = readFileSync('./test/data/tiger_roads.fgb');
const bytes = new Uint8Array(buffer);

if (!bytes.subarray(0, 3).every((v, i) => magicbytes[i] === v))
  throw new Error('Not a FlatGeobuf file');

const bb = new flatbuffers.ByteBuffer(bytes);
const headerLength = bb.readUint32(magicbytes.length);
bb.setPosition(magicbytes.length + SIZE_PREFIX_LEN);

const headerMeta = fromByteBuffer(bb);

if (headerMeta.indexNodeSize === 0) throw new Error('No index found');

let offset = magicbytes.length + SIZE_PREFIX_LEN + headerLength;
const numItems = headerMeta.featuresCount;
const nodeSize = headerMeta.indexNodeSize;
const envelope = headerMeta.envelope;

console.log(`Number of items in tree: ${numItems}`);
console.log(`Envelope: ${envelope}`);
console.log(`Tree node index size: ${nodeSize}`);
console.log(`Offset: ${offset}`);

const treeSize = calcTreeSize(numItems, nodeSize);
const levelBounds = generateLevelBounds(numItems, nodeSize).reverse();

console.log('Level bounds:');
for (const levelBound of levelBounds) console.log(`  ${levelBound}`);

console.log(`Size: ${treeSize}`);

const items: any[] = [];

function readNode(level: number) {
  const minx = buffer.readDoubleLE(offset + 0);
  const miny = buffer.readDoubleLE(offset + 8);
  const maxx = buffer.readDoubleLE(offset + 16);
  const maxy = buffer.readDoubleLE(offset + 24);
  items.push([level, minx, miny, maxx, maxy]);
  offset += 40;
}

let level = 0;
for (const levelBound of levelBounds) {
  for (let i = levelBound[0]; i < levelBound[1]; i++) readNode(level);
  level++;
}

const writer = new GeoJSONWriter();
const factory = new GeometryFactory();

const geojsonfeatures = items.map((i) => {
  const geometry = factory.toGeometry(new Envelope(i[1], i[3], i[2], i[4]));
  return {
    type: 'Feature',
    geometry: writer.write(geometry),
    properties: {
      level: i[0]
    }
  };
});

const geojson = {
  type: 'FeatureCollection',
  features: geojsonfeatures
};

writeFileSync('out.geojson', JSON.stringify(geojson));
