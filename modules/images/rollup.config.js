import {terser} from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

const config = ({file, plugins = [], globals = {}, external = []}) => ({
  input: 'src/bundle.js',
  output: {
    file,
    format: 'iife',
    name: 'LoadersGLImagesModule',
    globals: {
      ...globals,
      '@loaders.gl/core': 'loaders'
    }
  },
  external: [...external, '@loaders.gl/core'],
  plugins: [
    ...plugins,
    resolve({
      browser: true,
      preferBuiltins: true
    }),
    commonjs(),
    json()
  ]
});

export default [
  config({
    file: 'dist/dist.dev.js',
    globals: {},
    external: ['@loaders.gl/core']
  }),
  config({
    file: 'dist/dist.min.js',
    plugins: [terser()],
    globals: {},
    external: ['@loaders.gl/core']
  })
];
