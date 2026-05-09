export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
            White-Label E-Commerce
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8">
            A modern, mobile-first e-commerce platform built with Next.js 16, 
            Supabase, and shadcn/ui.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/admin/login" 
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Admin Dashboard
            </a>
            <a 
              href="/api/health" 
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              API Health Check
            </a>
          </div>
          <div className="mt-12 p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Project Status
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="font-medium text-slate-900 dark:text-white">Phase</div>
                <div className="text-slate-600 dark:text-slate-300">Foundation (Sprint 1.1)</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="font-medium text-slate-900 dark:text-white">Stack</div>
                <div className="text-slate-600 dark:text-slate-300">Next.js 16 + Supabase</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="font-medium text-slate-900 dark:text-white">Status</div>
                <div className="text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
