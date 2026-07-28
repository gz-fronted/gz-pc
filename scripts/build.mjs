import { build } from 'tsup';

await build({
  entry: {
    'fetch/index': '././src/fetch/index.ts',
    'hooks/index': '././src/hooks/index.ts',
    'utils/index': '././src/utils/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  external: ['react', 'ahooks', 'axios', '@chenhui996/gg-ui'],
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
