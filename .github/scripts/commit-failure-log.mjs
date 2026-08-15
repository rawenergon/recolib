// Commits a captured failure log into the repo at debug/<name> so build
// failures can be inspected without access to the Actions log archive.
// Also emits the log via ::error:: workflow commands, which GitHub surfaces
// as check-run annotations readable without authentication.
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

function esc(s) {
  return s
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A');
}

const truncated = log.length > 24000 ? log.slice(-24000) : log;
for (const line of truncated.split('\n')) {
  console.log(`::error file=build-apk.yml,title=${name} (run ${runId})::${esc(line)}`);
}

const header =
  `# ${name}\n` +
  `Generated from GitHub Actions run ${runId} (${new Date().toISOString()}).\n\n`;

let res;
try {
  res = await fetch(
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
  console.log(`::error title=commit-failure-log (run ${runId})::status ${res.status}: ${esc(body.slice(0, 500))}`);
  process.exit(0);
} catch (err) {
  console.log(`::error title=commit-failure-log (run ${runId})::fetch failed: ${esc(String(err))}`);
  process.exit(0);
}