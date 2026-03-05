import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{
    slug: string[];
  }>;
};

const CONTENT_DIR = path.resolve(process.cwd(), 'content');

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const slugParts = (slug || []).map(decodeSegment);
  const last = slugParts[slugParts.length - 1] || '';

  const relPath = last.toLowerCase().endsWith('.html')
    ? path.join(...slugParts)
    : path.join(...slugParts) + '.html';

  const absPath = path.resolve(CONTENT_DIR, relPath);

  if (!absPath.startsWith(CONTENT_DIR + path.sep) && absPath !== CONTENT_DIR) {
    return new NextResponse('Not Found', { status: 404 });
  }

  try {
    const stat = await fs.stat(absPath);
    if (!stat.isFile()) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const html = await fs.readFile(absPath, 'utf-8');
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new NextResponse('Not Found', { status: 404 });
  }
}
