import { memo } from 'react';

interface StreamingTextProps {
  text: string;
  isStreaming?: boolean;
  className?: string;
}

export const StreamingText = memo(({ text, isStreaming = false, className = '' }: StreamingTextProps) => {
  return (
    <span className={className}>
      {text}
    </span>
  );
});

StreamingText.displayName = 'StreamingText';
