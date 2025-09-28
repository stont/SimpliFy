import copy from 'rollup-plugin-copy';

export default {
  input: 'sidepanel/index.js',
  output: {
    file: 'dist/sidepanel.bundle.js',
    format: 'iife',
  },
  plugins: [
    copy({
      targets: [
        { src: 'manifest.json', dest: 'dist' },
        { src: 'sidepanel/index.html', dest: 'dist/sidepanel' },
        { src: 'background.js', dest: 'dist' },
        { src: 'images', dest: 'dist' },
      ],
      verbose: true,
      flatten: false,
    }),
  ],
};

