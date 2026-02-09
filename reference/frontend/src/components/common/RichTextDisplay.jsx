import React from 'react';
import Markdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm'; // 1. Tables, Strikethrough, Task lists
import rehypeExternalLinks from 'rehype-external-links'; // 2. Safe external links

export default function RichTextDisplay({ content }) {
  if (!content) return null;

  return (
    <div className="
      prose 
      prose-sm md:prose-base 
      dark:prose-invert 
      prose-headings:font-bold prose-headings:text-[var(--text-primary)]
      prose-p:text-[var(--text-secondary)] prose-p:leading-relaxed
      prose-li:text-[var(--text-secondary)]
      prose-strong:text-[var(--accent-color)]
      prose-a:text-blue-500 prose-a:underline hover:prose-a:text-blue-600
      prose-img:rounded-xl prose-img:shadow-lg
      max-w-none
    ">
      <Markdown 
        remarkPlugins={[remarkGfm]} 
        rehypePlugins={[
          rehypeSanitize, 
          [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }]
        ]}
      >
        {content}
      </Markdown>
    </div>
  );
}