/**
 * GEDCOM 5.5 / 5.5.1 / 7.0 parser. GEDCOM is the universal genealogy
 * interchange format used by Ancestry, MyHeritage, FamilySearch,
 * RootsMagic, Gramps, and basically every family-tree app.
 *
 * Format is line-based with hierarchical levels:
 *
 *   0 @I1@ INDI
 *   1 NAME John /Smith/
 *   1 SEX M
 *   1 BIRT
 *   2 DATE 12 MAR 1950
 *   2 PLAC New York, USA
 *   1 FAMS @F1@
 *   0 @F1@ FAM
 *   1 HUSB @I1@
 *   1 WIFE @I2@
 *   1 CHIL @I3@
 *
 * Each line: `<level> [@xref@] <tag> [value]`. Sub-records are at
 * higher levels. We parse into a flat node tree, then walk it to
 * extract Individuals and Families with the most-asked-for fields
 * (name, sex, birth/death/marriage dates and places, parents/children).
 *
 * Niceties NOT in v1: notes, sources/citations, multimedia objects,
 * GEDCOM 7.0 EXT extensions. These can be added later, most CSV/JSON
 * exports drop them anyway.
 */

interface RawNode {
  level: number;
  xref?: string;
  tag: string;
  value?: string;
  children: RawNode[];
}

export interface GedcomIndividual {
  id: string;
  name?: string;
  givenName?: string;
  surname?: string;
  sex?: string; // "M" | "F" | "U"
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  /** Family ids where this person is a spouse. */
  familyAsSpouse: string[];
  /** Family id where this person is a child. */
  familyAsChild?: string;
}

export interface GedcomFamily {
  id: string;
  husbandId?: string;
  wifeId?: string;
  childIds: string[];
  marriageDate?: string;
  marriagePlace?: string;
}

export interface ParsedGedcom {
  individuals: GedcomIndividual[];
  families: GedcomFamily[];
}

function parseLines(raw: string): RawNode[] {
  // GEDCOM files are commonly ASCII or UTF-8; some old ones are ANSEL ,
  // we'd need an iconv layer for those. For v1 we trust the file to
  // decode as UTF-8 (modern apps export this).
  const lines = raw.split(/\r?\n/);
  const root: RawNode[] = [];
  // Stack tracks the most recent parent at each level, so we can attach
  // each line to its right parent without recursion.
  const stack: RawNode[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    // Format: `<level> [@xref@] <tag> [value]`
    const m = line.match(/^(\d+)\s+(?:@([^@]+)@\s+)?(\S+)(?:\s+(.*))?$/);
    if (!m) continue;
    const level = parseInt(m[1], 10);
    const node: RawNode = {
      level,
      xref: m[2],
      tag: m[3],
      value: m[4],
      children: [],
    };
    if (level === 0) {
      root.push(node);
      stack.length = 0;
      stack[0] = node;
    } else {
      const parent = stack[level - 1];
      if (parent) parent.children.push(node);
      stack[level] = node;
      // Drop any deeper-level entries that are no longer in scope.
      stack.length = level + 1;
    }
  }
  return root;
}

function findChild(node: RawNode, tag: string): RawNode | undefined {
  return node.children.find((c) => c.tag === tag);
}

function getDateAndPlace(eventNode: RawNode | undefined): { date?: string; place?: string } {
  if (!eventNode) return {};
  return {
    date: findChild(eventNode, "DATE")?.value,
    place: findChild(eventNode, "PLAC")?.value,
  };
}

function parseName(nameValue: string): { full: string; given?: string; surname?: string } {
  // GEDCOM convention: surname is wrapped in slashes, e.g. "John /Smith/"
  const m = nameValue.match(/^(.*?)\s*\/([^/]*)\/\s*(.*)$/);
  if (m) {
    const given = (m[1] + " " + m[3]).trim();
    return { full: nameValue.replace(/\//g, "").trim(), given: given || undefined, surname: m[2].trim() || undefined };
  }
  return { full: nameValue.trim() };
}

export function parseGedcom(raw: string): ParsedGedcom {
  const root = parseLines(raw);
  const individuals: GedcomIndividual[] = [];
  const families: GedcomFamily[] = [];

  for (const node of root) {
    if (node.tag === "INDI" && node.xref) {
      const nameValue = findChild(node, "NAME")?.value ?? "";
      const { full, given, surname } = parseName(nameValue);
      const birth = getDateAndPlace(findChild(node, "BIRT"));
      const death = getDateAndPlace(findChild(node, "DEAT"));
      const familyAsSpouse = node.children.filter((c) => c.tag === "FAMS").map((c) => unwrapXref(c.value));
      const familyAsChild = unwrapXref(findChild(node, "FAMC")?.value);

      individuals.push({
        id: node.xref,
        name: full || undefined,
        givenName: given,
        surname,
        sex: findChild(node, "SEX")?.value,
        birthDate: birth.date,
        birthPlace: birth.place,
        deathDate: death.date,
        deathPlace: death.place,
        familyAsSpouse: familyAsSpouse.filter(Boolean) as string[],
        familyAsChild: familyAsChild || undefined,
      });
    } else if (node.tag === "FAM" && node.xref) {
      const marriage = getDateAndPlace(findChild(node, "MARR"));
      const childIds = node.children
        .filter((c) => c.tag === "CHIL")
        .map((c) => unwrapXref(c.value))
        .filter(Boolean) as string[];
      families.push({
        id: node.xref,
        husbandId: unwrapXref(findChild(node, "HUSB")?.value) || undefined,
        wifeId: unwrapXref(findChild(node, "WIFE")?.value) || undefined,
        childIds,
        marriageDate: marriage.date,
        marriagePlace: marriage.place,
      });
    }
  }

  return { individuals, families };
}

function unwrapXref(value: string | undefined): string {
  if (!value) return "";
  const m = value.match(/^@([^@]+)@$/);
  return m ? m[1] : value;
}
