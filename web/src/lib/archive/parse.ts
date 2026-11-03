export type Lang = "vi" | "en" | "zh";

export interface ParsedCategory {
  number: number;
  title: string;
}

export interface ParsedPhrase {
  categoryNumber: number;
  code: string | null;
  title: string | null;
  vi: string | null;
  en: string | null;
  zh: string | null;
  sourceLang: Lang;
  sortOrder: number;
}

export interface ParsedTerm {
  vi: string;
  en: string;
  zh: string;
  sortOrder: number;
}

export interface ParsedArchive {
  categories: ParsedCategory[];
  phrases: ParsedPhrase[];
  terms: ParsedTerm[];
  warnings: string[];
}

const FIELD_RE = /^\s*(?:-\s+)?\*\*(VI|EN|ZH|ZH gốc):\*\*\s*(.*?)\s*$/;
const CATEGORY_RE = /^##\s+(\d+)\.\s+(.+?)\s*$/;
const ENTRY_RE = /^###\s+(?:(\d+\.\d+)\s+)?(.+?)\s*$/;

const GLOSSARY_CATEGORY = "Thuật ngữ thương mại thường dùng";

type RawEntry = {
  categoryNumber: number;
  code: string | null;
  title: string | null;
  fields: Partial<Record<"vi" | "en" | "zh" | "zhSource", string>>;
};

function fieldKey(label: string): "vi" | "en" | "zh" | "zhSource" {
  if (label === "VI") return "vi";
  if (label === "EN") return "en";
  if (label === "ZH") return "zh";
  return "zhSource";
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

export function parseArchive(markdown: string): ParsedArchive {
  const lines = markdown.split(/\r?\n/);
  const categories: ParsedCategory[] = [];
  const raw: RawEntry[] = [];
  const terms: ParsedTerm[] = [];
  const warnings: string[] = [];

  let category: ParsedCategory | null = null;
  let current: RawEntry | null = null;
  let lastField: keyof RawEntry["fields"] | null = null;

  const closeEntry = () => {
    if (current) raw.push(current);
    current = null;
    lastField = null;
  };

  lines.forEach((line, index) => {
    const lineNo = index + 1;

    const categoryMatch = CATEGORY_RE.exec(line);
    if (categoryMatch) {
      closeEntry();
      category = { number: Number(categoryMatch[1]), title: categoryMatch[2] };
      categories.push(category);
      return;
    }

    if (!category) return;

    if (category.title === GLOSSARY_CATEGORY) {
      if (!line.trim().startsWith("|")) return;
      const cells = splitTableRow(line);
      const isHeader = cells[0] === "Thuật ngữ";
      const isSeparator = cells.every((cell) => /^:?-{3,}:?$/.test(cell));
      if (isHeader || isSeparator) return;
      if (cells.length !== 3) {
        warnings.push(`Dòng ${lineNo}: bảng thuật ngữ cần đủ 3 cột`);
        return;
      }
      terms.push({
        vi: cells[0],
        en: cells[1],
        zh: cells[2],
        sortOrder: terms.length + 1,
      });
      return;
    }

    const entryMatch = ENTRY_RE.exec(line);
    if (entryMatch && line.startsWith("### ")) {
      closeEntry();
      current = {
        categoryNumber: category.number,
        code: entryMatch[1] ?? null,
        title: entryMatch[2],
        fields: {},
      };
      return;
    }

    const fieldMatch = FIELD_RE.exec(line);
    if (fieldMatch) {
      const isBullet = /^\s*-\s+/.test(line);
      if (isBullet && fieldMatch[1] === "VI") closeEntry();
      if (!current) {
        current = {
          categoryNumber: category.number,
          code: null,
          title: null,
          fields: {},
        };
      }
      const key = fieldKey(fieldMatch[1]);
      if (current.fields[key] !== undefined) {
        warnings.push(`Dòng ${lineNo}: trường ${fieldMatch[1]} bị lặp trong cùng một mục`);
      }
      current.fields[key] = fieldMatch[2];
      lastField = key;
      return;
    }

    const trimmed = line.trim();
    if (current && lastField && trimmed && !trimmed.startsWith("---") && !trimmed.startsWith(">")) {
      current.fields[lastField] = `${current.fields[lastField]}\n${trimmed}`;
    }
  });
  closeEntry();

  const phrases: ParsedPhrase[] = raw.map((entry, i) => {
    const { vi, en, zh, zhSource } = entry.fields;
    const sourceLang: Lang = zhSource !== undefined ? "zh" : vi !== undefined ? "vi" : "en";
    return {
      categoryNumber: entry.categoryNumber,
      code: entry.code,
      title: entry.title,
      vi: vi ?? null,
      en: en ?? null,
      zh: zh ?? zhSource ?? null,
      sourceLang,
      sortOrder: i + 1,
    };
  });

  phrases.forEach((phrase) => {
    const label = phrase.code ?? phrase.title ?? `#${phrase.sortOrder}`;
    if (!phrase.en || !phrase.zh) warnings.push(`Mục ${label}: thiếu EN hoặc ZH`);
  });

  return { categories, phrases, terms, warnings };
}
