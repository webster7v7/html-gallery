'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { CollectionIcon, FolderIcon } from './Icons';

interface CategoryItem {
  name: string;
  count: number;
  url: string;
}

interface CategoryFilterProps {
  categories: CategoryItem[];
  allCount: number;
  allUrl: string;
  activeCategory: string | null;
}

export function CategoryFilter({ categories, allCount, allUrl, activeCategory }: CategoryFilterProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(maxScrollLeft > 0 && el.scrollLeft < maxScrollLeft - 1);
  };

  useEffect(() => {
    updateScrollState();

    const el = scrollRef.current;
    if (!el) return;

    const onResize = () => updateScrollState();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [categories.length, activeCategory]);

  const scrollByAmount = (amount: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <div className="relative w-full lg:flex-1 min-w-0">
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
        onScroll={updateScrollState}
        onWheel={(e) => {
          const el = scrollRef.current;
          if (!el) return;
          if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
            el.scrollLeft += e.deltaY;
            updateScrollState();
            e.preventDefault();
          }
        }}
      >
        <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white/80 p-2 shadow-sm min-w-max">
        <Link
          href={allUrl}
          className={cn(
            'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ease-out',
            !activeCategory || activeCategory === 'all'
              ? 'bg-gray-900 text-white shadow'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <CollectionIcon className="w-4 h-4" />
          全部
          <span
            className={cn(
              'ml-0.5 px-1.5 py-0.5 rounded-full text-xs',
              !activeCategory || activeCategory === 'all'
                ? 'bg-white/15'
                : 'bg-gray-200'
            )}
          >
            {allCount}
          </span>
        </Link>

        {categories.map((category) => (
          <Link
            key={category.name}
            href={category.url}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ease-out',
              activeCategory === category.name
                ? 'bg-gray-900 text-white shadow'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <FolderIcon className="w-4 h-4" />
            {category.name}
            <span
              className={cn(
                'ml-0.5 px-1.5 py-0.5 rounded-full text-xs',
                activeCategory === category.name
                  ? 'bg-white/15'
                  : 'bg-gray-200'
              )}
            >
              {category.count}
            </span>
          </Link>
        ))}
      </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white/90 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white/90 to-transparent" />
      </div>

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-260)}
          className="absolute left-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-gray-200 bg-white/90 shadow-sm text-gray-700 hover:bg-white transition-colors"
          aria-label="向左滚动分类"
        >
          ‹
        </button>
      )}

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(260)}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-gray-200 bg-white/90 shadow-sm text-gray-700 hover:bg-white transition-colors"
          aria-label="向右滚动分类"
        >
          ›
        </button>
      )}
    </div>
  );
}
