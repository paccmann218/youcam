import { describe, expect, it } from "vitest";
import { lintClaim, PHRASE_SUITE } from "./linter";

describe("claim checker", () => {
  it("blocks the fixed phrase list and lets the honest lines through", () => {
    const blocked = PHRASE_SUITE.filter((p) => p.expectBlocked);
    const allowed = PHRASE_SUITE.filter((p) => !p.expectBlocked);
    const blockedHits = blocked.filter((p) => !lintClaim(p.text).ok).length;
    const allowedHits = allowed.filter((p) => lintClaim(p.text).ok).length;
    expect(blockedHits).toBe(blocked.length);
    expect(allowedHits).toBe(allowed.length);
    expect(blockedHits / PHRASE_SUITE.length + allowedHits / PHRASE_SUITE.length).toBe(1);
  });
});
