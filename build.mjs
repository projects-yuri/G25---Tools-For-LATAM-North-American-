import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('./', import.meta.url);
const sourceFiles = {
  iron: 'iron-age',
  neo: 'neolithic',
  colonial: 'colonial'
};

let html = await readFile(new URL('src/poster.html', root), 'utf8');
for (const [period, filename] of Object.entries(sourceFiles)) {
  const sources = (await readFile(new URL('sources/' + filename + '.txt', root), 'utf8'))
    .replace(/^\uFEFF/, '')
    .trim();
  const lines = sources.split(/\r?\n/);
  const rows = lines.map((line, index) => ({ line: line.trim(), number: index + 1 }))
    .filter(({ line }) => line && !line.startsWith('#') && !/^Sources\s*:/i.test(line));
  if (!rows.length) throw new Error('sources/' + filename + '.txt is empty');
  for (const { line, number } of rows) {
    const [label, ...coordinates] = line.split(',').map(value => value.trim());
    if (!label || coordinates.length !== 25 || coordinates.some(value => !value || !Number.isFinite(Number(value)))) {
      throw new Error('sources/' + filename + '.txt:' + number + ' needs a name and 25 finite coordinates');
    }
  }
  if (/<\/script/i.test(sources)) {
    throw new Error('sources/' + filename + '.txt contains a closing script tag');
  }
  const placeholder = '<script id="initial-' + period + '" type="text/plain"></script>';
  if (!html.includes(placeholder)) throw new Error('Missing source placeholder for ' + period);
  html = html.replace(placeholder, () => placeholder.replace('</script>', sources + '\n</script>'));
}

await mkdir(new URL('dist/', root), { recursive: true });
await writeFile(new URL('dist/index.html', root), html);
console.log('Built dist/index.html');
