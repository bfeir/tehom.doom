import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

function extractRuleBlock(css: string, selector: string): string {
  const selectorIndex = css.indexOf(selector);
  if (selectorIndex === -1) {
    throw new Error(`Selector "${selector}" not found in CSS`);
  }
  const openBrace = css.indexOf("{", selectorIndex);
  if (openBrace === -1) {
    throw new Error(`Opening brace not found for "${selector}" rule block`);
  }
  let depth = 0;
  let closeBrace = openBrace;
  for (let i = openBrace; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) { closeBrace = i; break; }
    }
  }
  return css.slice(openBrace + 1, closeBrace).replace(/\s+/g, " ").toLowerCase();
}

describe(".session__close-section CSS rule", () => {
  const cssPath = resolve(process.cwd(), "src/styles/session.css");
  const css = readFileSync(cssPath, "utf-8");
  const rule = extractRuleBlock(css, ".session__close-section");

  it("must not contain margin-top: auto (regression: pushed button off mobile viewport)", () => {
    // margin-top: auto in a flex column with min-height: 100dvh places the button ~56px below
    // the 844px mobile viewport. Removing it keeps the button always in view.
    // Visual verification on 390×844 confirmed via Playwright (see evolution/2026-06-08-fix-sticky-done-button.md).
    // E2E tests deferred to v2 per project constraint (CLAUDE.md).
    expect(rule).not.toContain("margin-top: auto");
    expect(rule).not.toContain("margin-top:auto");
  });

  it("retains position sticky and bottom 0 so button stays visible when entries overflow viewport", () => {
    expect(rule).toContain("position: sticky");
    expect(rule).toContain("bottom: 0");
  });
});
