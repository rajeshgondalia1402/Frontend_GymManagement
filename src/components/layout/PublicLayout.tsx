import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, ArrowLeft } from 'lucide-react';

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="h-14 sm:h-16 border-b border-gray-200 bg-white px-4 sm:px-6 flex items-center justify-between shrink-0">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">
            Gym Desk<span className="text-emerald-500"> Pro</span>
          </span>
        </Link>
        <Link
          to="/"
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Home</span>
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 px-4 sm:px-6 text-center shrink-0">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} Gym Desk Pro. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
