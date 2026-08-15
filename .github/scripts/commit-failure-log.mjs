// Commits a captured failure log into the repo at debug/<name> so build
// failures can be inspected without access to the Actions log archive.
import fs from 'node:fs';

const logPath = process.argv[2];
const name = process.argv[3] || 'failure.log';
const runId = process.env.GITHUB_RUN_ID ?? 'unknown';

let log = '';
try {
  log = fs.readFileSync(logPath, 'utf8') || '';
} catch (err) {
  log = `(could not read ${logPath}: ${err.message})`;
}
if (!log.trim()) log = '(command produced no output)';

const header =
  `# ${name}\n` +
  `Generated from GitHub Actions run ${runId} (${new Date().toISOString()}).\n\n`;

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
      message: `debug: build failure log ${name} (run ${runId})`,
      content: Buffer.from(header + log).toString('base64'),
      branch: 'main',
    }),
  }
);
const body = await res.text();
console.log(`failure log commit status: ${res.status}`);
if (!res.ok) console.log(body);
process.exit(0);