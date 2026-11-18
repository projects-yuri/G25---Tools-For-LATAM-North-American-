
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('./', import.meta.url);

const sourceFiles = {
  iron: 'iron-age',
  neo: 'neolithic',
  colonial: 'colonial'
};

let html = await readFile(
  new URL('src/poster.html', root),
  'utf8'
);

for (const [period, filename] of Object.entries(sourceFiles)) {
  const sources = (
    await readFile(
      new URL(`sources/${filename}.txt`, root),
      'utf8'
    )
  )
    .replace(/^\uFEFF/, '')
    .trim();

  const rows = sources
    .split(/\r?\n/)
    .map((line, index) => ({
      line: line.trim(),
      number: index + 1
    }))
    .filter(({ line }) =>
      line &&
      !line.startsWith('#') &&
      !/^Sources\s*:/i.test(line)
    );

  if (!rows.length) {
    throw new Error(
      `sources/${filename}.txt is empty`
    );
  }

  for (const { line, number } of rows) {
    const [label, ...coordinates] = line
      .split(',')
      .map(value => value.trim());

    if (
      !label ||
      coordinates.length !== 25 ||
      coordinates.some(value =>
        !value || !Number.isFinite(Number(value))
      )
    ) {
      throw new Error(
        `sources/${filename}.txt:${number} needs a name and 25 finite coordinates`
      );
    }
  }

  if (/<\/script/i.test(sources)) {
    throw new Error(
      `sources/${filename}.txt contains a closing script tag`
    );
  }

  // Localiza o bloco pelo ID, mesmo que tenha
  // atributos adicionais ou dados já preenchidos.
  const block = new RegExp(
    `(<script\\b[^>]*\\bid=["']initial-${period}["'][^>]*>)[\\s\\S]*?(<\\/script\\s*>)`,
    'i'
  );

  if (!block.test(html)) {
    throw new Error(
      `Missing source script for ${period}`
    );
  }

  // Preserva os atributos e atualiza as coordenadas.
  html = html.replace(
    block,
    (_match, openingTag, closingTag) =>
      openingTag + '\n' + sources + '\n' + closingTag
  );
}

await mkdir(
  new URL('dist/', root),
  { recursive: true }
);

await writeFile(
  new URL('dist/index.html', root),
  html
);

console.log('Built dist/index.html');
