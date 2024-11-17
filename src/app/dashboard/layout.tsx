import Footer from '@/components/layout/Footer';
import { ThemeProvider } from 'next-themes';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* Main Content */}
        <div className="flex-grow">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </ThemeProvider>
  );
} 