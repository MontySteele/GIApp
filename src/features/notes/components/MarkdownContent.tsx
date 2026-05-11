import ReactMarkdown from 'react-markdown';

interface MarkdownContentProps {
  children: string;
}

export default function MarkdownContent({ children }: MarkdownContentProps) {
  return <ReactMarkdown>{children}</ReactMarkdown>;
}
