import { createContext } from "react";

export type HapticPattern = "Success" | "Miss" | "Breach";

export class HapticEngine {
  private isSupported: boolean;

  constructor() {
    // Detect Vibration API support
    this.isSupported =
      typeof navigator !== "undefined" && "vibrate" in navigator;
  }

  /**
   * Trigger a haptic pattern
   * @param pattern - The haptic pattern to trigger
   */
  trigger(pattern: HapticPattern): void {
    if (!this.isSupported) {
      // Silently no-op on unsupported browsers
      return;
    }

    try {
      switch (pattern) {
        case "Success":
          // Single sharp pulse of 50ms
          navigator.vibrate(50);
          break;
        case "Miss":
          // Soft ghost tap of 20ms at reduced intensity
          // Note: Vibration API doesn't support intensity control directly,
          // but shorter duration simulates reduced intensity
          navigator.vibrate(20);
          break;
        case "Breach":
          // Heavy double-thud: 100ms, 50ms gap, 100ms
          navigator.vibrate([100, 50, 100]);
          break;
      }
    } catch (error) {
      // Silently catch any errors
      console.warn("Haptic feedback failed:", error);
    }
  }

  /**
   * Check if haptic feedback is supported
   */
  isHapticSupported(): boolean {
    return this.isSupported;
  }
}

// Singleton instance
const hapticEngine = new HapticEngine();

// React Context for sharing the singleton
export const HapticContext = createContext<HapticEngine>(hapticEngine);

// Export singleton instance
export default hapticEngine;
