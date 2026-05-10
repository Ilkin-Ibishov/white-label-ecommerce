'use client';

// Gamma Sprint 1.3 - G15: Edit existing product page.

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProductForm } from '@/components/admin/ProductForm';
import { useAdminProduct, useUpdateProduct } from '@/lib/admin/queries';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const productQuery = useAdminProduct(id);
  const updateMutation = useUpdateProduct(id);

  return (
    <div className="space-y-4">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/admin/products">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to products
          </Link>
        </Button>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Edit product
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Update product details, pricing, and visibility.
        </p>
      </div>

      {productQuery.isPending ? (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-sm text-slate-600 dark:text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading product…
          </CardContent>
        </Card>
      ) : productQuery.error ? (
        <Card className="border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/40">
          <CardContent className="p-4 text-sm text-red-800 dark:text-red-200">
            {productQuery.error instanceof Error
              ? productQuery.error.message
              : 'Could not load product.'}
          </CardContent>
        </Card>
      ) : (
        <ProductForm
          initial={productQuery.data}
          submitLabel="Save changes"
          isSubmitting={updateMutation.isPending}
          onCancel={() => router.push('/admin/products')}
          onSubmit={async (values) => {
            try {
              const result = await updateMutation.mutateAsync(values);
              toast.success(`Saved ${result.data.name_en}`);
              router.push('/admin/products');
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : 'Failed to save product'
              );
            }
          }}
        />
      )}
    </div>
  );
}
