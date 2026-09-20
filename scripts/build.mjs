import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { minify } from 'terser';
import chokidar from 'chokidar';
import { buildIcons } from './icons.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(projectRoot, 'htdocs/luci-static');
const themeOutput = path.join(outputRoot, 'kdesign');
const isWatch = process.argv.includes('--watch');

async function buildCss() {
  const from = path.join(projectRoot, 'src/styles/index.css');
  const to = path.join(themeOutput, 'cascade.css');
  const source = await readFile(from, 'utf8');
  const result = await postcss([
    postcssImport(),
    tailwindcss({ config: path.join(projectRoot, 'tailwind.config.js') }),
    autoprefixer(),
    cssnano({ preset: 'default' })
  ]).process(source, { from, to, map: false });

  await writeFile(to, result.css);
}

async function buildThemeScript() {
  const source = await readFile(path.join(projectRoot, 'src/scripts/theme.js'), 'utf8');
  const result = await minify(source, {
    compress: true,
    mangle: true,
    ecma: 2018,
    format: { comments: false }
  });

  if (!result.code)
    throw new Error('Theme JavaScript minification produced no output');

  await writeFile(path.join(themeOutput, 'theme.js'), result.code);
}

async function copyRuntimeFiles() {
  await copyFile(
    path.join(projectRoot, 'src/scripts/menu-kdesign.js'),
    path.join(outputRoot, 'resources/menu-kdesign.js')
  );
}

async function build() {
  const startedAt = Date.now();
  await mkdir(themeOutput, { recursive: true });
  await Promise.all([buildCss(), buildThemeScript(), buildIcons(), copyRuntimeFiles()]);
  console.log(`Built KDesign assets in ${Date.now() - startedAt}ms`);
}

let queued = Promise.resolve();
function queueBuild() {
  queued = queued.then(build).catch((error) => console.error(error));
}

await build();

if (isWatch) {
  console.log('Watching source and template files…');
  chokidar.watch([
    path.join(projectRoot, 'src'),
    path.join(projectRoot, 'ucode'),
    path.join(projectRoot, 'tailwind.config.js')
  ], { ignoreInitial: true }).on('all', queueBuild);
}
