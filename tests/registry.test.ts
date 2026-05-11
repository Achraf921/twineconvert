/**
 * Registry integrity tests.
 *
 * Catches the common "I added a converter file but forgot to register it"
 * (or vice versa) regression. Every entry in registry.ts must:
 *   1. Resolve to a real default-exported Converter
 *   2. Have an `id` that exactly matches the registry key
 *   3. Have non-empty `accept` and `fromMime` arrays
 *   4. Have a non-empty `label` and a `convert` function
 */

import { describe, it, expect } from "vitest";
import {
  listConverterIds,
  loadConverter,
  registry,
} from "../src/lib/engine/registry";

describe("registry integrity", () => {
  const ids = listConverterIds();

  it("registers a non-trivial number of converters", () => {
    expect(ids.length).toBeGreaterThan(150);
  });

  it("has no duplicate ids", () => {
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(ids)("loads %s with consistent metadata", async (id) => {
    const converter = await loadConverter(id);
    expect(converter, `converter ${id} default-export missing`).toBeTruthy();
    expect(converter.id).toBe(id);
    expect(converter.label, `converter ${id} missing label`).toBeTruthy();
    expect(converter.accept, `converter ${id} missing accept`).toBeTruthy();
    expect(converter.accept.length).toBeGreaterThan(0);
    expect(converter.fromMime, `converter ${id} missing fromMime`).toBeTruthy();
    expect(converter.fromMime.length).toBeGreaterThan(0);
    expect(converter.toMime, `converter ${id} missing toMime`).toBeTruthy();
    expect(typeof converter.convert).toBe("function");
  });

  it("every accept extension starts with a dot or is the wildcard '*'", async () => {
    for (const id of ids) {
      const converter = await loadConverter(id);
      for (const ext of converter.accept) {
        const isValid = ext === "*" || ext.startsWith(".");
        expect(isValid, `${id} accept entry '${ext}' must be '.ext' or '*'`).toBe(true);
      }
    }
  });

  it("ids match the kebab-case URL-slug pattern", () => {
    for (const id of ids) {
      expect(id, `id ${id} contains uppercase or invalid chars`).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("registry keys equal converter ids (no drift)", async () => {
    for (const id of Object.keys(registry)) {
      const converter = await loadConverter(id);
      expect(converter.id, `registry key '${id}' does not match converter.id '${converter.id}'`).toBe(id);
    }
  });
});
