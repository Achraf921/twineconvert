/**
 * Bioinformatics (FASTA/FASTQ <-> JSON) and BitTorrent (bencode <-> JSON)
 * batch tests.
 *
 * Non-shallow: structural assertions on the output (FASTA header chars,
 * FASTQ 4-line records with sequence/quality length parity, bencode
 * dictionary signature) plus full roundtrip preservation on every pair.
 */

import { describe, it, expect } from "vitest";
import { run } from "../src/lib/engine/runner";
import { getMeta } from "../src/lib/engine/registry-meta";
import { fileFromText } from "./fixtures/text-fixtures";
import { fileFromBytes } from "./fixtures/binary-fixtures";

const FASTA_INPUT = `>seq1 hemoglobin alpha
MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLST
PDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPE
NFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVANALAHKYH
>seq2 trna
GCAGCGUGGCGAUGCUGUAGUCGAGGCAUUCC
`;

const FASTQ_INPUT = `@read1
ACGTACGTACGT
+
IIIIIIIIIIII
@read2 description here
TTAGCC
+
!!!!!!
`;

describe("fasta-to-json", () => {
  it("parses every record into id/description/sequence triples", async () => {
    const result = await run(
      "fasta-to-json",
      fileFromText("hg.fasta", FASTA_INPUT, "text/x-fasta"),
    );
    const records = JSON.parse(await result.blob.text()) as Array<{
      id: string;
      description: string;
      sequence: string;
    }>;
    expect(records).toHaveLength(2);
    expect(records[0].id).toBe("seq1");
    expect(records[0].description).toBe("hemoglobin alpha");
    expect(records[0].sequence.startsWith("MVHLTPEEKS")).toBe(true);
    // Concatenated, line-wrap-stripped sequence is the right length.
    expect(records[0].sequence.length).toBeGreaterThan(100);
    expect(records[1].id).toBe("seq2");
  });

  it("rejects input with no FASTA headers", async () => {
    await expect(
      run(
        "fasta-to-json",
        fileFromText("nothing.fasta", "ACGTACGT\nno header\n", "text/plain"),
      ),
    ).rejects.toThrow(/No FASTA records found/);
  });
});

describe("json-to-fasta", () => {
  it("emits properly wrapped FASTA at 70 chars/line", async () => {
    const seq = "A".repeat(150);
    const result = await run(
      "json-to-fasta",
      fileFromText(
        "in.json",
        JSON.stringify([{ id: "test", description: "demo", sequence: seq }]),
        "application/json",
      ),
    );
    const text = await result.blob.text();
    const lines = text.trim().split("\n");
    expect(lines[0]).toBe(">test demo");
    // 150 bases at 70 cols wrap = 3 lines: 70 + 70 + 10.
    expect(lines).toHaveLength(4);
    expect(lines[1]).toHaveLength(70);
    expect(lines[3]).toHaveLength(10);
  });

  it("rejects JSON missing required fields", async () => {
    await expect(
      run(
        "json-to-fasta",
        fileFromText(
          "bad.json",
          JSON.stringify([{ description: "missing id and sequence" }]),
          "application/json",
        ),
      ),
    ).rejects.toThrow(/missing required/);
  });

  it("round-trip: FASTA -> JSON -> FASTA preserves sequences", async () => {
    const r1 = await run(
      "fasta-to-json",
      fileFromText("in.fasta", FASTA_INPUT, "text/x-fasta"),
    );
    const r2 = await run(
      "json-to-fasta",
      new File([await r1.blob.text()], "rt.json", { type: "application/json" }) as unknown as File,
    );
    const reparsed = await run(
      "fasta-to-json",
      new File([await r2.blob.text()], "rt.fasta", { type: "text/x-fasta" }) as unknown as File,
    );
    const original = JSON.parse(await r1.blob.text());
    const final = JSON.parse(await reparsed.blob.text());
    expect(final.length).toBe(original.length);
    for (let i = 0; i < original.length; i++) {
      expect(final[i].id).toBe(original[i].id);
      expect(final[i].sequence).toBe(original[i].sequence);
    }
  });
});

describe("fastq-to-json", () => {
  it("parses 4-line records into id/description/sequence/quality", async () => {
    const result = await run(
      "fastq-to-json",
      fileFromText("r.fastq", FASTQ_INPUT, "text/plain"),
    );
    const records = JSON.parse(await result.blob.text()) as Array<{
      id: string;
      description: string;
      sequence: string;
      quality: string;
    }>;
    expect(records).toHaveLength(2);
    expect(records[0].id).toBe("read1");
    expect(records[0].sequence).toBe("ACGTACGTACGT");
    expect(records[0].quality).toBe("IIIIIIIIIIII");
    expect(records[1].id).toBe("read2");
    expect(records[1].description).toBe("description here");
    expect(records[1].sequence.length).toBe(records[1].quality.length);
  });

  it("rejects when line count is not a multiple of 4", async () => {
    await expect(
      run(
        "fastq-to-json",
        fileFromText("trunc.fastq", "@x\nACGT\n+\n", "text/plain"),
      ),
    ).rejects.toThrow(/multiple of 4|require exactly 4/);
  });

  it("rejects when sequence and quality lengths differ", async () => {
    await expect(
      run(
        "fastq-to-json",
        fileFromText(
          "bad.fastq",
          "@x\nACGT\n+\n!!!!!\n",
          "text/plain",
        ),
      ),
    ).rejects.toThrow(/lengths differ|length mismatch/);
  });
});

describe("json-to-fastq", () => {
  it("round-trip: FASTQ -> JSON -> FASTQ preserves records", async () => {
    const r1 = await run(
      "fastq-to-json",
      fileFromText("in.fastq", FASTQ_INPUT, "text/plain"),
    );
    const r2 = await run(
      "json-to-fastq",
      new File([await r1.blob.text()], "rt.json", { type: "application/json" }) as unknown as File,
    );
    const reparsed = await run(
      "fastq-to-json",
      new File([await r2.blob.text()], "rt.fastq", { type: "text/plain" }) as unknown as File,
    );
    const original = JSON.parse(await r1.blob.text());
    const final = JSON.parse(await reparsed.blob.text());
    expect(final).toEqual(original);
  });
});

describe("bencode-to-json + json-to-bencode", () => {
  it("decodes a bencode dictionary into JSON with human-readable strings", async () => {
    const bencode = await import("bencode");
    const enc = (bencode.default ?? bencode).encode as (v: unknown) => Uint8Array | Buffer;
    const raw = enc({
      announce: "http://tracker.example.com/announce",
      info: { name: "demo", "piece length": 16384, length: 1024 },
    });
    const bytes = raw instanceof Uint8Array ? raw : new Uint8Array(raw);

    const result = await run(
      "bencode-to-json",
      fileFromBytes("demo.torrent", bytes, "application/x-bittorrent"),
    );
    const decoded = JSON.parse(await result.blob.text()) as {
      announce: string;
      info: { name: string; "piece length": number; length: number };
    };
    expect(decoded.announce).toBe("http://tracker.example.com/announce");
    expect(decoded.info.name).toBe("demo");
    expect(decoded.info["piece length"]).toBe(16384);
    expect(decoded.info.length).toBe(1024);
  });

  it("encodes JSON back into bencode that starts with 'd' (dict signature)", async () => {
    const result = await run(
      "json-to-bencode",
      fileFromText(
        "in.json",
        JSON.stringify({
          announce: "http://x.example/announce",
          info: { name: "x", "piece length": 16384, length: 1 },
        }),
        "application/json",
      ),
    );
    expect(result.blob.type).toBe("application/x-bittorrent");
    const bytes = new Uint8Array(await result.blob.arrayBuffer());
    // Bencode dictionary signature: first byte must be 'd' (0x64).
    expect(bytes[0]).toBe(0x64);
    expect(bytes[bytes.length - 1]).toBe(0x65); // closing 'e'
  });

  it("round-trip: bencode -> JSON -> bencode preserves dictionary contents", async () => {
    const bencode = await import("bencode");
    const enc = (bencode.default ?? bencode).encode as (v: unknown) => Uint8Array | Buffer;
    const dec = (bencode.default ?? bencode).decode as (b: Uint8Array, e?: string) => unknown;
    const original = {
      announce: "http://rt.example/announce",
      info: { name: "rt", "piece length": 32768, length: 4096 },
    };
    const initial = enc(original);
    const initialBytes = initial instanceof Uint8Array ? initial : new Uint8Array(initial);

    const r1 = await run(
      "bencode-to-json",
      fileFromBytes("rt.torrent", initialBytes, "application/x-bittorrent"),
    );
    const r2 = await run(
      "json-to-bencode",
      new File([await r1.blob.text()], "rt.json", { type: "application/json" }) as unknown as File,
    );
    const reBytes = new Uint8Array(await r2.blob.arrayBuffer());
    const reDecoded = dec(reBytes, "utf8") as typeof original;
    expect(reDecoded.announce).toBe(original.announce);
    expect(reDecoded.info.name).toBe(original.info.name);
    expect(reDecoded.info["piece length"]).toBe(original.info["piece length"]);
    expect(reDecoded.info.length).toBe(original.info.length);
  });
});

describe("registry meta wiring", () => {
  const ids = [
    "fasta-to-json",
    "json-to-fasta",
    "fastq-to-json",
    "json-to-fastq",
    "bencode-to-json",
    "json-to-bencode",
  ] as const;

  for (const id of ids) {
    it(`${id} is registered with non-empty meta`, () => {
      const meta = getMeta(id);
      expect(meta).toBeDefined();
      expect(meta!.label).toBeTruthy();
      expect(meta!.accept.length).toBeGreaterThan(0);
      expect(meta!.toMime).toBeTruthy();
    });
  }
});
