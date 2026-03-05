const { promises: fs } = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const CONTENT_DIR = path.resolve(process.cwd(), 'content');
const OUTPUT_FILE = path.resolve(process.cwd(), 'content-index.json');

function execGit(args) {
  return new Promise((resolve, reject) => {
    execFile('git', args, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
        return;
      }
      resolve(String(stdout || '').trim());
    });
  });
}

async function isShallowRepo() {
  try {
    const out = await execGit(['rev-parse', '--is-shallow-repository']);
    return out === 'true';
  } catch {
    try {
      await fs.access(path.resolve(process.cwd(), '.git', 'shallow'));
      return true;
    } catch {
      return false;
    }
  }
}

async function ensureFullHistoryIfPossible() {
  const shallow = await isShallowRepo();
  if (!shallow) return;

  process.stdout.write('Detected shallow git clone; attempting to fetch full history...\n');

  try {
    await execGit(['fetch', '--unshallow', '--tags']);
    process.stdout.write('Fetch --unshallow succeeded.\n');
    return;
  } catch {
    // Some git servers / configurations disallow --unshallow; fall back to a very large depth.
  }

  try {
    await execGit(['fetch', '--depth=2147483647', '--tags']);
    process.stdout.write('Fetch with large depth succeeded.\n');
  } catch (err) {
    process.stdout.write(`Fetch full history failed; continuing with available history. (${String(err && err.message ? err.message : err)})\n`);
  }
}

async function listHtmlFiles(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listHtmlFiles(full)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function toSlug(filePath) {
  const rel = path.relative(CONTENT_DIR, filePath);
  return rel.replace(/\\/g, '/').replace(/\.html$/i, '');
}

function toDateOnly(isoLike) {
  const ms = Date.parse(isoLike);
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString().split('T')[0];
}

async function main() {
  await fs.access(CONTENT_DIR);

  await ensureFullHistoryIfPossible();

  const files = await listHtmlFiles(CONTENT_DIR);
  const index = {};

  for (const filePath of files) {
    const slug = toSlug(filePath);
    try {
      const iso = await execGit(['log', '-1', '--format=%cI', '--', filePath]);
      const date = toDateOnly(iso);
      if (date) {
        index[slug] = date;
      }
    } catch {
      // ignore files not tracked by git or when git history is unavailable
    }
  }

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(index, null, 2) + '\n', 'utf8');
  process.stdout.write(`Generated ${path.relative(process.cwd(), OUTPUT_FILE)} with ${Object.keys(index).length} entries\n`);
}

main().catch((err) => {
  process.stderr.write(String(err && err.message ? err.message : err) + '\n');
  process.exitCode = 1;
});
