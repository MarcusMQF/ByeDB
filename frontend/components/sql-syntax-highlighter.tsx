import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { memo } from 'react';

interface SQLSyntaxHighlighterProps {
  code: string;
  className?: string;
}

// Custom light theme for SQL with good contrast
const sqlLightTheme = {
  ...oneLight,
  'pre[class*="language-"]': {
    ...oneLight['pre[class*="language-"]'],
    background: 'transparent',
    margin: 0,
    padding: 0,
  },
  'code[class*="language-"]': {
    ...oneLight['code[class*="language-"]'],
    background: 'transparent',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  // SQL Keywords
  'keyword': {
    color: '#0033B3',
    fontWeight: 'bold'
  },
  // Functions
  'function': {
    color: '#067D17'
  },
  // Strings
  'string': {
    color: '#067D17'
  },
  // Numbers
  'number': {
    color: '#1A1AA6'
  },
  // Comments
  'comment': {
    color: '#8C8C8C',
    fontStyle: 'italic'
  },
  // Operators
  'operator': {
    color: '#000000'
  },
  // Punctuation
  'punctuation': {
    color: '#000000'
  },
  // Built-in types
  'builtin': {
    color: '#0033B3'
  }
};

export const SQLSyntaxHighlighter = memo(function SQLSyntaxHighlighter({ code, className = "" }: SQLSyntaxHighlighterProps) {
  return (
    <SyntaxHighlighter
      language="sql"
      style={sqlLightTheme}
      customStyle={{
        background: 'transparent',
        padding: 0,
        margin: 0,
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
      }}
      className={`overflow-x-auto break-words max-w-full custom-scrollbar ${className}`}
      wrapLines={true}
      wrapLongLines={true}
    >
      {code}
    </SyntaxHighlighter>
  );
}); 