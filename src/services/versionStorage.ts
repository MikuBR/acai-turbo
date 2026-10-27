const KEY_LAST_SEEN = 'acai-last-seen-version';
const KEY_RELEASE_NOTES = 'acai-release-notes';

export function getLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(KEY_LAST_SEEN);
  } catch {
    return null;
  }
}

export function setLastSeenVersion(version: string): void {
  try {
    localStorage.setItem(KEY_LAST_SEEN, version);
  } catch {
    // ignore
  }
}

export function getStoredReleaseNotes(): string | null {
  try {
    return localStorage.getItem(KEY_RELEASE_NOTES);
  } catch {
    return null;
  }
}

export function setStoredReleaseNotes(notes: string | null): void {
  try {
    if (notes) localStorage.setItem(KEY_RELEASE_NOTES, notes);
    else localStorage.removeItem(KEY_RELEASE_NOTES);
  } catch {
    // ignore
  }
}

export function getCurrentVersion(): string {
  // Vite injects VITE_APP_VERSION at build time; fallback to package version
  return (import.meta as any).env?.VITE_APP_VERSION || '1.4.1';
}