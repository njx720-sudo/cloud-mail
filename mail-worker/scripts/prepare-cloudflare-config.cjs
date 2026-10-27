'use strict';

const fs = require('node:fs');
const path = require('node:path');

const inputPath = path.resolve(__dirname, '..', 'wrangler.toml');
const outputPath = path.resolve(__dirname, '..', 'wrangler.codex.generated.toml');

function requiredValue(name, pattern) {
  const value = process.env[name];
  if (!value || !pattern.test(value)) {
    throw new Error(`Missing or invalid Cloudflare build variable: ${name}`);
  }
  return JSON.stringify(value);
}

const d1Name = requiredValue('MAIL_D1_DATABASE_NAME', /^[a-zA-Z0-9_-]+$/);
const d1Id = requiredValue('MAIL_D1_DATABASE_ID', /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
const kvId = requiredValue('MAIL_KV_NAMESPACE_ID', /^[0-9a-f]{32}$/i);
const customDomain = requiredValue('MAIL_CUSTOM_DOMAIN', /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i);

const original = fs.readFileSync(inputPath, 'utf8');
for (const [description, expression] of [
  ['a D1 binding', /^\s*\[\[\s*d1_databases\s*\]\]/m],
  ['a KV binding', /^\s*\[\[\s*kv_namespaces\s*\]\]/m],
  ['a route', /^\s*(?:\[\[\s*routes\s*\]\]|routes?\s*=)/m],
  ['a workers.dev setting', /^\s*workers_dev\s*=/m],
]) {
  if (expression.test(original)) {
    throw new Error(`Upstream configuration already defines ${description}; review it before deployment.`);
  }
}
if (!/^\s*keep_vars\s*=\s*true\s*(?:#.*)?$/m.test(original)) {
  throw new Error('Upstream configuration must preserve dashboard variables with keep_vars = true.');
}

const generated = `workers_dev = true\n${original.trimEnd()}\n\n` +
  `[[d1_databases]]\nbinding = "db"\ndatabase_name = ${d1Name}\ndatabase_id = ${d1Id}\n\n` +
  `[[kv_namespaces]]\nbinding = "kv"\nid = ${kvId}\n\n` +
  `[[routes]]\npattern = ${customDomain}\ncustom_domain = true\n`;

fs.writeFileSync(outputPath, generated, { encoding: 'utf8', mode: 0o600 });
console.log('Generated temporary Wrangler configuration with the existing database, KV namespace, and domain.');
