import { build } from 'tsup';

await build({
  entry: {
    'fetch/index': '././src/fetch/index.ts',
    'hooks/index': '././src/hooks/index.ts',
    'utils/index': '././src/utils/index.ts',
  },
  format: ['esm', 'cjs'],
  target: 'es2018',
  dts: true,
  clean: true,
  sourcemap: false,
  splitting: false,
  treeshake: true,
  external: ['react', 'ahooks', 'axios', '@chenhui996/gg-ui'],
  esbuildOptions(options) {
    options.charset = 'utf8';
  },
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
