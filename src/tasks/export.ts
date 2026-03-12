import { BlogPost } from '../types';

/**
 * Converts a list of blog posts to a CSV string.
 *
 * @param posts Array of BlogPost objects.
 * @returns A CSV formatted string.
 */
export function convertToCSV(posts: BlogPost[]): string {
  const headers = [
    'Title',
    'Description',
    'Category',
    'Tags',
    'Published At',
    'Last Modified',
    'Path',
    'Character Count',
    'Is Paid',
    'Slug',
    'Author'
  ];

  const rows = posts.map(post => [
    post.title,
    post.description,
    post.category,
    post.tags.join(', '),
    post.publishedAt || '',
    post.lastModified || '',
    post.path,
    post.characterCount.toString(),
    post.isPaid ? 'Yes' : 'No',
    post.slug,
    post.author || ''
  ]);

  return [
    headers.join(','),
    ...rows.map(row => formatCsvRow(row))
  ].join('\n');
}

/**
 * Formats an array of values into a single CSV row string.
 */
function formatCsvRow(row: string[]): string {
  return row
    .map(value => `"${value.replace(/"/g, '""')}"`)
    .join(',');
}
