/**
 * FASTA + FASTQ parser/serializer. Both are line-oriented text formats
 * from the bioinformatics community.
 *
 * FASTA: each record is a `>header` line followed by 1+ sequence lines.
 * Sequences may wrap at 60-80 cols by convention but we don't enforce.
 *
 * FASTQ: each record is exactly 4 lines: `@header`, sequence, `+` (with
 * optional repeated header), then a same-length ASCII quality string.
 *
 * Our JSON wire form is a flat array of { id, description, sequence }
 * for FASTA and { id, description, sequence, quality } for FASTQ. The
 * id is the first whitespace-delimited token of the header (the GenBank
 * accession or similar); the rest of the header becomes description.
 */

export interface FastaRecord {
  id: string;
  description: string;
  sequence: string;
}

export interface FastqRecord extends FastaRecord {
  quality: string;
}

function splitHeader(line: string): { id: string; description: string } {
  const trimmed = line.trim();
  const m = /^(\S+)\s+([\s\S]*)$/.exec(trimmed);
  if (!m) return { id: trimmed, description: "" };
  return { id: m[1], description: m[2].trim() };
}

export function parseFasta(text: string): FastaRecord[] {
  const lines = text.split(/\r?\n/);
  const records: FastaRecord[] = [];
  let current: FastaRecord | null = null;
  for (const line of lines) {
    if (line.startsWith(">")) {
      if (current) records.push(current);
      const { id, description } = splitHeader(line.slice(1));
      current = { id, description, sequence: "" };
    } else if (current) {
      // FASTA bodies allow whitespace inside; strip it (sequences are
      // by convention contiguous; whitespace is purely cosmetic line wrap).
      current.sequence += line.replace(/\s+/g, "");
    }
  }
  if (current) records.push(current);
  if (records.length === 0) {
    throw new Error(
      'No FASTA records found. Each record must start with ">" followed by an identifier line, then one or more sequence lines.',
    );
  }
  return records;
}

export function formatFasta(records: FastaRecord[], wrap = 70): string {
  const out: string[] = [];
  for (const r of records) {
    const header = r.description ? `>${r.id} ${r.description}` : `>${r.id}`;
    out.push(header);
    if (wrap > 0) {
      for (let i = 0; i < r.sequence.length; i += wrap) {
        out.push(r.sequence.slice(i, i + wrap));
      }
    } else {
      out.push(r.sequence);
    }
  }
  return out.join("\n") + "\n";
}

export function parseFastq(text: string): FastqRecord[] {
  const lines = text.split(/\r?\n/).filter((l, i, a) =>
    // Strip trailing empty line(s) but keep blank lines inside? FASTQ
    // does NOT permit blank lines inside records, so we strip them all.
    l.length > 0 || i === a.length - 1 ? l.length > 0 : false,
  );
  if (lines.length === 0) {
    throw new Error("FASTQ input is empty.");
  }
  if (lines.length % 4 !== 0) {
    throw new Error(
      `FASTQ has ${lines.length} non-empty lines but records require exactly 4 lines each. Input may be truncated.`,
    );
  }
  const records: FastqRecord[] = [];
  for (let i = 0; i < lines.length; i += 4) {
    const header = lines[i];
    const seq = lines[i + 1];
    const sep = lines[i + 2];
    const qual = lines[i + 3];
    if (!header.startsWith("@")) {
      throw new Error(
        `FASTQ record ${i / 4 + 1} header missing "@" prefix (got: ${header.slice(0, 30)})`,
      );
    }
    if (!sep.startsWith("+")) {
      throw new Error(
        `FASTQ record ${i / 4 + 1} separator missing "+" prefix.`,
      );
    }
    if (seq.length !== qual.length) {
      throw new Error(
        `FASTQ record ${i / 4 + 1} sequence (${seq.length} chars) and quality (${qual.length} chars) lengths differ.`,
      );
    }
    const { id, description } = splitHeader(header.slice(1));
    records.push({ id, description, sequence: seq, quality: qual });
  }
  return records;
}

export function formatFastq(records: FastqRecord[]): string {
  const out: string[] = [];
  for (const r of records) {
    const header = r.description ? `@${r.id} ${r.description}` : `@${r.id}`;
    out.push(header, r.sequence, "+", r.quality);
  }
  return out.join("\n") + "\n";
}
