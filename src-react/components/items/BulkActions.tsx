import { useState, useEffect } from 'react';
import { CButtonGroup, CButton, CDropdown, CDropdownToggle, CDropdownMenu, CDropdownItem } from '@coreui/react';
import { FaTrash, FaFolderOpen } from 'react-icons/fa';
import * as categoryService from '../../services/categoryService';

interface BulkActionsProps {
  selectedCount: number;
  onDelete: () => void;
  onCategoryChange: (category: string) => void;
}

export default function BulkActions({
  selectedCount,
  onDelete,
  onCategoryChange,
}: BulkActionsProps) {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await categoryService.getCategoryNames();
        setCategories(cats);
      } catch {
        // silently handle
      }
    }
    loadCategories();
  }, []);

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="mb-3 p-2 bg-light rounded d-flex align-items-center gap-2">
      <span className="me-2">
        <strong>{selectedCount}</strong> item{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <CButtonGroup size="sm">
        <CButton color="danger" variant="outline" onClick={onDelete}>
          <FaTrash className="me-1" />
          Delete Selected
        </CButton>
        <CDropdown
          visible={showCategoryDropdown}
          onShow={() => setShowCategoryDropdown(true)}
          onHide={() => setShowCategoryDropdown(false)}
        >
          <CDropdownToggle color="secondary" variant="outline" size="sm">
            <FaFolderOpen className="me-1" />
            Change Category
          </CDropdownToggle>
          <CDropdownMenu style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {categories.map((category) => (
              <CDropdownItem
                key={category}
                onClick={() => {
                  onCategoryChange(category);
                  setShowCategoryDropdown(false);
                }}
              >
                {category}
              </CDropdownItem>
            ))}
          </CDropdownMenu>
        </CDropdown>
      </CButtonGroup>
    </div>
  );
}
