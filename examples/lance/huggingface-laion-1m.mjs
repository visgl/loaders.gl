import {createRequire} from 'node:module'

const require = createRequire(import.meta.url)
const {LanceSourceLoader, readLanceRemoteFileToArrow} = require('@loaders.gl/lance')

const source = LanceSourceLoader.createDataSource(
  'https://huggingface.co/datasets/lance-format/laion-1m/resolve/main/data/train.lance',
  {lance: {version: 3}}
)
const metadata = await source.getMetadata()

console.log(`Lance snapshot version: ${metadata.version}`)
console.log(`Fragments: ${metadata.fragments.length}`)
console.table(metadata.fields.map(({id, name, logicalType}) => ({id, name, logicalType})))

const firstFile = metadata.fragments[0].files[0]
const fileURL = `https://huggingface.co/datasets/lance-format/laion-1m/resolve/main/data/train.lance/data/${firstFile.path}`
const sample = await readLanceRemoteFileToArrow(
  fileURL,
  firstFile.fileSizeBytes,
  [
    {index: 3, name: 'similarity', type: 'double'},
    {index: 9, name: 'width', type: 'int64'},
    {index: 10, name: 'height', type: 'int64'}
  ],
  5
)
console.table(sample.data.toArray().map(row => ({
  similarity: row.similarity,
  width: row.width.toString(),
  height: row.height.toString()
})))
console.log(
  'The sample above was read as Arrow using HTTP range requests; image, caption, and embedding columns remain deferred.'
)
