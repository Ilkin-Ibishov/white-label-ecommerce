import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Sign in to manage your store
          </p>
        </div>
        
        <form className="space-y-4">
          <div className="space-y-2">
            <label 
              htmlFor="email" 
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label 
              htmlFor="password" 
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
          
          <Button type="submit" className="w-full">
            Sign In
          </Button>
        </form>
        
        <div className="text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Demo credentials: admin@example.com / admin123</p>
        </div>
      </div>
    </div>
  )
}
