/**
 * Updates a field in the frontmatter of a Markdown string.
 * If the field exists, it updates its value.
 * If any of the alternative fields exist, they are updated instead.
 * If neither the field nor any alternatives exist, it appends the field to the frontmatter.
 *
 * @param content Full Markdown content (including frontmatter).
 * @param field The field name to update.
 * @param value The new value for the field (should be already formatted/quoted if needed).
 * @param alternatives Alternative field names to look for if the primary field is missing.
 * @returns The updated Markdown content.
 */
export function updateFrontmatterField(
  content: string,
  field: string,
  value: string,
  alternatives: string[] = []
): string {
  const frontmatterRegex = /^(---\r?\n)([\s\S]*?)(^---)/m;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return content;
  }

  const opening = match[1];
  let frontmatter = match[2] || '';
  const closing = match[3];
  const body = content.slice(match[0].length);

  const fieldRegex = new RegExp(`^(\\s*${field}:\\s*).*$`, 'm');

  if (fieldRegex.test(frontmatter)) {
    frontmatter = frontmatter.replace(fieldRegex, (_, p1) => `${p1}${value}`);
  } else {
    let updated = false;
    for (const alt of alternatives) {
      const altRegex = new RegExp(`^(\\s*${alt}:\\s*).*$`, 'm');
      if (altRegex.test(frontmatter)) {
        frontmatter = frontmatter.replace(altRegex, (_, p1) => `${p1}${value}`);
        updated = true;
        break;
      }
    }

    if (!updated) {
      frontmatter = frontmatter.trimEnd();
      if (frontmatter.length > 0) frontmatter += '\n';
      frontmatter += `${field}: ${value}\n`;
    }
  }

  // Normalize trailing newlines in frontmatter
  frontmatter = frontmatter.trimEnd();
  if (frontmatter.length > 0) {
    frontmatter += '\n';
  }

  return `${opening}${frontmatter}${closing}${body}`;
}
