import { RefObject } from 'react';
import { CButtonGroup, CButton } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilBold, cilItalic, cilList, cilListNumbered, cilLink, cilHeader } from '@coreui/icons';

interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
}

type FormatAction = 'bold' | 'italic' | 'heading' | 'ul' | 'ol' | 'link';

function applyFormat(
  textarea: HTMLTextAreaElement,
  value: string,
  action: FormatAction,
): { newValue: string; cursorPos: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end);
  const before = value.slice(0, start);
  const after = value.slice(end);

  let insert: string;
  let cursorOffset: number;

  switch (action) {
    case 'bold':
      insert = selected ? `**${selected}**` : '**bold**';
      cursorOffset = selected ? insert.length : 2;
      break;
    case 'italic':
      insert = selected ? `*${selected}*` : '*italic*';
      cursorOffset = selected ? insert.length : 1;
      break;
    case 'heading':
      insert = selected ? `## ${selected}` : '## heading';
      cursorOffset = selected ? insert.length : 3;
      break;
    case 'ul':
      insert = selected
        ? selected.split('\n').map((line) => `- ${line}`).join('\n')
        : '- item';
      cursorOffset = selected ? insert.length : 2;
      break;
    case 'ol':
      insert = selected
        ? selected.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
        : '1. item';
      cursorOffset = selected ? insert.length : 3;
      break;
    case 'link':
      if (selected) {
        insert = `[${selected}](url)`;
        cursorOffset = insert.length - 1;
      } else {
        insert = '[text](url)';
        cursorOffset = 1;
      }
      break;
  }

  const newValue = before + insert + after;
  const cursorPos = selected ? start + insert.length : start + cursorOffset;

  return { newValue, cursorPos };
}

const buttons: { action: FormatAction; icon: string[]; label: string }[] = [
  { action: 'bold', icon: cilBold, label: 'Bold' },
  { action: 'italic', icon: cilItalic, label: 'Italic' },
  { action: 'heading', icon: cilHeader, label: 'Heading' },
  { action: 'ul', icon: cilList, label: 'Bullet list' },
  { action: 'ol', icon: cilListNumbered, label: 'Numbered list' },
  { action: 'link', icon: cilLink, label: 'Link' },
];

export default function MarkdownToolbar({ textareaRef, value, onChange }: MarkdownToolbarProps) {
  const handleClick = (action: FormatAction) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { newValue, cursorPos } = applyFormat(textarea, value, action);
    onChange(newValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  return (
    <CButtonGroup size="sm" className="mb-1">
      {buttons.map(({ action, icon, label }) => (
        <CButton
          key={action}
          color="secondary"
          variant="ghost"
          onClick={() => handleClick(action)}
          title={label}
          type="button"
        >
          <CIcon icon={icon} size="sm" />
        </CButton>
      ))}
    </CButtonGroup>
  );
}
