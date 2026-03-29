import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import { renderHook } from "@testing-library/react";
import { useInputHandler } from "./useInputHandler";
import type { Ticket } from "../types";
import { TICKET_SIZE } from "../constants";
import { HapticContext, HapticEngine } from "../haptics/HapticEngine";
import React from "react";

describe("useInputHandler", () => {
  describe("Feature: oncall-overload, Property 10: Miss Detection", () => {
    it("should call onMiss and trigger Miss haptic when tap doesn't intersect any ticket", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 400 }),
          fc.integer({ min: 100, max: 400 }),
          (tapX, tapY) => {
            const mockHapticEngine = {
              trigger: vi.fn(),
              isHapticSupported: vi.fn(() => true),
            } as unknown as HapticEngine;

            const playAreaRef = {
              current: {
                getBoundingClientRect: () => ({
                  left: 0,
                  top: 0,
                  width: 800,
                  height: 600,
                }),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
              } as any,
            };

            const tickets: Ticket[] = [];
            const onResolve = vi.fn();
            const onMiss = vi.fn();

            const wrapper = ({ children }: { children: React.ReactNode }) => (
              <HapticContext.Provider value={mockHapticEngine}>
                {children}
              </HapticContext.Provider>
            );

            renderHook(
              () =>
                useInputHandler({
                  playAreaRef,
                  playAreaHeight: 600,
                  tickets,
                  onResolve,
                  onMiss,
                  enabled: true,
                }),
              { wrapper },
            );

            // Simulate a mouse down event
            const mouseEvent = new MouseEvent("mousedown", {
              clientX: tapX,
              clientY: tapY,
            });

            const mouseDownHandler = (
              playAreaRef.current.addEventListener as any
            ).mock.calls.find((call: any) => call[0] === "mousedown")?.[1];

            if (mouseDownHandler) {
              mouseDownHandler(mouseEvent);
              expect(onMiss).toHaveBeenCalled();
              expect(onResolve).not.toHaveBeenCalled();
              expect(mockHapticEngine.trigger).toHaveBeenCalledWith("Miss");
            }
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 11: Success Haptic on Resolution", () => {
    it("should trigger Success haptic pattern when ticket is resolved", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 400 }),
          fc.integer({ min: 100, max: 300 }),
          (x, y) => {
            const mockHapticEngine = {
              trigger: vi.fn(),
              isHapticSupported: vi.fn(() => true),
            } as unknown as HapticEngine;

            const playAreaRef = {
              current: {
                getBoundingClientRect: () => ({
                  left: 0,
                  top: 0,
                  width: 800,
                  height: 600,
                }),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
              } as any,
            };

            const ticket: Ticket = {
              id: "test",
              type: "bug",
              x,
              y,
              speed: 100,
              width: TICKET_SIZE,
              height: TICKET_SIZE,
            };

            const onResolve = vi.fn();
            const onMiss = vi.fn();

            const wrapper = ({ children }: { children: React.ReactNode }) => (
              <HapticContext.Provider value={mockHapticEngine}>
                {children}
              </HapticContext.Provider>
            );

            renderHook(
              () =>
                useInputHandler({
                  playAreaRef,
                  playAreaHeight: 600,
                  tickets: [ticket],
                  onResolve,
                  onMiss,
                  enabled: true,
                }),
              { wrapper },
            );

            // Simulate a mouse down event on the ticket
            const mouseEvent = new MouseEvent("mousedown", {
              clientX: x + TICKET_SIZE / 2,
              clientY: y + TICKET_SIZE / 2,
            });

            const mouseDownHandler = (
              playAreaRef.current.addEventListener as any
            ).mock.calls.find((call: any) => call[0] === "mousedown")?.[1];

            if (mouseDownHandler) {
              mouseDownHandler(mouseEvent);
              expect(onResolve).toHaveBeenCalledWith(ticket);
              expect(onMiss).not.toHaveBeenCalled();
              expect(mockHapticEngine.trigger).toHaveBeenCalledWith("Success");
            }
          },
        ),
        { numRuns: 10 },
      );
    });
  });

  describe("Feature: oncall-overload, Property 12: Touch and Mouse Input Equivalence", () => {
    it("should handle touch and mouse events equivalently", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 100, max: 400 }),
          fc.integer({ min: 100, max: 300 }),
          (x, y) => {
            const mockHapticEngine = {
              trigger: vi.fn(),
              isHapticSupported: vi.fn(() => true),
            } as unknown as HapticEngine;

            const playAreaRef = {
              current: {
                getBoundingClientRect: () => ({
                  left: 0,
                  top: 0,
                  width: 800,
                  height: 600,
                }),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
              } as any,
            };

            const ticket: Ticket = {
              id: "test",
              type: "bug",
              x,
              y,
              speed: 100,
              width: TICKET_SIZE,
              height: TICKET_SIZE,
            };

            const onResolve = vi.fn();
            const onMiss = vi.fn();

            const wrapper = ({ children }: { children: React.ReactNode }) => (
              <HapticContext.Provider value={mockHapticEngine}>
                {children}
              </HapticContext.Provider>
            );

            renderHook(
              () =>
                useInputHandler({
                  playAreaRef,
                  playAreaHeight: 600,
                  tickets: [ticket],
                  onResolve,
                  onMiss,
                  enabled: true,
                }),
              { wrapper },
            );

            // Both touch and mouse should be registered
            expect(playAreaRef.current.addEventListener).toHaveBeenCalledWith(
              "touchstart",
              expect.any(Function),
              expect.any(Object),
            );
            expect(playAreaRef.current.addEventListener).toHaveBeenCalledWith(
              "mousedown",
              expect.any(Function),
            );
          },
        ),
        { numRuns: 10 },
      );
    });
  });
});
