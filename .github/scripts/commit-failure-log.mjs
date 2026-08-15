// Commits a captured failure log into the repo at debug/<name> so build
// failures can be inspected without access to the Actions log archive.
import fs from 'node:fs';

const log = fs.readFileSync(process.argv[2], 'utf8') || '';
const name = process.argv[3] || 'failure.log';
if (!log.trim()) process.exit(0);

const res = await fetch(
  `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/contents/debug/${name}`,
  {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `debug: build failure log ${name}`,
      content: Buffer.from(log).toString('base64'),
      branch: 'main',
    }),
  }
);
console.log(`failure log commit status: ${res.status}`);
process.exit(0);