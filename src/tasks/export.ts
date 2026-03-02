import { BlogPost } from '../types';

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

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(value => `"${value.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}
