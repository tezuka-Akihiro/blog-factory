import { describe, it, expect } from 'vitest';
import { updateFrontmatterField } from '../frontmatter';

describe('updateFrontmatterField', () => {
  const content = `---
title: Original Title
date: "2024-01-01"
author: "Old Author"
---
Body content`;

  it('updates an existing field', () => {
    const updated = updateFrontmatterField(content, 'author', '"New Author"');
    expect(updated).toContain('author: "New Author"');
    expect(updated).toContain('title: Original Title');
  });

  it('updates an alternative field if primary is missing', () => {
    const updated = updateFrontmatterField(content, 'publishedAt', '"2025-01-01"', ['date']);
    expect(updated).toContain('date: "2025-01-01"');
    expect(updated).not.toContain('publishedAt:');
  });

  it('adds a new field if primary and alternatives are missing', () => {
    const updated = updateFrontmatterField(content, 'newField', '"Value"');
    expect(updated).toContain('newField: "Value"');
    expect(updated).toContain('title: Original Title');
  });

  it('preserves formatting and body', () => {
    const complexContent = `---
title: "Quoted Title"
tags:
  - tag1
  - tag2
---
This is the body.
It has multiple lines.`;
    const updated = updateFrontmatterField(complexContent, 'author', '"Author Name"');
    expect(updated).toContain('title: "Quoted Title"');
    expect(updated).toContain('tag1');
    expect(updated).toContain('This is the body.');
    expect(updated).toContain('Author Name');
  });

  it('handles frontmatter without trailing newline gracefully', () => {
    const noNewline = `---
title: Test
---Body`;
    const updated = updateFrontmatterField(noNewline, 'author', '"Me"');
    expect(updated).toBe(`---
title: Test
author: "Me"
---Body`);
  });
});
