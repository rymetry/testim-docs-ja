export function stripMarkdown(text) {
  return String(text ?? '')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_>#-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function generateDescription(title, content) {
  const lines = content.split('\n');
  let paragraph = [];

  const flush = () => stripMarkdown(paragraph.join(' '));

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      const candidate = flush();
      if (candidate) return candidate.slice(0, 120);
      paragraph = [];
      continue;
    }
    if (
      /^#/.test(line) ||
      /^:{3,}/.test(line) ||
      /^```/.test(line) ||
      /^!\[/.test(line) ||
      /^<[^>]+>/.test(line) ||
      /^[-*+]\s/.test(line) ||
      /^\d+\.\s/.test(line)
    ) {
      continue;
    }
    paragraph.push(line);
  }

  const fallback = flush();
  if (fallback) return fallback.slice(0, 120);
  return `${title} に関する日本語ドキュメントです。`;
}
