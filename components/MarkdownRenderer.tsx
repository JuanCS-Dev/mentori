import React from 'react';

interface Props {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<Props> = ({ content, className }) => {
  const processLine = (line: string, index: number) => {
    // Headers with gradients and spacing
    if (line.startsWith('# ')) 
        return <h1 key={index} className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 mt-8 mb-4 border-b border-slate-200/60 pb-3">{line.replace('# ', '')}</h1>;
    if (line.startsWith('## ')) 
        return <h2 key={index} className="text-2xl font-bold text-slate-800 mt-6 mb-3 flex items-center gap-2">{line.replace('## ', '')}</h2>;
    if (line.startsWith('### ')) 
        return <h3 key={index} className="text-lg font-bold text-indigo-700 mt-5 mb-2 uppercase tracking-wide">{line.replace('### ', '')}</h3>;
    
    // Feature Blocks (Icons + Bold)
    if (line.includes('📋') || line.includes('📚') || line.includes('✅') || line.includes('🎯') || line.includes('⚠️') || line.includes('💡') || line.includes('📊')) {
         const icon = line.match(/[\u{1F300}-\u{1F9FF}]/u)?.[0] || '';
         const text = line.replace(icon, '').trim();
         return (
            <div key={index} className="flex items-start gap-3 mt-6 mb-2 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xl">{icon}</span>
                <p className="font-bold text-slate-800">{text}</p>
            </div>
         );
    }

    // List items with custom bullets
    if (line.trim().startsWith('- ') || line.trim().startsWith('□ ')) {
      return (
        <li key={index} className="ml-2 text-slate-600 list-none flex items-start py-1 group hover:text-slate-900 transition-colors">
            <span className="mr-3 mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500 group-hover:scale-125 transition-transform"></span>
            <span className="leading-relaxed">{line.replace(/^[-□]\s+/, '')}</span>
        </li>
      );
    }

    // Horizontal Rule
    if (line.trim() === '---') {
        return <hr key={index} className="my-8 border-slate-200/80" />;
    }

    // Regular paragraphs
    if (line.trim().length > 0) {
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
            <p key={index} className="mb-3 text-slate-600 leading-7 font-medium">
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-bold text-slate-800">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                })}
            </p>
        );
    }

    return <div key={index} className="h-3"></div>;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {content.split('\n').map((line, i) => processLine(line, i))}
    </div>
  );
};
