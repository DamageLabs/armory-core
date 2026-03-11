import { useState, useEffect } from 'react';
import { CFormSelect } from '@coreui/react';
import * as itemService from '../../services/itemService';
import { Item } from '../../types/Item';

interface ParentItemSelectorProps {
  value: number | null;
  onChange: (id: number | null) => void;
  currentItemId?: number;
}

export default function ParentItemSelector({ value, onChange, currentItemId }: ParentItemSelectorProps) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    async function loadItems() {
      try {
        const allItems = await itemService.getAllItems();
        setItems(allItems);
      } catch {
        // silently handle
      }
    }
    loadItems();
  }, []);

  const availableItems = items.filter((item) => {
    if (currentItemId && item.id === currentItemId) return false;
    if (currentItemId && item.parentItemId === currentItemId) return false;
    return true;
  });

  const grouped = availableItems.reduce<Record<string, Item[]>>((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <CFormSelect
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
    >
      <option value="">None (standalone item)</option>
      {Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, categoryItems]) => (
          <optgroup key={category} label={category}>
            {categoryItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </optgroup>
        ))}
    </CFormSelect>
  );
}
