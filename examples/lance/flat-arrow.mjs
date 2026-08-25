import {LanceLoaderWithParser} from '@loaders.gl/lance/lance-loader'

// A tiny one-column Lance file: three little-endian int32 values followed by
// the metadata tables and the fixed Lance footer.
const bytes = new Uint8Array(128)
const view = new DataView(bytes.buffer)
view.setInt32(0, 10, true)
view.setInt32(4, 20, true)
view.setInt32(8, 30, true)
bytes.set([0x12, 0x0a, 0x0a, 0x01, 0x00, 0x12, 0x01, 0x0c, 0x18, 0x03, 0x28, 0x00], 16)
view.setBigUint64(32, 16n, true)
view.setBigUint64(40, 12n, true)
view.setBigUint64(48, 48n, true)
view.setUint32(56, 0, true)
view.setUint32(60, 1, true)
view.setUint16(64, 2, true)
view.setUint16(66, 1, true)
view.setBigUint64(88, 16n, true)
view.setBigUint64(96, 32n, true)
view.setBigUint64(104, 48n, true)
view.setUint32(112, 0, true)
view.setUint32(116, 1, true)
view.setUint16(120, 2, true)
view.setUint16(122, 1, true)
bytes.set([0x4c, 0x41, 0x4e, 0x43], 124)

const result = await LanceLoaderWithParser.parse(bytes.buffer, {
  lance: {columnTypes: ['int32'], columnNames: ['id']}
})

console.log(result.data.toArray())
