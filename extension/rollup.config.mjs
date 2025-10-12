import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import copy from 'rollup-plugin-copy';

export default [
  // Bundle for background.js (if needed)
  {
    input: 'background.js',
    output: {
      dir: 'dist',
      format: 'iife',
      entryFileNames: '[name].js',
    },
    plugins: [
      commonjs(),
      nodeResolve({ browser: true, preferBuiltins: false }),
      copy({
        targets: [
          {
            src: [
              'manifest.json',
              'background.js',
              'onboard',
              'shared',
              'icons',
              'visual',
              'auditory',
              'autism',
              'request-mic.html',
              'tailwind_v405.js',
              'request-mic.js'
            ],
            dest: 'dist'
          }
        ]
      })
    ]
  },
  // Bundle for auditory UI
  {
    input: 'auditory/main.js',
    output: {
      dir: 'dist',
      format: 'esm',
      sourcemap: true,
      entryFileNames: 'auditory.bundle.js'
    },
    plugins: [
      commonjs(),
      nodeResolve({ browser: true, preferBuiltins: false })
    ]
  }
];
