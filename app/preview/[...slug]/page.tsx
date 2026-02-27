import { scanHTMLFiles } from '@/lib/scan-html';
import { notFound } from 'next/navigation';
import { PreviewToolbar } from '@/components/PreviewToolbar';
import { Suspense } from 'react';

interface PreviewPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export const revalidate = 60;

function decodeSlugSegments(slug: string[]): string[] {
  return slug.map((segment) => {
    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  });
}

async function getItemBySlug(slug: string[]) {
  const items = await scanHTMLFiles();
  const decodedSlug = decodeSlugSegments(slug);
  const fullSlug = decodedSlug.join('/');
  return items.find((item) => item.slug === fullSlug);
}

export async function generateStaticParams() {
  const items = await scanHTMLFiles();
  return items.map((item) => ({
    slug: item.slug.split('/'),
  }));
}

function LoadingSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-white text-sm">加载中...</p>
      </div>
    </div>
  );
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { slug } = await params;
  const item = await getItemBySlug(slug);

  if (!item) {
    notFound();
  }

  return (
    <div className="fixed inset-0 bg-gray-900">
      <PreviewToolbar title={item.title} category={item.category} slug={item.slug} />

      <Suspense fallback={<LoadingSpinner />}>
        <iframe
          src={`/content/${item.slug}.html`}
          className="w-full h-full border-0"
          title={item.title}
        />
      </Suspense>
    </div>
  );
}
