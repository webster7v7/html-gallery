import { promises as fs } from 'fs';
import path from 'path';
import { HTMLItem, Frontmatter } from '@/types';

const CONTENT_DIR = path.join(process.cwd(), 'content');

function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } {
  const frontmatterRegex = /<!--\s*\n?---\n([\s\S]*?)\n---\s*\n?-->/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterStr = match[1];
  const frontmatter: Frontmatter = {};

  const lines = frontmatterStr.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim() as keyof Frontmatter;
    let value = line.slice(colonIndex + 1).trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }

    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        frontmatter[key] = JSON.parse(value);
      } catch {
        frontmatter[key] = value as any;
      }
    } else {
      frontmatter[key] = value as any;
    }
  }

  return { frontmatter, body: content };
}

function inferMetadata(filePath: string, content: string): Partial<HTMLItem> {
  const fileName = path.basename(filePath, '.html');
  const dirName = path.basename(path.dirname(filePath));

  const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : fileName;

  const descMatch = content.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  return {
    title,
    description,
    category: dirName !== 'content' ? dirName : 'uncategorized',
  };
}

async function scanDirectory(dir: string, baseDir: string): Promise<HTMLItem[]> {
  const items: HTMLItem[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subItems = await scanDirectory(fullPath, baseDir);
        items.push(...subItems);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        try {
          const content = await fs.readFile(fullPath, 'utf-8');
          const stats = await fs.stat(fullPath);
          const { frontmatter } = parseFrontmatter(content);
          const inferred = inferMetadata(fullPath, content);

          const relativePath = path.relative(baseDir, fullPath);
          const slug = relativePath.replace(/\\/g, '/').replace(/\.html$/, '');

          const category = frontmatter.category || inferred.category || 'uncategorized';

          const item: HTMLItem = {
            slug,
            title: frontmatter.title || inferred.title || entry.name,
            description: frontmatter.description || inferred.description || '',
            category,
            tags: frontmatter.tags || [],
            createdAt: frontmatter.date || stats.birthtime.toISOString().split('T')[0],
            updatedAt: stats.mtime.toISOString().split('T')[0],
            size: stats.size,
            filePath: fullPath,
          };

          items.push(item);
        } catch (err) {
          console.error(`Error reading file ${fullPath}:`, err);
        }
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dir}:`, err);
  }

  return items;
}

export async function scanHTMLFiles(): Promise<HTMLItem[]> {
  try {
    await fs.access(CONTENT_DIR);
  } catch {
    await fs.mkdir(CONTENT_DIR, { recursive: true });
    return [];
  }

  return scanDirectory(CONTENT_DIR, CONTENT_DIR);
}

export function getCategories(items: HTMLItem[]): { name: string; count: number }[] {
  const categoryMap = new Map<string, number>();

  for (const item of items) {
    const count = categoryMap.get(item.category) || 0;
    categoryMap.set(item.category, count + 1);
  }

  return Array.from(categoryMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function sortItems(
  items: HTMLItem[],
  sortBy: 'date' | 'name' = 'date',
  order: 'asc' | 'desc' = 'desc'
): HTMLItem[] {
  return [...items].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'date') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      comparison = a.title.localeCompare(b.title);
    }

    return order === 'desc' ? -comparison : comparison;
  });
}

export function filterByCategory(items: HTMLItem[], category: string | null): HTMLItem[] {
  if (!category || category === 'all') {
    return items;
  }
  return items.filter(item => item.category === category);
}
