#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');
const PKG_VERSION = require(path.join(ROOT_DIR, 'package.json')).version || '0.0.1';

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIndex = line.indexOf('=');
    if (eqIndex <= 0) continue;
    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const opts = {
    platform: 'all',
    uploadPath: process.env.STALLION_UPLOAD_PATH || '',
    releaseNote: 'PulseBeat OTA update',
    entryFile: 'index.js',
    ciToken: process.env.STALLION_CI_TOKEN || '',
    projectId: process.env.STALLION_PROJECT_ID || '',
    appVersion: process.env.STALLION_APP_VERSION || PKG_VERSION,
    promote: false,
    mandatory: false,
    dryRun: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = () => (i + 1 < argv.length ? argv[++i] : '');
    const splitEq = (prefix) => {
      if (arg.startsWith(`${prefix}=`)) return arg.slice(prefix.length + 1);
      if (arg === prefix) return next();
      return null;
    };

    if (arg === '-h' || arg === '--help') {
      opts.help = true;
      continue;
    }
    if (arg === '--promote') {
      opts.promote = true;
      continue;
    }
    if (arg === '--mandatory') {
      opts.mandatory = true;
      continue;
    }
    if (arg === '--dry-run') {
      opts.dryRun = true;
      continue;
    }

    const platform = splitEq('--platform');
    if (platform !== null) {
      opts.platform = platform.toLowerCase();
      continue;
    }
    const uploadPath = splitEq('--upload-path');
    if (uploadPath !== null) {
      opts.uploadPath = uploadPath;
      continue;
    }
    const releaseNote = splitEq('--release-note') ?? splitEq('--note');
    if (releaseNote !== null) {
      opts.releaseNote = releaseNote;
      continue;
    }
    const entryFile = splitEq('--entry-file');
    if (entryFile !== null) {
      opts.entryFile = entryFile;
      continue;
    }
    const ciToken = splitEq('--ci-token');
    if (ciToken !== null) {
      opts.ciToken = ciToken;
      continue;
    }
    const projectId = splitEq('--project-id');
    if (projectId !== null) {
      opts.projectId = projectId;
      continue;
    }
    const appVersion = splitEq('--app-version');
    if (appVersion !== null) {
      opts.appVersion = appVersion;
    }
  }

  return opts;
}

function printHelp() {
  console.log(`
PulseBeat Stallion OTA Release Helper

Usage:
  yarn ota:android [-- --release-note="Fix playback"]
  yarn ota:ios     [-- --release-note="Fix playback"]
  yarn ota:publish [-- --platform=all|android|ios --promote --app-version=1.0]

Environment (.env) or CLI flags:
  STALLION_UPLOAD_PATH   or --upload-path=<org/project/bucket>  (required)
  STALLION_PROJECT_ID    or --project-id=<id>                   (for --promote)
  STALLION_APP_VERSION   or --app-version=<version>             (for --promote)
  STALLION_CI_TOKEN      or --ci-token=<token>                  (optional CI auth)

Flags:
  --platform <android|ios|all>   Target platform (default: all)
  --release-note, --note <text>  Release notes for this OTA bundle
  --entry-file <file>            Bundle entry file (default: index.js)
  --promote                      Promote published bundle via release-bundle
  --mandatory                    Mark promoted release as mandatory
  --dry-run                      Print commands without executing
`);
}

function resolveStallionBin() {
  const binName = process.platform === 'win32' ? 'stallion.cmd' : 'stallion';
  const localBin = path.join(ROOT_DIR, 'node_modules', '.bin', binName);
  return fs.existsSync(localBin) ? localBin : binName;
}

function runStallion(bin, args, captureJson = false) {
  const result = spawnSync(bin, args, {
    cwd: ROOT_DIR,
    stdio: captureJson ? ['inherit', 'pipe', 'inherit'] : 'inherit',
    encoding: 'utf8',
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
  return result.stdout || '';
}

function main() {
  loadDotEnv(ENV_PATH);
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help) {
    printHelp();
    return;
  }

  const platforms =
    opts.platform === 'all'
      ? ['android', 'ios']
      : opts.platform === 'android' || opts.platform === 'ios'
      ? [opts.platform]
      : null;

  if (!platforms) {
    console.error(`[ota] Invalid --platform "${opts.platform}". Use android, ios, or all.`);
    process.exit(1);
  }

  if (!opts.uploadPath) {
    console.error(
      '[ota] Missing upload path. Set STALLION_UPLOAD_PATH=<org/project/bucket> in .env or pass --upload-path=<org/project/bucket>.',
    );
    process.exit(1);
  }

  if (opts.promote && (!opts.projectId || !opts.appVersion)) {
    console.error(
      '[ota] --promote requires STALLION_PROJECT_ID (or --project-id) and STALLION_APP_VERSION (or --app-version).',
    );
    process.exit(1);
  }

  const bin = resolveStallionBin();

  for (const platform of platforms) {
    const publishArgs = [
      'publish-bundle',
      '--upload-path',
      opts.uploadPath,
      '--platform',
      platform,
      '--release-note',
      opts.releaseNote,
      '--entry-file',
      opts.entryFile,
    ];
    if (opts.ciToken) {
      publishArgs.push('--ci-token', opts.ciToken);
    }
    if (opts.promote) {
      publishArgs.push('--json');
    }

    console.log(`\n[ota] Publishing ${platform} bundle...`);
    if (opts.dryRun) {
      console.log(`[dry-run] ${bin} ${publishArgs.map((a) => JSON.stringify(a)).join(' ')}`);
      if (opts.promote) {
        const promotePreview = [
          'release-bundle',
          '--project-id',
          opts.projectId,
          '--hash',
          '<published-hash>',
          '--app-version',
          opts.appVersion,
          '--release-note',
          opts.releaseNote,
          ...(opts.mandatory ? ['--is-mandatory'] : []),
          ...(opts.ciToken ? ['--ci-token', opts.ciToken] : []),
        ];
        console.log(`[dry-run] ${bin} ${promotePreview.map((a) => JSON.stringify(a)).join(' ')}`);
      }
      continue;
    }

    const stdout = runStallion(bin, publishArgs, opts.promote);
    if (opts.promote) {
      const parsed = JSON.parse(stdout.trim());
      if (!parsed?.hash) {
        throw new Error(`Did not receive bundle hash from stallion publish-bundle: ${stdout}`);
      }
      const promoteArgs = [
        'release-bundle',
        '--project-id',
        opts.projectId,
        '--hash',
        parsed.hash,
        '--app-version',
        opts.appVersion,
        '--release-note',
        opts.releaseNote,
      ];
      if (opts.mandatory) {
        promoteArgs.push('--is-mandatory');
      }
      if (opts.ciToken) {
        promoteArgs.push('--ci-token', opts.ciToken);
      }
      console.log(`[ota] Promoting ${platform} bundle (${parsed.hash}) to v${opts.appVersion}...`);
      runStallion(bin, promoteArgs, false);
    }
  }
}

main();
