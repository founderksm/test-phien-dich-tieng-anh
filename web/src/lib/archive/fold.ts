export function foldText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSearchText(...parts: Array<string | null | undefined>): string {
  return foldText(parts.filter(Boolean).join(" "));
}

export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}
