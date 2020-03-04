import { flatbuffers } from 'flatbuffers'
import { ReadableStream } from 'web-streams-polyfill/ponyfill'
import slice from 'slice-source/index.js'

import ColumnMeta from '../ColumnMeta'
import ColumnType from '../ColumnType'
import { Header, Column } from '../header_generated'
import { Feature } from '../feature_generated'
import HeaderMeta from '../HeaderMeta'

import { buildFeature, IFeature } from './feature'
import { toGeometryType } from './geometry'
import { Rect, calcTreeSize, streamSearch as treeStreamSearch} from '../packedrtree'
import { IGeoJsonFeature } from '../geojson/feature'

export type FromFeatureFn = (feature: Feature, header: HeaderMeta) => IFeature | IGeoJsonFeature
type ReadFn = (size: number) => Promise<ArrayBuffer>
type SeekFn = (offset: number) => Promise<void>

const SIZE_PREFIX_LEN: number = 4

export const magicbytes: Uint8Array = new Uint8Array([0x66, 0x67, 0x62, 0x03, 0x66, 0x67, 0x62, 0x00])

export function serialize(features: IFeature[]) {
	const headerMeta = introspectHeaderMeta(features)
	const header = buildHeader(headerMeta)
	const featureBuffers: Uint8Array[] = features
		.map(f => buildFeature(f, headerMeta))
	const featuresLength = featureBuffers
		.map(f => f.length)
		.reduce((a, b) => a + b)
	const uint8 = new Uint8Array(magicbytes.length + header.length + featuresLength)
	uint8.set(header, magicbytes.length)
	let offset = magicbytes.length + header.length
	for (const feature of featureBuffers) {
		uint8.set(feature, offset)
		offset += feature.length
	}
	uint8.set(magicbytes)
	return uint8
}

export function deserialize(bytes: Uint8Array, fromFeature: FromFeatureFn) {
	if (!bytes.subarray(0, 7).every((v, i) => magicbytes[i] === v))
		throw new Error('Not a FlatGeobuf file')

	const bb = new flatbuffers.ByteBuffer(bytes)
	const headerLength = bb.readUint32(magicbytes.length)
	bb.setPosition(magicbytes.length + SIZE_PREFIX_LEN)
	const header = Header.getRoot(bb)
	const count = header.featuresCount().toFloat64()

	const columns: ColumnMeta[] = []
	for (let j = 0; j < header.columnsLength(); j++) {
		const column = header.columns(j)
		columns.push(new ColumnMeta(column.name(), column.type()))
	}
	const headerMeta = new HeaderMeta(header.geometryType(), columns, 0)

	let offset = magicbytes.length + SIZE_PREFIX_LEN + headerLength

	const indexNodeSize = header.indexNodeSize()
	if (indexNodeSize > 0)
		offset += calcTreeSize(count, indexNodeSize)

	const features = []
	while (offset < bb.capacity()) {
		const featureLength = bb.readUint32(offset)
		bb.setPosition(offset + SIZE_PREFIX_LEN)
		const feature = Feature.getRoot(bb)
		features.push(fromFeature(feature, headerMeta))
		offset += SIZE_PREFIX_LEN + featureLength
	}

	return features
}

export function deserializeStream(stream, fromFeature) {
  const reader = slice(stream)
  /** @type {ReadFn} */
	const read = async size => await reader.slice(size)
	return deserializeInternal(read, undefined, undefined, fromFeature)
}

export function deserializeFiltered(url, rect, fromFeature) {
	let offset = 0
  /** @type {ReadFn} */
	const read readFn = async size => {
		const response = await fetch(url, {
			headers: {
				'Range': `bytes=${offset}-${offset + size - 1}`
			}
		})
		offset += size
		const arrayBuffer = await response.arrayBuffer()
		return arrayBuffer
  }
  /** @type {SeekFn} */
	const seek = async newoffset => { offset = newoffset }
	return deserializeInternal(read, seek, rect, fromFeature)
}

// eslint-disable-next-line max-statements
async function* deserializeInternal(read, seek, rect, fromFeature) {
	let offset = 0
	let bytes = new Uint8Array(await read(8))
	offset += 8
	if (!bytes.every((v, i) => magicbytes[i] === v))
		throw new Error('Not a FlatGeobuf file')
	bytes = new Uint8Array(await read(4))
	offset += 4
	let bb = new flatbuffers.ByteBuffer(bytes)
	const headerLength = bb.readUint32(0)
	bytes = new Uint8Array(await read(headerLength))
	offset += headerLength
	bb = new flatbuffers.ByteBuffer(bytes)
	const header = Header.getRoot(bb)
	const count = header.featuresCount().toFloat64()

  /** @type {ColumnMeta[]} */
	const columns = []
	for (let j = 0; j < header.columnsLength(); j++) {
		const column = header.columns(j)
		columns.push(new ColumnMeta(column.name(), column.type()))
	}
	const headerMeta = new HeaderMeta(header.geometryType(), columns, count)

	const indexNodeSize = header.indexNodeSize()
	if (indexNodeSize > 0) {
		const treeSize = calcTreeSize(count, indexNodeSize)
		if (rect) {
			const readNode = async (treeOffset, size) => {
				await seek(offset + treeOffset)
				return await read(size)
			}
			const foundOffsets = []
			for await (const [foundOffset] of treeStreamSearch(count, indexNodeSize, rect, readNode)) {
				foundOffsets.push(foundOffset)
			}
			offset += treeSize
			for await (const foundOffset of foundOffsets) {
				await seek(offset + foundOffset)
				yield await readFeature(read, headerMeta, fromFeature)
			}
			return
		}
		if (seek)
			await seek(offset + treeSize)
		else
			await read(treeSize)
		offset += treeSize
	}
	let feature
	while ((feature = await readFeature(read, headerMeta, fromFeature))) {
		yield feature
	}
}

async function readFeature(read, headerMeta, fromFeature) {
	let bytes = new Uint8Array(await read(4))
	if (bytes.byteLength === 0)
		return null
	let bb = new flatbuffers.ByteBuffer(bytes)
	const featureLength = bb.readUint32(0)
	bytes = new Uint8Array(await read(featureLength))
	const bytesAligned = new Uint8Array(featureLength + 4)
	bytesAligned.set(bytes, 4)
	bb = new flatbuffers.ByteBuffer(bytesAligned)
	bb.setPosition(SIZE_PREFIX_LEN)
	const feature = Feature.getRoot(bb)
	return fromFeature(feature, headerMeta)
}

/**
 *
 * @param {flatbuffers.Builder} builder
 * @param {ColumnMeta} column
 */
function buildColumn(builder, column) {
	const nameOffset = builder.createString(column.name)
	Column.start(builder)
	Column.addName(builder, nameOffset)
	Column.addType(builder, column.type)
	return Column.end(builder)
}

export function buildHeader(header) {
	const builder = new flatbuffers.Builder(0)

	let columnOffsets = null
	if (header.columns)
		columnOffsets = Header.createColumnsVector(builder,
			header.columns.map(c => buildColumn(builder, c)))

	const nameOffset = builder.createString('L1')

	Header.start(builder)
	Header.addFeaturesCount(builder, new flatbuffers.Long(header.featuresCount, 0))
	Header.addGeometryType(builder, header.geometryType)
	Header.addIndexNodeSize(builder, 0)
	if (columnOffsets)
		Header.addColumns(builder, columnOffsets)
	Header.addName(builder, nameOffset)
	const offset = Header.end(builder)
	builder.finishSizePrefixed(offset)
	return builder.asUint8Array()
}

/**
 *
 * @param {boolean | number | string | object} value
 * @returns ColumnType
 */
function valueToType(value) {
	if (typeof value === 'boolean')
		return ColumnType.Bool
	else if (typeof value === 'number')
		if (value % 1 === 0)
			return ColumnType.Int
		else
			return ColumnType.Double
	else if (typeof value === 'string')
		return ColumnType.String
	else if (value === null)
		return ColumnType.String
	else
		throw new Error(`Unknown type (value '${value}')`)
}

function introspectHeaderMeta(features) {
	const feature = features[0]
	const geometry = feature.getGeometry()
	const geometryType = geometry.getType()
	const properties = feature.getProperties()

	let columns = null
	if (properties)
		columns = Object.keys(properties).filter(key => key !== 'geometry')
			.map(k => new ColumnMeta(k, valueToType(properties[k])))

	const geometryTypeNamesSet = new Set()
	for (const f of features)
		geometryTypeNamesSet.add(geometryType)

	const headerMeta = new HeaderMeta(toGeometryType(geometryType), columns, features.length)
	return headerMeta
}
