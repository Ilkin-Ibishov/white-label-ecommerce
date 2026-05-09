export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Admin Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              admin@example.com
            </span>
            <a 
              href="/admin/login"
              className="text-sm text-red-600 hover:text-red-700"
            >
              Logout
            </a>
          </div>
        </div>
      </header>

      {/* Admin Layout */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <nav className="space-y-2">
              <a 
                href="/admin/dashboard" 
                className="block px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-medium"
              >
                Dashboard
              </a>
              <a 
                href="/admin/products" 
                className="block px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Products
              </a>
              <a 
                href="/admin/orders" 
                className="block px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Orders
              </a>
              <a 
                href="/admin/customers" 
                className="block px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Customers
              </a>
              <a 
                href="/admin/analytics" 
                className="block px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
              >
                Analytics
              </a>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Orders</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">1,234</div>
              </div>
              <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">Revenue</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">₼12,345</div>
              </div>
              <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">Customers</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">567</div>
              </div>
              <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">Products</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">10,000</div>
              </div>
            </div>

            <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Recent Orders
              </h2>
              <p className="text-slate-600 dark:text-slate-300">
                Order management coming in Sprint 1.2
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
