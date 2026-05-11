/**
 * Deep unit tests for dotenv.ts and properties.ts. Config-file parsers
 * fail silently — a bug means the user's app gets the wrong credentials
 * with no error to point at. Verify the cases real config files hit.
 */

import { describe, it, expect } from "vitest";
import { parseEnv, buildEnv } from "../src/lib/engine/util/dotenv";
import {
  parseProperties,
  buildProperties,
} from "../src/lib/engine/util/properties";

describe("dotenv: parse", () => {
  it("parses KEY=value lines", () => {
    expect(parseEnv("FOO=bar\nBAZ=qux\n")).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("skips # comments and blank lines", () => {
    const input = `# Comment
FOO=bar

# Another comment
BAZ=qux
`;
    expect(parseEnv(input)).toEqual({ FOO: "bar", BAZ: "qux" });
  });

  it("strips double and single quotes from values", () => {
    expect(parseEnv(`FOO="hello world"\n`)).toEqual({ FOO: "hello world" });
    expect(parseEnv(`FOO='single quoted'\n`)).toEqual({ FOO: "single quoted" });
  });

  it("tolerates `export KEY=value` prefix", () => {
    expect(parseEnv(`export FOO=bar\nexport BAZ=qux\n`)).toEqual({
      FOO: "bar",
      BAZ: "qux",
    });
  });

  it("preserves values containing `=` after the first separator", () => {
    expect(parseEnv(`URL=jdbc:postgres://h:5432/db?ssl=true\n`)).toEqual({
      URL: "jdbc:postgres://h:5432/db?ssl=true",
    });
  });

  it("returns empty object for blank/comment-only input", () => {
    expect(parseEnv("")).toEqual({});
    expect(parseEnv("# just a comment\n")).toEqual({});
  });
});

describe("dotenv: build round-trips with parse", () => {
  const cases: Record<string, string>[] = [
    { FOO: "bar", BAZ: "qux" },
    { URL: "jdbc:postgres://localhost:5432/mydb", USER: "admin" },
    { VALUE_WITH_SPACES: "hello world", VALUE_WITH_HASH: "abc#def" },
  ];

  it.each(cases.map((c, i) => [i, c] as const))(
    "case #%d round-trips through buildEnv → parseEnv unchanged",
    (_i, obj) => {
      expect(parseEnv(buildEnv(obj))).toEqual(obj);
    },
  );

  it("quotes values that contain spaces or # so they parse back correctly", () => {
    const out = buildEnv({ KEY: "value with spaces" });
    expect(out).toContain('"value with spaces"');
    expect(parseEnv(out).KEY).toBe("value with spaces");
  });
});

describe("properties: parse", () => {
  it("accepts both = and : as separator", () => {
    const input = `key.one=value-one
key.two:value-two
`;
    expect(parseProperties(input)).toEqual({
      "key.one": "value-one",
      "key.two": "value-two",
    });
  });

  it("preserves dot/dash/underscore characters in keys (Spring/Log4j style)", () => {
    const input = `server.servlet.context-path=/api
log4j.appender.foo.level=INFO
spring_datasource.url=jdbc:h2:mem:
`;
    expect(parseProperties(input)).toEqual({
      "server.servlet.context-path": "/api",
      "log4j.appender.foo.level": "INFO",
      "spring_datasource.url": "jdbc:h2:mem:",
    });
  });

  it("skips # and ! comment lines", () => {
    const input = `# Comment style 1
! Comment style 2
foo=bar
`;
    expect(parseProperties(input)).toEqual({ foo: "bar" });
  });

  it("decodes basic backslash escapes (\\n, \\t, \\\\)", () => {
    const input = `multiline=line1\\nline2\\tend`;
    expect(parseProperties(input)).toEqual({ multiline: "line1\nline2\tend" });
  });

  it("decodes unicode escapes \\uXXXX", () => {
    expect(parseProperties(`greeting=Hello \\u00e9\n`)).toEqual({
      greeting: "Hello é",
    });
  });
});

describe("properties: build round-trips with parse", () => {
  const cases: Record<string, string>[] = [
    { "server.port": "8080" },
    { "spring.datasource.url": "jdbc:postgresql://localhost:5432/db" },
    { foo: "bar with spaces" },
    { multiline: "line1\nline2" },
  ];

  it.each(cases.map((c, i) => [i, c] as const))(
    "case #%d round-trips through buildProperties → parseProperties",
    (_i, obj) => {
      expect(parseProperties(buildProperties(obj))).toEqual(obj);
    },
  );

  it("escapes `=` and `:` in values so they don't split as separator", () => {
    const out = buildProperties({ url: "jdbc:h2:mem:foo=bar" });
    // After parse, the value must be intact (no premature split)
    expect(parseProperties(out).url).toBe("jdbc:h2:mem:foo=bar");
  });
});
