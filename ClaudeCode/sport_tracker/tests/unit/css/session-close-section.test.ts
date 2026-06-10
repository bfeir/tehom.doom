import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

describe(".session__close-section CSS rule", () => {
  it("must not contain margin-top: auto", () => {
    const cssPath = resolve(process.cwd(), "src/styles/session.css");
    const css = readFileSync(cssPath, "utf-8");

    // Locate the .session__close-section rule block
    const selector = ".session__close-section";
    const selectorIndex = css.indexOf(selector);
    expect(selectorIndex).toBeGreaterThan(-1);

    const openBrace = css.indexOf("{", selectorIndex);
    expect(openBrace).toBeGreaterThan(-1);

    // Extract content until the matching closing brace
    let depth = 0;
    let closeBrace = openBrace;
    for (let i = openBrace; i < css.length; i++) {
      if (css[i] === "{") depth++;
      else if (css[i] === "}") {
        depth--;
        if (depth === 0) {
          closeBrace = i;
          break;
        }
      }
    }

    const ruleBlock = css.slice(openBrace + 1, closeBrace);

    // Normalize whitespace for both spaced and non-spaced variants
    const normalized = ruleBlock.replace(/\s+/g, " ").toLowerCase();

    expect(normalized).not.toContain("margin-top: auto");
    expect(normalized).not.toContain("margin-top:auto");
  });
});
