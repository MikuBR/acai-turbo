#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

function getDefaultLogDir() {
  if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'AcaiWave', 'logs');
  }
  return path.join(process.env.HOME || os.homedir(), '.config', 'AcaiWave', 'logs');
}

function printUsage() {
  console.log('Usage: node scripts/log-viewer.cjs [--dir <path>]');
  console.log('  --dir <path>   Directory containing structured.log (default: platform userData/logs)');
  console.log('  --lines <n>    Number of lines to show (default: 50)');
  console.log('  --help         Show this help');
}

function main() {
  const args = process.argv.slice(2);
  let logDir = null;
  let lines = 50;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dir' && i + 1 < args.length) {
      logDir = args[++i];
    } else if (args[i] === '--lines' && i + 1 < args.length) {
      lines = parseInt(args[++i], 10) || 50;
    } else if (args[i] === '--help') {
      printUsage();
      process.exit(0);
    }
  }

  if (!logDir) {
    logDir = process.env.CONTEXTO_LOGGING_DIR || getDefaultLogDir();
  }

  const structuredLog = path.join(logDir, 'structured.log');

  if (!fs.existsSync(structuredLog)) {
    console.log('(no log yet)');
    process.exit(0);
  }

  const content = fs.readFileSync(structuredLog, 'utf8');
  const linesArray = content.trim().split('\n').filter(Boolean);
  const tail = linesArray.slice(-lines);

  for (const line of tail) {
    try {
      const parsed = JSON.parse(line);
      const timestamp = parsed.timestamp ? new Date(parsed.timestamp).toLocaleString() : '';
      const level = parsed.level ? parsed.level.toUpperCase() : '';
      const message = parsed.message || '';
      const meta = parsed.meta ? ` ${JSON.stringify(parsed.meta)}` : '';
      console.log(`${timestamp} [${level}] ${message}${meta}`);
    } catch {
      console.log(line);
    }
  }
}

main();