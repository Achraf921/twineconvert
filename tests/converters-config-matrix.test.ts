/**
 * Config-serialization cross-matrix (yaml/toml/json5/ini <-> xml + to
 * yaml/toml). Non-shallow: asserts keys + scalar values survive the
 * round trip through the JS-object hub, the right target syntax is
 * emitted, and scalar-only input fails loudly.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { fileFromText } from "./fixtures/text-fixtures";

const f = (name: string, content: string, mime: string) => fileFromText(name, content, mime);
const reFile = (text: string, name: string, mime: string) =>
  new File([text], name, { type: mime }) as unknown as File;

describe("config matrix: YAML <-> XML", () => {
  it("yaml-to-xml emits XML elements for the keys", async () => {
    const out = await (await run("yaml-to-xml", f("c.yaml", "name: Demo\nversion: 2\n", "application/x-yaml"))).blob.text();
    expect(out).toMatch(/<\?xml/);
    expect(out).toMatch(/<name>Demo<\/name>/);
    expect(out).toMatch(/<version>2<\/version>/);
  });
  it("xml-to-yaml emits YAML keys from the XML tree", async () => {
    const out = await (await run("xml-to-yaml", f("c.xml", "<config><name>Demo</name><version>2</version></config>", "application/xml"))).blob.text();
    expect(out).toMatch(/name:\s*Demo/);
    expect(out).toMatch(/version:\s*2/);
  });
  it("round-trip YAML -> XML -> YAML preserves the key", async () => {
    const x = await run("yaml-to-xml", f("c.yaml", "title: Hello\n", "application/x-yaml"));
    const y = await run("xml-to-yaml", reFile(await x.blob.text(), "rt.xml", "application/xml"));
    expect(await y.blob.text()).toMatch(/title:\s*Hello/);
  });
});

describe("config matrix: TOML <-> XML", () => {
  it("toml-to-xml emits XML for the keys", async () => {
    const out = await (await run("toml-to-xml", f("c.toml", 'title = "Cargo"\nedition = "2021"\n', "application/toml"))).blob.text();
    expect(out).toMatch(/<title>Cargo<\/title>/);
    expect(out).toMatch(/<edition>2021<\/edition>/);
  });
  it("xml-to-toml emits TOML key/value", async () => {
    const out = await (await run("xml-to-toml", f("c.xml", "<config><title>Cargo</title></config>", "application/xml"))).blob.text();
    expect(out).toContain("Cargo");
    expect(out).toMatch(/=/);
  });
});

describe("config matrix: JSON5 source", () => {
  const j5 = () => f("c.json5", "{ name: 'Demo', /* comment */ version: 2, tags: ['a','b'], }", "application/json5");
  it("json5-to-yaml drops comments and keeps keys", async () => {
    const out = await (await run("json5-to-yaml", j5())).blob.text();
    expect(out).toMatch(/name:\s*Demo/);
    expect(out).not.toContain("/* comment */");
  });
  it("json5-to-xml emits elements", async () => {
    const out = await (await run("json5-to-xml", j5())).blob.text();
    expect(out).toMatch(/<name>Demo<\/name>/);
  });
  it("json5-to-toml emits key/value", async () => {
    const out = await (await run("json5-to-toml", j5())).blob.text();
    expect(out).toContain("Demo");
  });
});

describe("config matrix: INI source", () => {
  const ini = () => f("c.ini", "name=Demo\nversion=2\n[server]\nhost=localhost\n", "application/x-ini");
  it("ini-to-yaml keeps top-level keys + section", async () => {
    const out = await (await run("ini-to-yaml", ini())).blob.text();
    expect(out).toMatch(/name:\s*Demo/);
    expect(out).toMatch(/server:/);
    expect(out).toMatch(/host:\s*localhost/);
  });
  it("ini-to-xml emits elements", async () => {
    const out = await (await run("ini-to-xml", ini())).blob.text();
    expect(out).toContain("Demo");
    expect(out).toMatch(/<server>/);
  });
  it("ini-to-toml emits the section as a table", async () => {
    const out = await (await run("ini-to-toml", ini())).blob.text();
    expect(out).toContain("Demo");
    expect(out).toMatch(/\[server\]/);
  });
});

describe("config matrix: failure modes", () => {
  it("yaml-to-xml rejects scalar-only YAML (not a key/value document)", async () => {
    await expect(
      run("yaml-to-xml", f("s.yaml", "just a bare string\n", "application/x-yaml")),
    ).rejects.toThrow(/key\/value document|Could not convert/i);
  });
});
