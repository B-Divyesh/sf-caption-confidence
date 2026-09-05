import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const claims = JSON.parse(await readFile(new URL('../.factory/claims.json', import.meta.url), 'utf8'));
let failures = 0;

for (const claim of claims) {
  console.log(`CLAIM ${claim.id}: ${claim.claim}`);
  console.log(`RUN   ${claim.test}`);
  const result = spawnSync(claim.test, {
    cwd: new URL('..', import.meta.url),
    env: process.env,
    shell: true,
    stdio: 'inherit'
  });
  if (result.status === 0) {
    console.log(`PASS  ${claim.id}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${claim.id} (exit ${result.status ?? 'unknown'})`);
  }
}

if (failures) {
  console.error(`${failures} claim command(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`All ${claims.length} declared claim commands passed.`);
}
