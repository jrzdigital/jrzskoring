class SyncManager {
  private isOnlineStatus: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      this.isOnlineStatus = navigator.onLine;
      window.addEventListener("online", () => {
        this.isOnlineStatus = true;
      });
      window.addEventListener("offline", () => {
        this.isOnlineStatus = false;
      });
    }
  }

  isOnline(): boolean {
    return this.isOnlineStatus;
  }

  async syncScores(scores: any[]): Promise<boolean> {
    return true;
  }
}

export const syncManager = new SyncManager();
