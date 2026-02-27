'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';

interface CategoryItem {
  name: string;
  count: number;
  url: string;
}

interface CategoryFilterProps {
  categories: CategoryItem[];
  allCount: number;
  activeCategory: string | null;
}

export function CategoryFilter({ categories, allCount, activeCategory }: CategoryFilterProps) {
  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-hide">
      <div className="flex flex-nowrap gap-2 min-w-max md:flex-wrap md:min-w-0">
        <Link
          href="/"
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-out',
            !activeCategory || activeCategory === 'all'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          全部
          <span
            className={cn(
              'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
              !activeCategory || activeCategory === 'all'
                ? 'bg-white/20'
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
              'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ease-out',
              activeCategory === category.name
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {category.name}
            <span
              className={cn(
                'ml-1.5 px-1.5 py-0.5 rounded-full text-xs',
                activeCategory === category.name
                  ? 'bg-white/20'
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
