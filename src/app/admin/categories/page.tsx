'use client';

// Gamma Sprint 1.3 - G16: Category management.
// - Tree view of all categories with parent/child indentation.
// - Add / edit category via shared form modal.
// - Delete with confirmation. Parent dropdown excludes self + descendants
//   when editing to prevent accidental cycles.

import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  buildCategoryTree,
  CategoryTree,
  type CategoryTreeNode,
} from '@/components/admin/CategoryTree';
import {
  useAdminCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/lib/admin/queries';
import type { AdminCategory } from '@/lib/admin/types';

const categorySchema = z.object({
  name_en: z.string().min(1, 'English name is required'),
  name_az: z.string().optional(),
  name_ru: z.string().optional(),
  description_en: z.string().optional(),
  parent_id: z.string().optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function AdminCategoriesPage() {
  const categoriesQuery = useAdminCategories();
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);

  const tree = useMemo(
    () => buildCategoryTree(categoriesQuery.data?.data ?? []),
    [categoriesQuery.data]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Categories
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Organize your catalog into a category hierarchy.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add category
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">All categories</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {categoriesQuery.isPending ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : categoriesQuery.error ? (
            <p className="p-4 text-sm text-red-600">
              Could not load categories:{' '}
              {categoriesQuery.error instanceof Error
                ? categoriesQuery.error.message
                : 'Unknown error'}
            </p>
          ) : (
            <CategoryTree
              nodes={tree}
              onEdit={(cat) => setEditing(cat)}
              onDelete={(cat) => setDeleting(cat)}
            />
          )}
        </CardContent>
      </Card>

      <CategoryFormDialog
        mode="create"
        open={creating}
        onClose={() => setCreating(false)}
        categories={categoriesQuery.data?.data ?? []}
      />

      <CategoryFormDialog
        mode="edit"
        open={editing !== null}
        category={editing ?? undefined}
        onClose={() => setEditing(null)}
        categories={categoriesQuery.data?.data ?? []}
        tree={tree}
      />

      <DeleteCategoryDialog
        category={deleting}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

interface CategoryFormDialogProps {
  mode: 'create' | 'edit';
  open: boolean;
  onClose: () => void;
  category?: AdminCategory;
  categories: AdminCategory[];
  tree?: CategoryTreeNode[];
}

function CategoryFormDialog({
  mode,
  open,
  onClose,
  category,
  categories,
  tree,
}: CategoryFormDialogProps) {
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(category?.id ?? '');
  const isPending =
    mode === 'create' ? createMutation.isPending : updateMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    values:
      mode === 'edit' && category
        ? {
            name_en: category.name_en,
            name_az: category.name_az ?? '',
            name_ru: category.name_ru ?? '',
            description_en: category.description_en ?? '',
            parent_id: category.parent_id ?? '',
            sort_order: category.sort_order,
          }
        : {
            name_en: '',
            name_az: '',
            name_ru: '',
            description_en: '',
            parent_id: '',
            sort_order: 0,
          },
  });

  const disabledParentIds = useMemo(() => {
    if (mode !== 'edit' || !category || !tree) return new Set<string>();
    const blocked = new Set<string>([category.id]);
    const collect = (nodes: CategoryTreeNode[]) => {
      for (const node of nodes) {
        if (blocked.has(node.id)) {
          const queue = [node];
          while (queue.length) {
            const current = queue.shift()!;
            for (const child of current.children) {
              blocked.add(child.id);
              queue.push(child);
            }
          }
        }
        collect(node.children);
      }
    };
    collect(tree);
    return blocked;
  }, [category, mode, tree]);

  const submit = handleSubmit(async (values) => {
    const payload = {
      name_en: values.name_en,
      name_az: values.name_az || undefined,
      name_ru: values.name_ru || undefined,
      description_en: values.description_en || undefined,
      parent_id: values.parent_id ? values.parent_id : null,
      sort_order: Number.isFinite(values.sort_order) ? values.sort_order : 0,
    };
    try {
      if (mode === 'create') {
        const result = await createMutation.mutateAsync(payload);
        toast.success(`Created ${result.data.name_en}`);
      } else if (category) {
        const result = await updateMutation.mutateAsync(payload);
        toast.success(`Saved ${result.data.name_en}`);
      }
      reset();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save category');
    }
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add category' : `Edit ${category?.name_en}`}
          </DialogTitle>
          <DialogDescription>
            Categories support multi-language names and a parent for nesting.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="name_en">Name (EN)</Label>
            <Input id="name_en" {...register('name_en')} />
            {errors.name_en ? (
              <p className="text-xs text-red-600">{errors.name_en.message}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <Label htmlFor="name_az">Name (AZ)</Label>
            <Input id="name_az" {...register('name_az')} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="name_ru">Name (RU)</Label>
            <Input id="name_ru" {...register('name_ru')} />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor="description_en">Description (EN)</Label>
            <Textarea
              id="description_en"
              rows={3}
              {...register('description_en')}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="parent_id">Parent category</Label>
            <Select id="parent_id" {...register('parent_id')}>
              <option value="">— None (root) —</option>
              {categories.map((cat) => (
                <option
                  key={cat.id}
                  value={cat.id}
                  disabled={disabledParentIds.has(cat.id)}
                >
                  {cat.name_en}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="sort_order">Sort order</Label>
            <Input
              id="sort_order"
              type="number"
              min={0}
              step={1}
              {...register('sort_order')}
            />
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Saving…'
                : mode === 'create'
                  ? 'Create category'
                  : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCategoryDialog({
  category,
  onClose,
}: {
  category: AdminCategory | null;
  onClose: () => void;
}) {
  const deleteMutation = useDeleteCategory();

  const confirm = async () => {
    if (!category) return;
    try {
      await deleteMutation.mutateAsync(category.id);
      toast.success(`Deleted ${category.name_en}`);
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete category'
      );
    }
  };

  return (
    <Dialog
      open={category !== null}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent onClose={onClose}>
        <DialogHeader>
          <DialogTitle>Delete {category?.name_en}?</DialogTitle>
          <DialogDescription>
            Children of this category will be promoted to root level. Products
            in this category will keep their data but lose their category
            assignment.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
