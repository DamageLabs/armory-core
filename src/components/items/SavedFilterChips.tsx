import { useState } from 'react';
import { CBadge, CButton, CFormInput, CInputGroup } from '@coreui/react';
import { FaSave, FaTimes, FaCheck } from 'react-icons/fa';
import { SavedFilter, FilterConfig } from '../../types/SavedFilter';

interface SavedFilterChipsProps {
  savedFilters: SavedFilter[];
  activeFilterId: number | null;
  onApply: (filter: SavedFilter) => void;
  onSave: (name: string) => void;
  onDelete: (id: number) => void;
  canSave: boolean;
}

export default function SavedFilterChips({
  savedFilters,
  activeFilterId,
  onApply,
  onSave,
  onDelete,
  canSave,
}: SavedFilterChipsProps) {
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [filterName, setFilterName] = useState('');

  const handleSave = () => {
    if (!filterName.trim()) return;
    onSave(filterName.trim());
    setFilterName('');
    setShowSaveInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setShowSaveInput(false);
  };

  return (
    <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
      {savedFilters.map((sf) => (
        <span key={sf.id} className="d-inline-flex align-items-center">
          <CBadge
            color={activeFilterId === sf.id ? 'primary' : 'secondary'}
            role="button"
            onClick={() => onApply(sf)}
            className="px-2 py-1"
            style={{ cursor: 'pointer' }}
          >
            {sf.name}
          </CBadge>
          <CButton
            color="link"
            size="sm"
            className="p-0 ms-1 text-danger"
            onClick={() => onDelete(sf.id)}
            title={`Delete "${sf.name}"`}
          >
            <FaTimes size={10} />
          </CButton>
        </span>
      ))}

      {showSaveInput ? (
        <CInputGroup size="sm" style={{ width: '200px' }}>
          <CFormInput
            placeholder="Filter name..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <CButton color="success" variant="outline" onClick={handleSave} disabled={!filterName.trim()}>
            <FaCheck />
          </CButton>
          <CButton color="secondary" variant="outline" onClick={() => setShowSaveInput(false)}>
            <FaTimes />
          </CButton>
        </CInputGroup>
      ) : (
        canSave && (
          <CButton
            color="primary"
            variant="ghost"
            size="sm"
            onClick={() => setShowSaveInput(true)}
            title="Save current filters"
          >
            <FaSave className="me-1" /> Save Filter
          </CButton>
        )
      )}
    </div>
  );
}
