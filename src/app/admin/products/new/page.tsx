'use client';

// Gamma Sprint 1.3 - G15: Create new product page.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ProductForm } from '@/components/admin/ProductForm';
import { useCreateProduct } from '@/lib/admin/queries';

export default function NewProductPage() {
  const router = useRouter();
  const createMutation = useCreateProduct();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/admin/products">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to products
            </Link>
          </Button>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            New product
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Add a new SKU to your catalog. English name is required.
          </p>
        </div>
      </div>

      <ProductForm
        submitLabel="Create product"
        isSubmitting={createMutation.isPending}
        onCancel={() => router.push('/admin/products')}
        onSubmit={async (values) => {
          try {
            const result = await createMutation.mutateAsync(values);
            toast.success(`Created ${result.data.name_en}`);
            router.push('/admin/products');
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : 'Failed to create product'
            );
          }
        }}
      />
    </div>
  );
}
