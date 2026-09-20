import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = path.join(projectRoot, 'dist');
const archivePath = path.join(distRoot, 'luci-theme-kdesign-source.tar.gz');
const temporaryRoot = await mkdtemp(path.join(tmpdir(), 'kdesign-package-'));
const stagingRoot = path.join(temporaryRoot, 'luci-theme-kdesign');

const sources = [
  'Makefile',
  'LICENSE',
  'README.md',
  'htdocs',
  'ucode',
  'root'
];

try {
  await mkdir(stagingRoot, { recursive: true });
  await Promise.all(sources.map((name) => cp(
    path.join(projectRoot, name),
    path.join(stagingRoot, name),
    { recursive: true, preserveTimestamps: true }
  )));
  await mkdir(distRoot, { recursive: true });

  execFileSync('/usr/bin/tar', [
    '-czf', archivePath,
    '--uid', '0',
    '--gid', '0',
    '--uname', 'root',
    '--gname', 'root',
    '-C', temporaryRoot,
    'luci-theme-kdesign'
  ], {
    env: { ...process.env, COPYFILE_DISABLE: '1' },
    stdio: 'pipe'
  });

  const archive = await readFile(archivePath);
  const digest = createHash('sha256').update(archive).digest('hex');
  console.log(`Created ${path.relative(projectRoot, archivePath)} (${archive.byteLength} bytes, SHA-256 ${digest})`);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}
