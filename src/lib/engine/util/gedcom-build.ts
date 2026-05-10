/**
 * Minimal GEDCOM 5.5.1 writer. Produces a structurally-correct file with
 * an INDI for each individual and a FAM for each family. Compatible with
 * Gramps, RootsMagic, FamilySearch, MyHeritage import flows.
 *
 * NOT supported in v1: sources/citations (SOUR), notes (NOTE), media
 * (OBJE), GEDCOM 7 extensions. Those can be carried through by users
 * who need them via the JSON intermediate format.
 */

import type { GedcomIndividual, GedcomFamily, ParsedGedcom } from "./gedcom-parse";

function eventLines(level: number, tag: string, date?: string, place?: string): string[] {
  if (!date && !place) return [];
  const out = [`${level} ${tag}`];
  if (date) out.push(`${level + 1} DATE ${date}`);
  if (place) out.push(`${level + 1} PLAC ${place}`);
  return out;
}

function buildIndividual(ind: GedcomIndividual): string[] {
  const lines: string[] = [`0 @${ind.id}@ INDI`];
  if (ind.name || ind.surname || ind.givenName) {
    const given = ind.givenName ?? (ind.name && !ind.surname ? ind.name : "");
    const surname = ind.surname ?? "";
    lines.push(`1 NAME ${given.trim()} /${surname.trim()}/`);
  }
  if (ind.sex) lines.push(`1 SEX ${ind.sex}`);
  lines.push(...eventLines(1, "BIRT", ind.birthDate, ind.birthPlace));
  lines.push(...eventLines(1, "DEAT", ind.deathDate, ind.deathPlace));
  if (ind.familyAsChild) lines.push(`1 FAMC @${ind.familyAsChild}@`);
  for (const fid of ind.familyAsSpouse) lines.push(`1 FAMS @${fid}@`);
  return lines;
}

function buildFamily(fam: GedcomFamily): string[] {
  const lines: string[] = [`0 @${fam.id}@ FAM`];
  if (fam.husbandId) lines.push(`1 HUSB @${fam.husbandId}@`);
  if (fam.wifeId) lines.push(`1 WIFE @${fam.wifeId}@`);
  for (const cid of fam.childIds) lines.push(`1 CHIL @${cid}@`);
  lines.push(...eventLines(1, "MARR", fam.marriageDate, fam.marriagePlace));
  return lines;
}

export function buildGedcom(data: ParsedGedcom): string {
  const lines: string[] = [
    "0 HEAD",
    "1 SOUR client-conversion",
    "2 NAME client-conversion",
    "1 GEDC",
    "2 VERS 5.5.1",
    "2 FORM LINEAGE-LINKED",
    "1 CHAR UTF-8",
  ];
  for (const ind of data.individuals) lines.push(...buildIndividual(ind));
  for (const fam of data.families) lines.push(...buildFamily(fam));
  lines.push("0 TRLR");
  return lines.join("\n") + "\n";
}
