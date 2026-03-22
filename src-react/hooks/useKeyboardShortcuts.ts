import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export interface Shortcut {
  key: string;
  description: string;
  action: () => void;
  requiresAuth?: boolean;
}

export function useKeyboardShortcuts(onShowHelp: () => void) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const shortcuts: Shortcut[] = [
    { key: '?', description: 'Show keyboard shortcuts', action: onShowHelp },
    { key: 'n', description: 'Create new item', action: () => navigate('/items/new'), requiresAuth: true },
    { key: 'i', description: 'Go to inventory', action: () => navigate('/items'), requiresAuth: true },
    { key: 'h', description: 'Go to home', action: () => navigate('/') },
    { key: 'r', description: 'Go to reports', action: () => navigate('/reports'), requiresAuth: true },
    { key: 'b', description: 'Go to BOMs', action: () => navigate('/bom'), requiresAuth: true },
  ];

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if user is typing in an input, textarea, or contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Only allow Escape in inputs
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Handle Ctrl+K or / for search focus
      if ((event.ctrlKey && event.key === 'k') || (event.key === '/' && !event.ctrlKey && !event.metaKey)) {
        event.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>('[data-search-input]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Handle Escape
      if (event.key === 'Escape') {
        // Blur any focused input
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        return;
      }

      // Find and execute matching shortcut
      const shortcut = shortcuts.find((s) => s.key === event.key);
      if (shortcut) {
        if (shortcut.requiresAuth && !isAuthenticated) {
          return;
        }
        event.preventDefault();
        shortcut.action();
      }
    },
    [shortcuts, isAuthenticated]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return shortcuts;
}

export function useShortcutHelp() {
  const [showHelp, setShowHelp] = useState(false);
  const openHelp = useCallback(() => setShowHelp(true), []);
  const closeHelp = useCallback(() => setShowHelp(false), []);
  return { showHelp, openHelp, closeHelp };
}
