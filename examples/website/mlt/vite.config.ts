import {defineConfig} from 'vite'
import {resolve} from 'path'

const ROOT = resolve(__dirname, '../../..')

export default defineConfig({
  resolve: {
    alias: [
      {find: '@loaders.gl/mlt', replacement: `${ROOT}/modules/mlt/src`},
      {find: '@loaders.gl/core', replacement: `${ROOT}/modules/core/src`},
      {find: '@loaders.gl/gis', replacement: `${ROOT}/modules/gis/src`},
      {find: '@loaders.gl/loader-utils', replacement: `${ROOT}/modules/loader-utils/src`},
      {find: '@loaders.gl/schema', replacement: `${ROOT}/modules/schema/src`}
    ]
  },
  server: {open: true}
})
