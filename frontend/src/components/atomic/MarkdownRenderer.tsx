import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Ensure CSS is imported

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-emerald max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom styles for specific elements if needed
          h1: ({ node, ...props }) => <h1 className="text-3xl font-bold border-b border-gray-700 pb-2 mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-8 mb-4 text-(--tui-primary)" {...props} />,
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '')
            return !inline && match ? (
              <div className="mockup-code bg-[#16161e] p-4 rounded-md my-4 font-mono text-sm border border-gray-800">
                {children}
              </div>
            ) : (
              <code className="bg-gray-800 px-1 py-0.5 rounded text-sm font-mono text-red-300" {...props}>
                {children}
              </code>
            )
          }
        }}
      >
        {content || "*No content yet.*"}
      </ReactMarkdown>
    </div>
  );
}
