import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { render } from "@testing-library/react";
import { WorkstationArea } from "./WorkstationArea";
import type { StressEmoji } from "../types";

describe("WorkstationArea", () => {
  describe("Feature: oncall-overload, Property 16: Emoji Display Format", () => {
    it("should display stress emoji in format 💻[emoji]💻", () => {
      const emojis: StressEmoji[] = ["🤨", "😟", "😫", "😵"];

      fc.assert(
        fc.property(fc.constantFrom(...emojis), (emoji) => {
          const { container } = render(<WorkstationArea stressEmoji={emoji} />);
          const text = container.textContent;
          expect(text).toBe(`🔥💻${emoji}💻🔥`);
        }),
        { numRuns: 100 },
      );
    });
  });
});
