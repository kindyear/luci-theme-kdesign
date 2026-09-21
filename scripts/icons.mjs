import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const iconNames = [
  'activity',
  'boxes',
  'chevron-right',
  'log-out',
  'menu',
  'monitor',
  'moon',
  'network',
  'panel-left-close',
  'panel-left-open',
  'settings',
  'shield',
  'sun',
  'wifi',
  'x'
];

export async function buildIcons() {
  const sourceDir = path.join(projectRoot, 'node_modules/lucide-static/icons');
  const outputDir = path.join(projectRoot, 'htdocs/luci-static/kdesign/icons');

  await mkdir(outputDir, { recursive: true });

  await Promise.all(iconNames.map((name) =>
    copyFile(path.join(sourceDir, `${name}.svg`), path.join(outputDir, `${name}.svg`))
  ));

  await copyFile(
    path.join(projectRoot, 'node_modules/lucide-static/LICENSE'),
    path.join(outputDir, 'LICENSE.lucide.txt')
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildIcons();
}
