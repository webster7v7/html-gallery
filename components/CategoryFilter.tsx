'use client';

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
  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
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
    </div>
  );
}
