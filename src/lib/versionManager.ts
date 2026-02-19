// Version checking and update management utility
// Automatically detects when a new version is available and notifies users

export interface AppVersion {
  major: number;
  minor: number;
  patch: number;
  timestamp: number;
}

class VersionManager {
  private currentVersion: AppVersion | null = null;
  private checkInterval = 5 * 60 * 1000; // Check every 5 minutes
  private listeners: ((newVersion: AppVersion) => void)[] = [];

  constructor() {
    // Parse current version from window
    this.currentVersion = this.parseCurrentVersion();
  }

  /**
   * Parse version from HTML meta tag or window object
   */
  private parseCurrentVersion(): AppVersion {
    const metaTag = document.querySelector('meta[name="app-version"]');
    const versionStr = metaTag?.getAttribute('content') || '0.0.0';
    const [major = 0, minor = 0, patch = 0] = versionStr.split('.').map(Number);
    
    return {
      major,
      minor,
      patch,
      timestamp: Date.now(),
    };
  }

  /**
   * Check if a new version is available on the server
   */
  async checkForUpdate(): Promise<AppVersion | null> {
    try {
      // Fetch the current HTML with cache-busting
      const response = await fetch('/', {
        cache: 'no-store', // Force fresh fetch
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        console.warn('[VersionManager] Failed to fetch index.html');
        return null;
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const metaTag = doc.querySelector('meta[name="app-version"]');
      const versionStr = metaTag?.getAttribute('content');

      if (!versionStr) {
        console.warn('[VersionManager] No version found in server HTML');
        return null;
      }

      const [major = 0, minor = 0, patch = 0] = versionStr
        .split('.')
        .map(Number);
      const newVersion: AppVersion = {
        major,
        minor,
        patch,
        timestamp: Date.now(),
      };

      // Compare versions
      if (this.isNewerVersion(newVersion)) {
        console.log(
          `[VersionManager] New version available: ${this.versionToString(newVersion)}`
        );
        this.notifyListeners(newVersion);
        return newVersion;
      }

      return null;
    } catch (error) {
      console.error('[VersionManager] Error checking for updates:', error);
      return null;
    }
  }

  /**
   * Compare if newVersion is newer than currentVersion
   */
  private isNewerVersion(newVersion: AppVersion): boolean {
    if (!this.currentVersion) return false;

    if (newVersion.major > this.currentVersion.major) return true;
    if (newVersion.major < this.currentVersion.major) return false;

    if (newVersion.minor > this.currentVersion.minor) return true;
    if (newVersion.minor < this.currentVersion.minor) return false;

    if (newVersion.patch > this.currentVersion.patch) return true;

    return false;
  }

  /**
   * Convert version object to string
   */
  private versionToString(version: AppVersion): string {
    return `${version.major}.${version.minor}.${version.patch}`;
  }

  /**
   * Subscribe to version update notifications
   */
  onUpdateAvailable(
    callback: (newVersion: AppVersion) => void
  ): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  /**
   * Notify all listeners about new version
   */
  private notifyListeners(newVersion: AppVersion): void {
    this.listeners.forEach((listener) => {
      try {
        listener(newVersion);
      } catch (error) {
        console.error('[VersionManager] Error in listener:', error);
      }
    });
  }

  /**
   * Start periodic version checks
   */
  startPeriodicCheck(): void {
    // Check immediately on startup
    this.checkForUpdate();

    // Then check periodically
    setInterval(() => {
      this.checkForUpdate();
    }, this.checkInterval);
  }

  /**
   * Manually trigger version check
   */
  async checkNow(): Promise<void> {
    await this.checkForUpdate();
  }

  /**
   * Reload the page to get new version
   */
  reloadPage(): void {
    // Clear all caches before reloading
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          caches.delete(name);
        });
      });
    }

    // Hard reload to bypass cache
    window.location.reload();
  }

  /**
   * Get current version
   */
  getCurrentVersion(): AppVersion | null {
    return this.currentVersion;
  }
}

// Export singleton instance
export const versionManager = new VersionManager();
