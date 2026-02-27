'use client';

import { ArrowLeftIcon, ExternalLinkIcon } from './Icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface PreviewToolbarProps {
  title: string;
  category: string;
  slug: string;
}

export function PreviewToolbar({ title, category, slug }: PreviewToolbarProps) {
  const router = useRouter();
  const encodedSlug = slug
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
          aria-label="返回"
        >
          <ArrowLeftIcon className="w-4 h-4 text-white" />
        </button>

        <div className="flex items-center gap-3 max-w-[300px] md:max-w-[500px]">
          <span className="text-white font-medium truncate">{title}</span>
          <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/50 text-white whitespace-nowrap">
            {category}
          </span>
        </div>

        <Link
          href={`/content/${encodedSlug}.html`}
          target="_blank"
          className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200"
          aria-label="新窗口打开"
        >
          <ExternalLinkIcon className="w-4 h-4 text-white" />
        </Link>
      </div>
    </div>
  );
}
