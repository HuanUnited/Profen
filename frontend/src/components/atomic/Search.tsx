import clsx from 'clsx';
import { Search as SearchIcon } from 'lucide-react';

export default function StyledSearch({
  placeholder = "Search...",
  value,
  onChange,
  className = ""
}: {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}) {
  return (
    <div className={clsx("relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2 focus-within:border-[#40c9ff]", className)}>
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent pl-10 pr-4 text-sm text-white placeholder-gray-400 outline-none"
      />
    </div>
  );
}
