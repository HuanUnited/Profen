import { useMemo } from 'react';

export function highlightMatches(text: string, query: string): string {
  if (!query.trim()) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-400/30 text-yellow-200">$1</mark>');
}

export function useFuzzySearch<T>(
  items: T[],
  query: string,
  getSearchableText: (item: T) => string
): T[] {
  return useMemo(() => {
    if (!query.trim()) return items;

    const lowerQuery = query.toLowerCase();

    return items
      .map(item => {
        const text = getSearchableText(item).toLowerCase();
        const score = calculateScore(text, lowerQuery);
        return { item, score };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }, [items, query, getSearchableText]);
}

function calculateScore(text: string, query: string): number {
  if (text.includes(query)) return 100; // Exact match

  let score = 0;
  let lastIndex = -1;

  for (const char of query) {
    const index = text.indexOf(char, lastIndex + 1);
    if (index === -1) return 0; // No match

    score += 10 - (index - lastIndex); // Proximity bonus
    lastIndex = index;
  }

  return score;
}
