import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CCard, CCardHeader, CCardBody, CButton, CBadge,
  CFormTextarea, CSpinner,
} from '@coreui/react';
import Markdown from 'react-markdown';
import { Note } from '../../types/Note';
import * as noteService from '../../services/noteService';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime } from '../../utils/formatters';
import ConfirmModal from '../common/ConfirmModal';
import MarkdownToolbar from '../common/MarkdownToolbar';
import Pagination from '../common/Pagination';

interface ItemNotesProps {
  itemId: number;
}

export default function ItemNotes({ itemId }: ItemNotesProps) {
  const { showSuccess, showError } = useAlert();
  const { user, isAdmin } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadNotes = useCallback(async (p: number) => {
    try {
      const result = await noteService.getNotes(itemId, p);
      setNotes(result.data);
      setTotalItems(result.pagination.totalItems);
      setTotalPages(result.pagination.totalPages);
      setPage(result.pagination.page);
    } catch {
      // Supplementary — silent fail
    }
  }, [itemId]);

  useEffect(() => {
    loadNotes(1);
  }, [loadNotes]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      await noteService.createNote(itemId, content.trim());
      setContent('');
      showSuccess('Note added.');
      await loadNotes(1);
    } catch {
      showError('Failed to add note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await noteService.deleteNote(deleteTarget.id);
      showSuccess('Note deleted.');
      setNotes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
      setTotalItems((prev) => prev - 1);
    } catch {
      showError('Failed to delete note.');
    }
    setDeleteTarget(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const canDelete = (note: Note) =>
    note.userId === user?.id || isAdmin;

  return (
    <>
      <CCard className="mb-3">
        <CCardHeader>
          <h6 className="mb-0">
            Notes{' '}
            {totalItems > 0 && <CBadge color="secondary">{totalItems}</CBadge>}
          </h6>
        </CCardHeader>
        <CCardBody>
          <MarkdownToolbar
            textareaRef={textareaRef}
            value={content}
            onChange={setContent}
          />
          <CFormTextarea
            ref={textareaRef}
            placeholder="Add a note... (Markdown supported)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            className="mb-2"
          />
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">Ctrl+Enter to submit</small>
            <CButton
              color="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting || !content.trim()}
            >
              {isSubmitting ? <><CSpinner size="sm" className="me-1" />Saving...</> : 'Add Note'}
            </CButton>
          </div>
        </CCardBody>

        {notes.length > 0 && (
          <>
            {notes.map((note) => (
              <CCardBody key={note.id} className="border-top py-3">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <div>
                    <strong>{note.userEmail}</strong>
                    <small className="text-muted ms-2">{formatDateTime(note.createdAt)}</small>
                  </div>
                  {canDelete(note) && (
                    <CButton
                      color="danger"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteTarget(note)}
                    >
                      Delete
                    </CButton>
                  )}
                </div>
                <div className="note-content">
                  <Markdown components={{
                    a: ({ children, ...props }) => (
                      <a {...props} target="_blank" rel="noopener noreferrer">{children}</a>
                    ),
                  }}>
                    {note.content}
                  </Markdown>
                </div>
              </CCardBody>
            ))}

            {totalPages > 1 && (
              <CCardBody className="border-top py-2">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  itemsPerPage={20}
                  onPageChange={(p) => loadNotes(p)}
                />
              </CCardBody>
            )}
          </>
        )}
      </CCard>

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
