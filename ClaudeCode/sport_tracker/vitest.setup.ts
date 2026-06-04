// Global test setup: configure fake-indexeddb so Dexie uses an in-memory
// IndexedDB in every test environment (no browser required).
import "fake-indexeddb/auto";

// Ensure @testing-library/react cleanup runs after each test regardless of
// whether vitest globals are enabled. Without this, rendered components from
// prior tests leak into subsequent tests causing "multiple elements found"
// errors with getByText/getByRole queries.
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
