try {
  require('better-sqlite3');
  console.log('[check] better-sqlite3: OK');
} catch (e) {
  console.error('[check] better-sqlite3: FAILED —', e.message);
  console.error('[check] The native addon was not compiled for this platform.');
  console.error('[check] Run: npx electron-builder install-app-deps');
  process.exit(1);
}
