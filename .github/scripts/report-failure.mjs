// Posts the captured failure log of a build step as a GitHub Issue so failures
// are visible without requiring access to the Actions log archive.
import fs from 'node:fs';

const logFile = process.argv[2];
const runId = process.argv[3] || '';
const stepName = process.argv[4] || 'step';

let log = '';
try {
  log = fs.readFileSync(logFile, 'utf8').slice(0, 6000);
} catch {
  // no captured log
}
if (!log.trim()) process.exit(0);

const body = [
  `Auto-reported failure in **${stepName}** (run ${runId}).`,
  '',
  '```',
  log,
  '```',
].join('\n');

const res = await fetch(
  `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/issues`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `[auto] APK build failed in ${stepName}`,
      body,
    }),
  }
);
console.log(`issue post status: ${res.status}`);
process.exit(0);