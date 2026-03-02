export function normalizeManuscriptTitle(title: string): string {
  const trimmed = title.trim();
  const collapsed = trimmed.replace(/\s+/g, " ");
  const normalized = collapsed.normalize("NFKC").toLowerCase();
  const punctuationRemoved = normalized.replace(/[\p{P}]/gu, "");
  return punctuationRemoved.replace(/\s+/g, " ").trim();
}
