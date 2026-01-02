import { useCallback } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { autocompletion } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { latexCompletionSource } from '../../lib/editor/completions';

interface NodeEditorProps {
  initialContent: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

// Custom Theme (Matches your WebTUI Dark Mode)
const profenTheme = EditorView.theme({
  "&": {
    backgroundColor: "#16161e !important", // Force Dark Background
    height: "100%",
    fontSize: "15px",
    fontFamily: "'JetBrains Mono', monospace",
    color: "#cdd6f4",
  },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "'JetBrains Mono', monospace"
  },
  ".cm-content": {
    caretColor: "#89b4fa",
    padding: "1rem 0",
    paddingBottom: "50vh"
  },
  ".cm-line": {
    padding: "0 1rem"
  },
  "&.cm-focused": {
    outline: "none"
  },
  ".cm-gutters": {
    backgroundColor: "#16161e", // Match background
    color: "#585b70",
    borderRight: "1px solid #1e1e2e"
  }, ".cm-cursor": {
    borderLeftColor: "#89b4fa",
    borderLeftWidth: "2px",
    boxShadow: "0 0 10px #89b4fa" // <--- The Glow Effect
  },
  ".cm-activeLine": {
    backgroundColor: "#89b4fa1a" // 10% opacity primary
  }
}, { dark: true });


export default function NodeEditor({ initialContent, onChange, readOnly = false }: NodeEditorProps) {

  // Extensions Configuration
  const extensions = [
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    autocompletion({ override: [latexCompletionSource] }), // Inject our LaTeX source
    EditorView.lineWrapping,
    profenTheme,
  ];

  const handleChange = useCallback((val: string) => {
    onChange(val);
  }, [onChange]);

  return (
    <div className="h-full w-full border border-gray-800 rounded-md overflow-hidden bg-[#16161e]">
      <CodeMirror
        value={initialContent}
        height="100%"
        extensions={extensions}
        onChange={handleChange}
        editable={!readOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          foldGutter: true,
          history: true,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true, // Enable the UI
          drawSelection: true,
        }}
      />
    </div>
  );
}
