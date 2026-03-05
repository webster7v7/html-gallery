import { scanHTMLFiles, getCategories, sortItems, filterByCategory } from '@/lib/scan-html';
import { CategoryFilter } from '@/components/CategoryFilter';
import { PreviewCard } from '@/components/PreviewCard';
import { CalendarIcon, TextIcon } from '@/components/Icons';

interface HomePageProps {
  searchParams: Promise<{
    category?: string;
    sort?: 'date' | 'name';
    order?: 'asc' | 'desc';
  }>;
}

export const revalidate = 60;

export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const allItems = await scanHTMLFiles();
  const categories = getCategories(allItems);

  const sortBy = params.sort || 'date';
  const order = params.order || 'desc';
  const activeCategory = params.category || null;

  const filteredItems = filterByCategory(allItems, activeCategory);
  const sortedItems = sortItems(filteredItems, sortBy, order);

  const buildSortUrl = (type: 'date' | 'name') => {
    const defaultOrder: Record<'date' | 'name', 'asc' | 'desc'> = {
      date: 'desc',
      name: 'asc',
    };

    const newOrder = sortBy === type ? (order === 'desc' ? 'asc' : 'desc') : defaultOrder[type];
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    params.set('sort', type);
    params.set('order', newOrder);
    return `/?${params.toString()}`;
  };

  const buildToggleOrderUrl = () => {
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    params.set('sort', sortBy);
    params.set('order', order === 'desc' ? 'asc' : 'desc');
    return `/?${params.toString()}`;
  };

  const allCount = categories.reduce((sum, cat) => sum + cat.count, 0);
  const allUrl = `/?sort=${sortBy}&order=${order}`;
  const categoriesWithUrls = categories.map((cat) => ({
    ...cat,
    url: `/?category=${encodeURIComponent(cat.name)}&sort=${sortBy}&order=${order}`,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-gray-50 to-white">
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">HTML Gallery</h1>
            <p className="text-gray-600">精选 HTML 页面作品集，一键预览</p>
          </header>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-sm p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <CategoryFilter
              categories={categoriesWithUrls}
              allCount={allCount}
              allUrl={allUrl}
              activeCategory={activeCategory}
            />

            <div className="flex items-center justify-between gap-3 sm:justify-start">
              <span className="text-sm font-medium text-gray-600 whitespace-nowrap">排序</span>

              <div className="flex w-full sm:w-auto items-center gap-2">
                <div className="flex items-center bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                  <a
                    href={buildSortUrl('date')}
                    className={`flex-1 sm:flex-initial justify-center flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      sortBy === 'date'
                        ? 'bg-gray-900 text-white shadow'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-current={sortBy === 'date' ? 'page' : undefined}
                  >
                    <CalendarIcon className="w-4 h-4 shrink-0" />
                    <span>时间</span>
                  </a>
                  <a
                    href={buildSortUrl('name')}
                    className={`flex-1 sm:flex-initial justify-center flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      sortBy === 'name'
                        ? 'bg-gray-900 text-white shadow'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    aria-current={sortBy === 'name' ? 'page' : undefined}
                  >
                    <TextIcon className="w-4 h-4 shrink-0" />
                    <span>名称</span>
                  </a>
                </div>

                <a
                  href={buildToggleOrderUrl()}
                  className="inline-flex items-center justify-center h-11 w-11 rounded-xl border border-gray-200 bg-white shadow-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label={order === 'desc' ? '切换为升序' : '切换为降序'}
                  title={order === 'desc' ? '降序' : '升序'}
                >
                  <span className="text-base font-semibold leading-none">{order === 'desc' ? '↓' : '↑'}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {sortedItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">暂无 HTML 文件</h3>
            <p className="text-gray-500">
              请在 <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm">content</code> 目录下添加 HTML 文件
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedItems.map((item) => (
              <PreviewCard key={item.slug} item={item} />
            ))}
          </div>
        )}

          <footer className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>共 {allItems.length} 个文件 · {categories.length} 个分类</p>
          </footer>
        </div>
      </main>
    </div>
  );
}