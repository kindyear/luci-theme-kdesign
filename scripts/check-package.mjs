import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const relative = (file) => path.relative(projectRoot, file).split(path.sep).join('/');

function assert(condition, message) {
  if (!condition)
    throw new Error(message);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`Package payload contains symbolic link: ${relative(file)}`);
    if (entry.isDirectory())
      files.push(...await walk(file));
    else if (entry.isFile())
      files.push(file);
  }

  return files;
}

const iconNames = [
  'activity', 'boxes', 'chevron-right', 'log-out', 'menu', 'monitor', 'moon',
  'network', 'settings', 'shield', 'sun', 'wifi', 'x'
];

const required = [
  'Makefile',
  'LICENSE',
  'htdocs/luci-static/kdesign/cascade.css',
  'htdocs/luci-static/kdesign/theme.js',
  'htdocs/luci-static/kdesign/logo.svg',
  'htdocs/luci-static/kdesign/icons/LICENSE.lucide.txt',
  ...iconNames.map((name) => `htdocs/luci-static/kdesign/icons/${name}.svg`),
  'htdocs/luci-static/resources/menu-kdesign.js',
  'ucode/template/themes/kdesign/header.ut',
  'ucode/template/themes/kdesign/footer.ut',
  'ucode/template/themes/kdesign/sysauth.ut',
  'root/etc/uci-defaults/30_luci-theme-kdesign'
];

for (const name of required) {
  const info = await lstat(path.join(projectRoot, name));
  assert(info.isFile(), `Required package source is not a file: ${name}`);
  assert(info.size > 0, `Required package source is empty: ${name}`);
}

const payloadRoots = ['htdocs', 'ucode', 'root'].map((name) => path.join(projectRoot, name));
const payloadFiles = (await Promise.all(payloadRoots.map(walk))).flat().sort();
let payloadBytes = 0;

for (const file of payloadFiles) {
  const info = await lstat(file);
  const name = relative(file);
  assert(info.size > 0, `Package payload contains empty file: ${name}`);
  assert((info.mode & 0o002) === 0, `Package payload contains world-writable file: ${name}`);
  payloadBytes += info.size;

  const content = await readFile(file);
  assert(!content.includes(Buffer.from('\r\n')), `Package payload contains CRLF line endings: ${name}`);
}

const defaultsPath = path.join(projectRoot, 'root/etc/uci-defaults/30_luci-theme-kdesign');
const defaultsInfo = await lstat(defaultsPath);
assert((defaultsInfo.mode & 0o111) !== 0, 'UCI defaults script must be executable');
execFileSync('/bin/sh', ['-n', defaultsPath], { stdio: 'pipe' });

const [makefile, header, footer, sysauth, defaults, menu, css, themeJs] = await Promise.all([
  'Makefile',
  'ucode/template/themes/kdesign/header.ut',
  'ucode/template/themes/kdesign/footer.ut',
  'ucode/template/themes/kdesign/sysauth.ut',
  'root/etc/uci-defaults/30_luci-theme-kdesign',
  'htdocs/luci-static/resources/menu-kdesign.js',
  'htdocs/luci-static/kdesign/cascade.css',
  'htdocs/luci-static/kdesign/theme.js'
].map((name) => readFile(path.join(projectRoot, name), 'utf8')));

assert(makefile.includes('LUCI_DEPENDS:=+luci-base'), 'Makefile must depend on luci-base');
assert(makefile.includes('LUCI_PKGARCH:=all'), 'Theme package must remain architecture-independent');
assert(makefile.includes('LUCI_MINIFY_CSS:=0'), 'Makefile must disable the second CSS minification pass');
assert(makefile.includes('LUCI_MINIFY_JS:=0'), 'Makefile must disable the second JavaScript minification pass');
assert(
  makefile.includes('include $(TOPDIR)/feeds/luci/luci.mk'),
  'Makefile must use the LuCI package build framework from the build tree'
);
assert(makefile.includes('uci -q delete luci.themes.KDesign'), 'postrm must remove the registered KDesign theme');

assert(defaults.includes("luci.themes.KDesign='/luci-static/kdesign'"), 'UCI defaults must register the KDesign media path');
assert(defaults.includes('uci commit luci'), 'UCI defaults must commit the theme registration');

assert(header.indexOf('{{ media }}/theme.js') < header.indexOf('{{ media }}/cascade.css'), 'Appearance script must load before CSS to avoid a theme flash');
assert(header.includes('{{ resource }}/cbi.js'), 'Header must load the LuCI CBI runtime');
assert(header.includes("dispatcher.build_url('admin/translations'"), 'Header must load LuCI translations');
assert(header.includes('data-page="{{ entityencode(join('), 'Header must expose the dispatched route for scoped CSS');
assert(footer.includes("L.require('menu-kdesign')"), 'Footer must initialize the KDesign menu adapter');

assert(sysauth.includes('method="post"'), 'Authentication form must submit with POST');
assert(sysauth.includes('name="luci_username"'), 'Authentication form must preserve luci_username');
assert(sysauth.includes('name="luci_password"'), 'Authentication form must preserve luci_password');
assert(sysauth.includes('{% if (auth_fields): %}'), 'Authentication template must preserve plugin fields');
assert(sysauth.includes('{% if (auth_html): %}'), 'Authentication template must preserve plugin HTML');
assert(sysauth.includes('{% if (auth_assets): %}'), 'Authentication template must preserve plugin assets');

assert(menu.includes("'require baseclass'"), 'Menu adapter must use the LuCI baseclass module');
assert(menu.includes('ui.menu.load()'), 'Menu adapter must use LuCI dynamic menu data');
assert(!menu.includes('/admin/'), 'Menu adapter must not hardcode application routes');

const runtime = `${css}\n${themeJs}\n${menu}`;
assert(!/sourceMappingURL/.test(runtime), 'Generated runtime must not contain source map references');
assert(!/\b(?:require|import)\s*\(?['"](?:react|vue|svelte)/i.test(runtime), 'Generated runtime must not include a frontend framework');

const digest = createHash('sha256');
for (const file of payloadFiles)
  digest.update(relative(file)).update('\0').update(await readFile(file));

console.log(`Package payload checks passed (${payloadFiles.length} files, ${payloadBytes} bytes, SHA-256 ${digest.digest('hex').slice(0, 16)}…)`);
