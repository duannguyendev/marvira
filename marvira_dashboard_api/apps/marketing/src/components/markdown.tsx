import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Renders trusted Markdown (authored by Admin/Staff) to styled React elements. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-4 text-base leading-relaxed text-ink/80">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: props => (
            <h1
              className="mt-8 font-display text-3xl font-bold text-ink"
              {...props}
            />
          ),
          h2: props => (
            <h2
              className="mt-8 font-display text-2xl font-bold text-ink"
              {...props}
            />
          ),
          h3: props => (
            <h3
              className="mt-6 font-display text-xl font-bold text-ink"
              {...props}
            />
          ),
          p: props => <p className="text-ink/80" {...props} />,
          ul: props => (
            <ul className="list-disc space-y-2 pl-6 text-ink/80" {...props} />
          ),
          ol: props => (
            <ol
              className="list-decimal space-y-2 pl-6 text-ink/80"
              {...props}
            />
          ),
          li: props => <li className="leading-relaxed" {...props} />,
          strong: props => (
            <strong className="font-semibold text-ink" {...props} />
          ),
          a: props => (
            <a
              className="font-semibold text-forest underline decoration-sun decoration-2 underline-offset-2"
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          ),
          blockquote: props => (
            <blockquote
              className="border-l-4 border-sun pl-4 italic text-ink/70"
              {...props}
            />
          ),
          img: props => (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img className="my-4 w-full rounded-lg object-cover" {...props} />
          ),
        }}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
