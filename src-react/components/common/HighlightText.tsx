interface HighlightTextProps {
  text: string;
  highlight: string;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function HighlightText({ text, highlight }: HighlightTextProps) {
  if (!highlight.trim()) return <>{text}</>;
  
  const regex = new RegExp(`(${escapeRegex(highlight)})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-warning bg-opacity-50 px-0">
            {part}
          </mark>
        ) : part
      )}
    </>
  );
}