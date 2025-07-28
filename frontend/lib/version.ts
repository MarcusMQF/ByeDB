// Version management system
export interface VersionInfo {
  version: string;
  buildNumber: string;
  buildDate: string;
  commitHash?: string;
}

// Default version - this will be updated during deployment
const DEFAULT_VERSION: VersionInfo = {
  version: "2.0.0",
  buildNumber: "1",
  buildDate: new Date().toISOString(),
};

// Try to load version from environment or build-time variables
export function getVersionInfo(): VersionInfo {
  // In production, these will be set during build time
  const buildVersion = process.env.NEXT_PUBLIC_APP_VERSION;
  const buildNumber = process.env.NEXT_PUBLIC_BUILD_NUMBER;
  const buildDate = process.env.NEXT_PUBLIC_BUILD_DATE;
  const commitHash = process.env.NEXT_PUBLIC_COMMIT_HASH;

  if (buildVersion && buildNumber && buildDate) {
    return {
      version: buildVersion,
      buildNumber,
      buildDate,
      commitHash,
    };
  }

  // Fallback to default version (development)
  return DEFAULT_VERSION;
}

// Format version for display
export function formatVersion(versionInfo: VersionInfo): string {
  return `v${versionInfo.version} (${versionInfo.buildNumber})`;
}

// Get short version for compact display
export function getShortVersion(versionInfo: VersionInfo): string {
  return `v${versionInfo.version}`;
} 