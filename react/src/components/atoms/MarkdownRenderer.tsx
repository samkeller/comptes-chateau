import Markdown, { Options } from "react-markdown";

interface MarkdownRendererProps  {
    children: string | null | undefined;
}

export function MarkdownRenderer({ children, ...props }: MarkdownRendererProps & Options) {
    return (
        <div
            className={`
                markdown-content 
                prose prose-invert max-w-none 
            `}
        >
            <Markdown
                {...props}
                components={{
                    h1: ({ children }) => (
                        <h1 className="text-3xl font-bold mb-6 text-primary">
                            {children}
                        </h1>
                    ),

                    h2: ({ children }) => (
                        <h2 className="text-2xl font-semibold mt-8 mb-4 text-teal-300">
                            {children}
                        </h2>
                    ),

                    h3: ({ children }) => (
                        <h3 className="text-xl font-medium mt-6 mb-3">
                            {children}
                        </h3>
                    ),

                    p: ({ children }) => (
                        <p className="leading-relaxed mb-4 text-surface-600">
                            {children}
                        </p>
                    ),

                    ul: ({ children }) => (
                        <ul className="list-disc ml-6 space-y-2 mb-4">
                            {children}
                        </ul>
                    ),

                    li: ({ children }) => (
                        <li className="text-surface-400">
                            {children}
                        </li>
                    ),

                    code: ({ children }) => (
                        <code
                            className="
                            bg-surface-800
                            text-teal-300
                            px-1.5 py-0.5
                            rounded
                            text-sm
                          "
                        >
                            {children}
                        </code>
                    )
                }}
            >
                {children}
            </Markdown>
        </div>
    );
}