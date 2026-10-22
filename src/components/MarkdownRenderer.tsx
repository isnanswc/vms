import React from 'react';

interface MarkdownRendererProps {
  content: string;
  isUser?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, isUser = false }) => {
  if (isUser) {
    // For user messages, simple clean text
    return <div className="whitespace-pre-line text-sm leading-relaxed">{content}</div>;
  }

  // Parse lines for AI message
  const lines = content.split('\n');

  // Format bold, italic, and inline code within a string
  const formatInline = (text: string): React.ReactNode => {
    // Split by inline code `...`
    const codeParts = text.split(/(`[^`]+`)/g);

    return codeParts.map((codePart, idx) => {
      if (codePart.startsWith('`') && codePart.endsWith('`') && codePart.length > 2) {
        return (
          <code
            key={idx}
            className="px-1.5 py-0.5 mx-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 rounded font-mono text-xs font-bold"
          >
            {codePart.slice(1, -1)}
          </code>
        );
      }

      // Split by bold **...**
      const boldParts = codePart.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((boldPart, bIdx) => {
        if (boldPart.startsWith('**') && boldPart.endsWith('**') && boldPart.length > 4) {
          const innerText = boldPart.slice(2, -2);
          return (
            <strong key={bIdx} className="font-extrabold text-zinc-950 dark:text-white">
              {innerText}
            </strong>
          );
        }

        // Split by italic *...*
        const italicParts = boldPart.split(/(\*[^*]+\*)/g);
        return italicParts.map((itPart, itIdx) => {
          if (itPart.startsWith('*') && itPart.endsWith('*') && itPart.length > 2) {
            return (
              <em key={itIdx} className="italic text-zinc-600 dark:text-zinc-400">
                {itPart.slice(1, -1)}
              </em>
            );
          }
          return itPart;
        });
      });
    });
  };

  const renderedElements: React.ReactNode[] = [];
  let currentListItems: React.ReactNode[] = [];

  const flushList = () => {
    if (currentListItems.length > 0) {
      renderedElements.push(
        <ul key={`ul-${renderedElements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentListItems}
        </ul>
      );
      currentListItems = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Check for footer / slot note e.g. *(⚡ Terhubung via...)*
    if (trimmed.startsWith('*(') && trimmed.endsWith(')*')) {
      flushList();
      const badgeContent = trimmed.slice(2, -2);
      renderedElements.push(
        <div
          key={`badge-${index}`}
          className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 dark:text-zinc-400"
        >
          <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-950/60 text-zinc-900 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-800 rounded-md font-bold">
            {badgeContent}
          </span>
        </div>
      );
      return;
    }

    // Headings ### or ##
    if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      flushList();
      const headingText = trimmed.replace(/^#+\s*/, '');
      renderedElements.push(
        <div key={`heading-${index}`} className="mt-3 mb-1.5 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
          <h4 className="font-black text-xs md:text-sm uppercase tracking-wide text-zinc-900 dark:text-white">
            {formatInline(headingText)}
          </h4>
        </div>
      );
      return;
    }

    // Bullet points (•, *, -)
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || (trimmed.startsWith('* ') && !trimmed.startsWith('*('))) {
      const bulletText = trimmed.replace(/^([•\-\*]\s*)/, '');
      currentListItems.push(
        <li key={`li-${index}`} className="flex items-start gap-2 text-xs md:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0 mt-2"></span>
          <span className="flex-1">{formatInline(bulletText)}</span>
        </li>
      );
      return;
    }

    // Numbered list (1. 2.)
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numberMatch) {
      flushList();
      const num = numberMatch[1];
      const rest = numberMatch[2];
      renderedElements.push(
        <div key={`num-${index}`} className="flex items-start gap-2.5 my-1 text-xs md:text-sm text-zinc-800 dark:text-zinc-200">
          <span className="w-5 h-5 rounded-full bg-zinc-950 dark:bg-yellow-400 text-yellow-400 dark:text-zinc-950 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
            {num}
          </span>
          <span className="flex-1 leading-relaxed">{formatInline(rest)}</span>
        </div>
      );
      return;
    }

    // Regular line
    flushList();
    if (trimmed === '') {
      renderedElements.push(<div key={`empty-${index}`} className="h-2" />);
    } else {
      renderedElements.push(
        <p key={`p-${index}`} className="text-xs md:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200 my-1">
          {formatInline(trimmed)}
        </p>
      );
    }
  });

  flushList();

  return <div className="space-y-0.5">{renderedElements}</div>;
};
