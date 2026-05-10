// Gamma Sprint 1.3 - G16: Category tree renderer.
// Recursively renders categories with their children indented one level.

import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { AdminCategory } from '@/lib/admin/types';

export interface CategoryTreeNode extends AdminCategory {
  children: CategoryTreeNode[];
}

export function buildCategoryTree(
  categories: AdminCategory[]
): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  categories.forEach((cat) =>
    map.set(cat.id, { ...cat, children: [] })
  );

  const roots: CategoryTreeNode[] = [];
  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: CategoryTreeNode[]) => {
    nodes.sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        a.name_en.localeCompare(b.name_en)
    );
    nodes.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);

  return roots;
}

interface CategoryTreeProps {
  nodes: CategoryTreeNode[];
  onEdit: (category: AdminCategory) => void;
  onDelete: (category: AdminCategory) => void;
  level?: number;
}

export function CategoryTree({
  nodes,
  onEdit,
  onDelete,
  level = 0,
}: CategoryTreeProps) {
  if (nodes.length === 0) {
    return (
      <p className="p-4 text-sm text-slate-500 dark:text-slate-400">
        No categories yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-200 dark:divide-slate-800">
      {nodes.map((node) => (
        <li key={node.id}>
          <CategoryRow
            node={node}
            level={level}
            onEdit={onEdit}
            onDelete={onDelete}
          />
          {node.children.length > 0 ? (
            <CategoryTree
              nodes={node.children}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function CategoryRow({
  node,
  level,
  onEdit,
  onDelete,
}: {
  node: CategoryTreeNode;
  level: number;
  onEdit: (category: AdminCategory) => void;
  onDelete: (category: AdminCategory) => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 px-3 py-2"
      style={{ paddingLeft: 12 + level * 20 }}
    >
      <div className="flex min-w-0 items-center gap-2">
        {level > 0 ? (
          <ChevronRight
            className="h-4 w-4 shrink-0 text-slate-400"
            aria-hidden="true"
          />
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
            {node.name_en}
          </p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            /{node.slug}
            {node.parent_id ? ' · child' : ''}
          </p>
        </div>
        {node.children.length > 0 ? (
          <Badge variant="outline" className="ml-2">
            {node.children.length} child
            {node.children.length === 1 ? '' : 'ren'}
          </Badge>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(node)}
          aria-label={`Edit ${node.name_en}`}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(node)}
          aria-label={`Delete ${node.name_en}`}
        >
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </div>
    </div>
  );
}
