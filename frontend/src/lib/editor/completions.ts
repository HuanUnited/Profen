import { CompletionContext, CompletionResult } from "@codemirror/autocomplete";

// 1. Define your Snippets
// 'apply' can be a string, or a function for complex cursor positioning.
// Using explicit cursor positioning requires the 'snippet' extension from standard library,
// but for simple text insertion, we can just return the string.
// TODO: Add more snippets
const latexOptions = [
  { label: "\\frac", detail: "Fraction", apply: "\\frac{num}{den}" },
  { label: "\\sum", detail: "Summation", apply: "\\sum_{i=0}^{n}" },
  { label: "\\int", detail: "Integral", apply: "\\int_{a}^{b}" },
  { label: "\\alpha", detail: "α", apply: "\\alpha" },
  { label: "\\beta", detail: "β", apply: "\\beta" },
  { label: "\\gamma", detail: "γ", apply: "\\gamma" },
  { label: "\\theta", detail: "θ", apply: "\\theta" },
  { label: "\\sqrt", detail: "Square Root", apply: "\\sqrt{}" },
  { label: "\\text", detail: "Text Mode", apply: "\\text{}" },
  { label: "\\begin{align}", detail: "Align Block", apply: "\n\\begin{align}\n\t\n\\end{align}" },
];

// 2. The Completion Source Function
export function latexCompletionSource(context: CompletionContext): CompletionResult | null {
  // Trigger when user types '\'
  let word = context.matchBefore(/\\[a-zA-Z]*/);

  if (!word) return null;

  // Don't auto-open if just typing text, unless explicit (Ctrl+Space)
  if (word.from === word.to && !context.explicit) return null;

  return {
    from: word.from,
    options: latexOptions,
  };
}
