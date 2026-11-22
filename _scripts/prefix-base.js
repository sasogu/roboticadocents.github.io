#!/usr/bin/env node
/**
 * Antepone una subruta a las URL absolutas de raíz (/_css/…, /es/…) de un sitio
 * ya compilado. Sirve para publicarlo en GitHub Pages de un fork (project page,
 * https://<usuario>.github.io/<repo>/), donde «/» no es la raíz del sitio.
 *
 * Uso: node _scripts/prefix-base.js <directorio> <subruta, p. ej. /mi-repo>
 */
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
const base = (process.argv[3] || '').replace(/\/+$/, '');
if (!dir || !base.startsWith('/')) {
  console.error('Uso: node _scripts/prefix-base.js <directorio> </subruta>');
  process.exit(1);
}

const ABS = '\\/(?!\\/)'; // «/» inicial que no es «//»
const rules = [
  [new RegExp(`(\\b(?:href|src|action|poster|content|data-[a-z0-9-]+)=")${ABS}`, 'g'), `$1${base}/`],
  [new RegExp(`(\\burl=)${ABS}`, 'g'), `$1${base}/`],
  [new RegExp(`(url\\(\\s*['"]?)${ABS}`, 'g'), `$1${base}/`],
  [new RegExp(`(\\bsrcset=")([^"]*)"`, 'g'), (m, a, v) =>
    `${a}${v.replace(/(^|,\s*)\/(?!\/)/g, `$1${base}/`)}"`],
];

let files = 0;
let changed = 0;
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(html|css)$/.test(e.name)) {
      files++;
      const src = fs.readFileSync(p, 'utf8');
      let out = src;
      for (const [re, rep] of rules) out = out.replace(re, rep);
      if (out !== src) { fs.writeFileSync(p, out); changed++; }
    }
  }
})(dir);
console.log(`prefix-base: ${changed}/${files} ficheros HTML/CSS con subruta ${base}`);
