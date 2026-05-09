import { storeConfig } from '../../../config/store.config';

export function StorefrontFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-200 bg-white py-8 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 md:flex-row">
        <p>
          © {year} {storeConfig.name}. {storeConfig.description}.
        </p>
        <p className="text-xs">Pay on delivery available · Secure checkout</p>
      </div>
    </footer>
  );
}

export default StorefrontFooter;
