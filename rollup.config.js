import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import pkg from './package.json'

const banner = `/**
 * Router - ${pkg.description}
 *
 * @version ${pkg.version}
 * @license MIT
 * @copyright Dmitry Dudin <dima@nuware.ru> 2018
 */`

export default [{
  input: 'src/index.js',
  external: ['@nuware/functions', '@nuware/effect'],
  output: {
    file: pkg.module,
    format: 'esm',
    banner
  }
}, {
  input: 'src/index.js',
  external: ['@nuware/functions', '@nuware/effect'],
  output: {
    file: pkg.main,
    format: 'cjs',
    banner
  }
}, {
  input: 'src/index.js',
  output: {
    file: pkg.browser,
    format: 'umd',
    name: 'nuware.Router',
    banner
  },
  plugins: [
    resolve(),
    commonjs()
  ]
}, {
  input: 'src/index.js',
  output: {
    file: pkg.minimized,
    format: 'umd',
    name: 'nuware.Router'
  },
  plugins: [
    resolve(),
    commonjs(),
    terser()
  ]
}]
