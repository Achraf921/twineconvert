/**
 * Minimal RTF reader. RTF is a control-word stream; we extract readable
 * text, not formatting fidelity. Handles the constructs that matter for
 * "give me the text out of this .rtf": groups/braces, \par, \tab, \line,
 * unicode \uN, hex \'hh, escaped \{ \} \\, and skips destination groups
 * (fonttbl, colortbl, stylesheet, info, pict) whose contents are not
 * body text. Good enough for rtf-to-txt / rtf-to-html, not a typesetter.
 */

const SKIP_DESTINATIONS = new Set([
  "fonttbl",
  "colortbl",
  "stylesheet",
  "info",
  "pict",
  "themedata",
  "colorschememapping",
  "latentstyles",
  "datastore",
  "generator",
]);

export function rtfToText(rtf: string): string {
  let i = 0;
  const len = rtf.length;
  let out = "";
  const groupStack: boolean[] = [false];
  let skipDepth = -1;

  const skipping = () => skipDepth >= 0;

  while (i < len) {
    const ch = rtf[i];
    if (ch === "{") {
      groupStack.push(groupStack[groupStack.length - 1]);
      i++;
      continue;
    }
    if (ch === "}") {
      groupStack.pop();
      if (skipping() && groupStack.length - 1 < skipDepth) skipDepth = -1;
      i++;
      continue;
    }
    if (ch === "\\") {
      const next = rtf[i + 1];
      if (next === "\\" || next === "{" || next === "}") {
        if (!skipping()) out += next;
        i += 2;
        continue;
      }
      if (next === "'") {
        const hex = rtf.slice(i + 2, i + 4);
        if (!skipping()) {
          const code = parseInt(hex, 16);
          if (!Number.isNaN(code)) out += String.fromCharCode(code);
        }
        i += 4;
        continue;
      }
      const m = /^\\([a-zA-Z]+)(-?\d+)? ?/.exec(rtf.slice(i));
      if (m) {
        const word = m[1];
        const param = m[2];
        if (word === "par" || word === "pard" || word === "line") {
          if (!skipping()) out += "\n";
        } else if (word === "tab") {
          if (!skipping()) out += "\t";
        } else if (word === "u" && param) {
          if (!skipping()) {
            const cp = parseInt(param, 10);
            out += String.fromCharCode(cp < 0 ? cp + 65536 : cp);
          }
          i += m[0].length;
          if (rtf[i] === "?") i++;
          continue;
        } else if (SKIP_DESTINATIONS.has(word) || word === "*") {
          skipDepth = groupStack.length - 1;
        }
        i += m[0].length;
        continue;
      }
      i++;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      i++;
      continue;
    }
    if (!skipping()) out += ch;
    i++;
  }
  return out.replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function rtfToHtml(rtf: string): string {
  const text = rtfToText(rtf);
  const paras = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>\n")}</p>`);
  return `<!doctype html>
<html>
<head><meta charset="utf-8"></head>
<body>
${paras.join("\n")}
</body>
</html>
`;
}
