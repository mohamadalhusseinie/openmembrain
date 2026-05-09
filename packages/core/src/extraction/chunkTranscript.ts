const DEFAULT_MAX_CHUNK_CHARACTERS = 50_000;

export function chunkTranscript(text: string, maxChunkCharacters?: number): string[] {
  const maxSize = maxChunkCharacters ?? DEFAULT_MAX_CHUNK_CHARACTERS;

  if (!text.trim()) {
    return [];
  }

  if (text.length <= maxSize) {
    return [text];
  }

  // Split on paragraph boundaries (double newline)
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    // If a single paragraph exceeds maxSize, split it by single newlines
    if (paragraph.length > maxSize) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }
      // Split the large paragraph by lines
      const lines = paragraph.split(/\n/);
      for (const line of lines) {
        if (current.length + line.length + 1 > maxSize && current.trim()) {
          chunks.push(current.trim());
          current = "";
        }
        current += (current ? "\n" : "") + line;
      }
      continue;
    }

    const separator = current ? "\n\n" : "";
    if (current.length + separator.length + paragraph.length > maxSize) {
      if (current.trim()) {
        chunks.push(current.trim());
      }
      current = paragraph;
    } else {
      current += separator + paragraph;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}
