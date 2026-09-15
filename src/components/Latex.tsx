import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface LatexProps {
  math: string;
  block?: boolean;
  className?: string;
}

export const Latex: React.FC<LatexProps> = ({ math, block = false, className = '' }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math, containerRef.current, {
          displayMode: block,
          throwOnError: false
        });
      } catch (e) {
        console.error('Error renderizando KaTeX:', e);
      }
    }
  }, [math, block]);

  return <span ref={containerRef} className={`katex-render ${className}`} />;
};
