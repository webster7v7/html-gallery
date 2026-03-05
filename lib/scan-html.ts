import { promises as fs } from 'fs';
import path from 'path';
import { HTMLItem, Frontmatter } from '@/types';

const CONTENT_DIR = path.join(process.cwd(), 'content');

const CONTENT_INDEX_PATH = path.join(process.cwd(), 'content-index.json');
let contentIndexCache: Record<string, string> | null = null;

const DATE_SOURCE: 'git' | 'fs' =
  process.env.HTML_GALLERY_DATE_SOURCE === 'fs'
    ? 'fs'
    : process.env.HTML_GALLERY_DATE_SOURCE === 'git'
      ? 'git'
      : process.env.NODE_ENV === 'development'
        ? 'fs'
        : 'git';

async function loadContentIndex(): Promise<Record<string, string>> {
  if (contentIndexCache) return contentIndexCache;
  try {
    const raw = await fs.readFile(CONTENT_INDEX_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      contentIndexCache = parsed as Record<string, string>;
      return contentIndexCache;
    }
  } catch {
    // ignore
  }
  contentIndexCache = {};
  return contentIndexCache;
}

const HIDDEN_TAGS = new Set(['animation', 'tools']);

function normalizeTag(tag: string): string {
  return tag.trim();
}

function shouldHideTag(tag: string): boolean {
  const normalized = normalizeTag(tag);
  return HIDDEN_TAGS.has(normalized.toLowerCase());
}

function sanitizeTags(tags: string[] | undefined): string[] {
  if (!tags || tags.length === 0) return [];
  const cleaned = tags
    .map(normalizeTag)
    .filter((tag) => tag.length > 0)
    .filter((tag) => !shouldHideTag(tag));

  return Array.from(new Set(cleaned));
}

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

          const indexDate = contentIndexCache ? contentIndexCache[slug] : undefined;

          const fsDate = new Date(stats.mtime).toISOString().split('T')[0];
          const fallbackDate = DATE_SOURCE === 'fs' ? fsDate : indexDate;

          const item: HTMLItem = {
            slug,
            title: frontmatter.title || inferred.title || entry.name,
            description: frontmatter.description || inferred.description || '',
            category,
            tags: sanitizeTags(frontmatter.tags),
            createdAt: frontmatter.date || fallbackDate || '1970-01-01',
            updatedAt: frontmatter.date || fallbackDate || '1970-01-01',
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

  await loadContentIndex();

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
  const direction = order === 'desc' ? -1 : 1;
  const collator = new Intl.Collator('zh-u-co-pinyin', { numeric: true, sensitivity: 'base' });

  const getTime = (item: HTMLItem) => {
    const created = Date.parse(item.createdAt);
    if (!Number.isNaN(created)) return created;
    const updated = Date.parse(item.updatedAt);
    if (!Number.isNaN(updated)) return updated;
    return 0;
  };

  return [...items].sort((a, b) => {
    if (sortBy === 'date') {
      const diff = getTime(a) - getTime(b);
      if (diff !== 0) return diff * direction;
      const titleDiff = collator.compare(a.title, b.title);
      if (titleDiff !== 0) return titleDiff;
      return collator.compare(a.slug, b.slug);
    }

    const titleDiff = collator.compare(a.title, b.title);
    if (titleDiff !== 0) return titleDiff * direction;

    const timeDiff = getTime(a) - getTime(b);
    if (timeDiff !== 0) return timeDiff * direction;
    return collator.compare(a.slug, b.slug);
  });
}

export function filterByCategory(items: HTMLItem[], category: string | null): HTMLItem[] {
  if (!category || category === 'all') {
    return items;
  }
  return items.filter(item => item.category === category);
}
