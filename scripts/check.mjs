import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = {
  css: path.join(projectRoot, 'htdocs/luci-static/kdesign/cascade.css'),
  js: path.join(projectRoot, 'htdocs/luci-static/kdesign/theme.js'),
  menu: path.join(projectRoot, 'htdocs/luci-static/resources/menu-kdesign.js')
};

const [css, js, menu] = await Promise.all(Object.values(files).map((file) => readFile(file, 'utf8')));
const runtime = `${css}\n${js}\n${menu}`;
const forbidden = [
  ['remote HTTP resource', /https?:\/\//],
  ['eval()', /\beval\s*\(/],
  ['new Function()', /\bnew\s+Function\s*\(/],
  ['React runtime', /\bReact\b/],
  ['Vue runtime', /\bVue\b/]
];

for (const [label, pattern] of forbidden) {
  if (pattern.test(runtime))
    throw new Error(`Generated runtime contains forbidden ${label}`);
}

for (const file of Object.values(files))
  await stat(file);

const cssGzip = gzipSync(css).byteLength;
const jsGzip = gzipSync(`${js}\n${menu}`).byteLength;

if (cssGzip > 150 * 1024)
  throw new Error(`CSS gzip budget exceeded: ${cssGzip} bytes`);

if (jsGzip > 30 * 1024)
  throw new Error(`JavaScript gzip budget exceeded: ${jsGzip} bytes`);

console.log(`Runtime checks passed (CSS gzip ${cssGzip} B, JS gzip ${jsGzip} B)`);
