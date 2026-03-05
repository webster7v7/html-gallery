import Link from 'next/link';

interface NavbarProps {
  title?: string;
  subtitle?: string;
}

export function Navbar({
  title = 'HTML Gallery',
  subtitle = '自动收集 · 一键预览 · 更专注于内容本身',
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <Link href="/" className="block min-w-0">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-sm" />
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-gray-900">{title}</div>
                <div className="truncate text-xs text-gray-600">{subtitle}</div>
              </div>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            画廊
          </Link>
          <Link
            href="/#"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100"
          >
            使用说明
          </Link>
        </nav>
      </div>
    </header>
  );
}
