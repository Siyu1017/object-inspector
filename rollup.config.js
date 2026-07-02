import terser from '@rollup/plugin-terser';
import postcss from 'rollup-plugin-postcss';
import typescript from '@rollup/plugin-typescript';
import fs from 'fs';
import pkg from './package.json' with { type: 'json' };

fs.rmSync('dist', { recursive: true, force: true });

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/index.js',
            format: 'esm',
            sourcemap: true,
            banner: `/*!
 * object-inspector v${pkg.version}
 * Copyright (c) Siyu1017 ${new Date().getFullYear()}
 */`,
            intro: `const __VERSION__ = '${pkg.version}';`
        },
        {
            file: 'dist/index.umd.js',
            format: 'umd',
            name: 'ObjectInspector',
            sourcemap: true,
            banner: `/*!
 * object-inspector v${pkg.version}
 * Copyright (c) Siyu1017 ${new Date().getFullYear()}
 */`,
            intro: `const __VERSION__ = '${pkg.version}';`
        }
    ],
    plugins: [
        typescript({
            tsconfig: './tsconfig.json'
        }),
        postcss({
            modules: true,
            extract: false,
            minimize: true
        }),
        terser()
    ]
};
