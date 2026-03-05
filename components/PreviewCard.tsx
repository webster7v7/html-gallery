'use client';

import { HTMLItem } from '@/types';
import { cn } from '@/lib/utils';
import { EyeIcon, ExternalLinkIcon } from './Icons';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';

interface PreviewCardProps {
  item: HTMLItem;
}

function IframeSkeleton() {
  return (
    <div className="absolute inset-0 bg-[#161b22] animate-pulse">
      <div className="w-full h-full bg-gradient-to-br from-[#1f2937] to-[#111827]" />
    </div>
  );
}

function PreviewIframe({ slug, enabled }: { slug: string; enabled: boolean }) {
  const encodedSlug = useMemo(
    () =>
      slug
        .split('/')
        .map((segment) => encodeURIComponent(segment))
        .join('/'),
    [slug]
  );

  if (!enabled) {
    return null;
  }

  return (
    <iframe
      src={`/content/${encodedSlug}.html`}
      className="w-[400%] h-[400%] scale-25 origin-top-left pointer-events-none"
      sandbox="allow-scripts"
      loading="lazy"
      title="preview"
    />
  );
}

export function PreviewCard({ item }: PreviewCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoadPreview, setShouldLoadPreview] = useState(false);

  useEffect(() => {
    if (shouldLoadPreview) return;
    const el = containerRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoadPreview(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShouldLoadPreview(true);
            obs.disconnect();
            break;
          }
        }
      },
      {
        root: null,
        rootMargin: '250px',
        threshold: 0.01,
      }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [shouldLoadPreview]);

  const encodedPreviewSlug = item.slug
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  const encodedContentSlug = encodedPreviewSlug;

  return (
    <Link href={`/preview/${encodedPreviewSlug}`} className="block group">
      <div
        ref={containerRef}
        className={cn(
          'relative bg-[#161b22] rounded-2xl border border-white/10',
          'hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-1',
          'overflow-hidden relative',
          'md:aspect-[4/3] aspect-[3/4]'
        )}
      >
        <Suspense fallback={<IframeSkeleton />}>
          <div className="absolute inset-0 overflow-hidden">
            {!shouldLoadPreview ? <IframeSkeleton /> : <PreviewIframe slug={item.slug} enabled={shouldLoadPreview} />}
          </div>
        </Suspense>

        <div
          className={cn(
            'absolute inset-x-0 bottom-0',
            'bg-gradient-to-t from-[#0d1117]/95 via-[#0d1117]/60 to-transparent',
            'pt-20 pb-4 px-4 transition-opacity duration-300',
            'group-hover:from-[#0d1117]/98 group-hover:via-[#0d1117]/80'
          )}
        >
          <h3 className="text-2xl font-bold text-white truncate mb-1">
            {item.title}
          </h3>

          {item.description && (
            <p className="text-sm text-gray-300 line-clamp-2 mb-3">
              {item.description}
            </p>
          )}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {item.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={(e) => e.preventDefault()}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg',
                'bg-blue-500/20 text-blue-400 text-sm font-medium',
                'border border-blue-500/30',
                'transition-all duration-200',
                'hover:bg-blue-500/30 hover:scale-105',
                'active:scale-[0.98]'
              )}
            >
              <EyeIcon className="w-4 h-4" />
              预览
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                window.open(`/content/${encodedContentSlug}.html`, '_blank');
              }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-lg',
                'bg-white/5 text-gray-300 text-sm font-medium',
                'border border-white/10',
                'transition-all duration-200',
                'hover:bg-white/10 hover:scale-105',
                'active:scale-[0.98]'
              )}
            >
              <ExternalLinkIcon className="w-4 h-4" />
              外链
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
