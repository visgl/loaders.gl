import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'app.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife', // immediately-invoked function expression — suitable for <script> tags
    sourcemap: true
  },
  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs()
  ]
};
