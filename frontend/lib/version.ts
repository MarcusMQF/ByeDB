// Simplified version management system
export interface VersionInfo {
  version: string;
  buildNumber: string;
  buildDate: string;
  commitHash?: string;
}

// Single source of truth - package.json version
export function getVersionInfo(): VersionInfo {
  // Use NEXT_PUBLIC_APP_VERSION which is set by next.config.mjs
  const version = process.env.NEXT_PUBLIC_APP_VERSION || '1.9.0';
  const buildNumber = process.env.NEXT_PUBLIC_BUILD_NUMBER || '1';
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE || new Date().toISOString();
  const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH || 'dev';

  return {
    version,
    buildNumber,
    buildDate,
    commitHash,
  };
}

// Format version for display
export function formatVersion(versionInfo: VersionInfo): string {
  return `v${versionInfo.version} (${versionInfo.buildNumber})`;
}

// Get short version for compact display
export function getShortVersion(versionInfo: VersionInfo): string {
  return `v${versionInfo.version}`;
}