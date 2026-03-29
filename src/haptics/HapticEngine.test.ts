import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { HapticEngine, type HapticPattern } from "./HapticEngine";

describe("HapticEngine", () => {
  describe("Feature: oncall-overload, Property 22: Haptic Patterns Defined Correctly", () => {
    it("should define Success, Miss, and Breach patterns with correct specifications", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), () => {
          const mockVibrate = vi.fn();
          const originalNavigator = global.navigator;

          // Mock navigator.vibrate
          Object.defineProperty(global, "navigator", {
            value: { vibrate: mockVibrate },
            writable: true,
            configurable: true,
          });

          const engine = new HapticEngine();

          // Test Success pattern: 50ms
          engine.trigger("Success");
          expect(mockVibrate).toHaveBeenCalledWith(50);

          mockVibrate.mockClear();

          // Test Miss pattern: 20ms
          engine.trigger("Miss");
          expect(mockVibrate).toHaveBeenCalledWith(20);

          mockVibrate.mockClear();

          // Test Breach pattern: 100ms-50ms-100ms
          engine.trigger("Breach");
          expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100]);

          // Restore original navigator
          Object.defineProperty(global, "navigator", {
            value: originalNavigator,
            writable: true,
            configurable: true,
          });
        }),
        { numRuns: 100 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 23: Haptic Engine Graceful Degradation", () => {
    it("should silently no-op on unsupported browsers without throwing errors", () => {
      fc.assert(
        fc.property(
          fc.constantFrom<HapticPattern>("Success", "Miss", "Breach"),
          (pattern) => {
            const originalNavigator = global.navigator;

            // Mock unsupported browser (no vibrate API)
            Object.defineProperty(global, "navigator", {
              value: {},
              writable: true,
              configurable: true,
            });

            const engine = new HapticEngine();

            // Should not throw error
            expect(() => engine.trigger(pattern)).not.toThrow();

            // Should report as unsupported
            expect(engine.isHapticSupported()).toBe(false);

            // Restore original navigator
            Object.defineProperty(global, "navigator", {
              value: originalNavigator,
              writable: true,
              configurable: true,
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  describe("Haptic API detection", () => {
    let originalNavigator: Navigator;

    beforeEach(() => {
      originalNavigator = global.navigator;
    });

    afterEach(() => {
      Object.defineProperty(global, "navigator", {
        value: originalNavigator,
        writable: true,
        configurable: true,
      });
    });

    it("should detect when Vibration API is supported", () => {
      Object.defineProperty(global, "navigator", {
        value: { vibrate: vi.fn() },
        writable: true,
        configurable: true,
      });

      const engine = new HapticEngine();
      expect(engine.isHapticSupported()).toBe(true);
    });

    it("should detect when Vibration API is not supported", () => {
      Object.defineProperty(global, "navigator", {
        value: {},
        writable: true,
        configurable: true,
      });

      const engine = new HapticEngine();
      expect(engine.isHapticSupported()).toBe(false);
    });
  });

  describe("Error handling", () => {
    it("should catch and handle vibrate errors gracefully", () => {
      const mockVibrate = vi.fn(() => {
        throw new Error("Vibration failed");
      });

      Object.defineProperty(global, "navigator", {
        value: { vibrate: mockVibrate },
        writable: true,
        configurable: true,
      });

      const engine = new HapticEngine();

      // Should not throw error even if vibrate throws
      expect(() => engine.trigger("Success")).not.toThrow();
    });
  });
});
