'use client';

// Gamma Sprint 1.3 - G15: Product create/edit form.
// Uses react-hook-form + zod (already in the project) for client-side
// validation and inline error rendering. Shared between
// /admin/products/new and /admin/products/[id]/edit.

import { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { useAdminCategories } from '@/lib/admin/queries';
import type { AdminProductDetail, AdminProductInput } from '@/lib/admin/types';

const productSchema = z.object({
  name_en: z.string().min(1, 'English name is required'),
  name_az: z.string().optional(),
  name_ru: z.string().optional(),
  description_en: z.string().optional(),
  description_az: z.string().optional(),
  description_ru: z.string().optional(),
  price: z.coerce
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than zero'),
  original_price: z
    .union([
      z.coerce.number().positive('Must be greater than zero'),
      z.literal('').transform(() => undefined),
    ])
    .optional(),
  stock_available: z.coerce
    .number({ invalid_type_error: 'Stock must be a number' })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative'),
  category_id: z.string().optional(),
  image_url: z.string().optional(),
  image_gallery: z.array(z.string()).default([]),
  is_featured: z.boolean(),
  is_on_sale: z.boolean(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export interface ProductFormProps {
  initial?: Partial<AdminProductDetail>;
  submitLabel: string;
  onSubmit: (values: AdminProductInput) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function ProductForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  isSubmitting,
}: ProductFormProps) {
  const categoriesQuery = useAdminCategories();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: toFormValues(initial),
  });

  // When async-loaded `initial` arrives (edit page), reset the form values.
  useEffect(() => {
    if (initial && initial.id) {
      reset(toFormValues(initial));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial?.id]);

  const imageUrl = watch('image_url') ?? '';
  const gallery = watch('image_gallery') ?? [];
  const isFeatured = watch('is_featured');
  const isOnSale = watch('is_on_sale');

  const submit: SubmitHandler<ProductFormValues> = async (values) => {
    const payload: AdminProductInput = {
      name_en: values.name_en,
      name_az: values.name_az || undefined,
      name_ru: values.name_ru || undefined,
      description_en: values.description_en || undefined,
      description_az: values.description_az || undefined,
      description_ru: values.description_ru || undefined,
      price: values.price,
      original_price:
        typeof values.original_price === 'number'
          ? values.original_price
          : undefined,
      stock_available: values.stock_available,
      category_id: values.category_id ? values.category_id : null,
      image_url: values.image_url || undefined,
      image_gallery: values.image_gallery,
      is_featured: values.is_featured,
      is_on_sale: values.is_on_sale,
    };
    await onSubmit(payload);
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="grid grid-cols-1 gap-6 lg:grid-cols-3"
    >
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Names</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Name (EN)" htmlFor="name_en" error={errors.name_en?.message}>
              <Input
                id="name_en"
                placeholder="Wireless headphones"
                {...register('name_en')}
              />
            </Field>
            <Field label="Name (AZ)" htmlFor="name_az">
              <Input
                id="name_az"
                placeholder="Simsiz qulaqlıqlar"
                {...register('name_az')}
              />
            </Field>
            <Field label="Name (RU)" htmlFor="name_ru">
              <Input
                id="name_ru"
                placeholder="Беспроводные наушники"
                {...register('name_ru')}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Descriptions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Description (EN)" htmlFor="description_en">
              <Textarea
                id="description_en"
                rows={5}
                {...register('description_en')}
              />
            </Field>
            <Field label="Description (AZ)" htmlFor="description_az">
              <Textarea
                id="description_az"
                rows={5}
                {...register('description_az')}
              />
            </Field>
            <Field label="Description (RU)" htmlFor="description_ru">
              <Textarea
                id="description_ru"
                rows={5}
                {...register('description_ru')}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader
              primaryUrl={imageUrl}
              gallery={gallery}
              onChange={({ primaryUrl, gallery: nextGallery }) => {
                setValue('image_url', primaryUrl, { shouldDirty: true });
                setValue('image_gallery', nextGallery, { shouldDirty: true });
              }}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pricing & inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Price" htmlFor="price" error={errors.price?.message}>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                {...register('price')}
              />
            </Field>
            <Field
              label="Original price (for discount strike-through)"
              htmlFor="original_price"
              error={errors.original_price?.message}
            >
              <Input
                id="original_price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min={0}
                {...register('original_price')}
              />
            </Field>
            <Field
              label="Stock available"
              htmlFor="stock_available"
              error={errors.stock_available?.message}
            >
              <Input
                id="stock_available"
                type="number"
                inputMode="numeric"
                step="1"
                min={0}
                {...register('stock_available')}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Organization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Category" htmlFor="category_id">
              <Select id="category_id" {...register('category_id')}>
                <option value="">— None —</option>
                {categoriesQuery.data?.data.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name_en}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
              <div>
                <Label htmlFor="is_featured">Featured</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Highlight on storefront
                </p>
              </div>
              <Switch
                id="is_featured"
                checked={Boolean(isFeatured)}
                onCheckedChange={(next) =>
                  setValue('is_featured', next, { shouldDirty: true })
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
              <div>
                <Label htmlFor="is_on_sale">On sale</Label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Show sale tag
                </p>
              </div>
              <Switch
                id="is_on_sale"
                checked={Boolean(isOnSale)}
                onCheckedChange={(next) =>
                  setValue('is_on_sale', next, { shouldDirty: true })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          ) : null}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function toFormValues(
  initial?: Partial<AdminProductDetail>
): ProductFormValues {
  return {
    name_en: initial?.name_en ?? '',
    name_az: initial?.name_az ?? '',
    name_ru: initial?.name_ru ?? '',
    description_en: initial?.description_en ?? '',
    description_az: initial?.description_az ?? '',
    description_ru: initial?.description_ru ?? '',
    price: typeof initial?.price === 'number' ? initial.price : 0,
    original_price:
      typeof initial?.original_price === 'number'
        ? initial.original_price
        : undefined,
    stock_available:
      typeof initial?.stock_available === 'number'
        ? initial.stock_available
        : 0,
    category_id: initial?.category_id ?? '',
    image_url: initial?.image_url ?? '',
    image_gallery: initial?.image_gallery ?? [],
    is_featured: Boolean(initial?.is_featured),
    is_on_sale: Boolean(initial?.is_on_sale),
  };
}
