interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBox({ value, onChange, placeholder = 'Search projects...' }: SearchBoxProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full rounded-xl border border-black/10 bg-[#ffffff] px-3 py-2 text-sm text-[#000000e6] placeholder-[#00000073] outline-none focus:border-[#985ffb] focus:ring-1 focus:ring-[#985ffb]/50"
    />
  );
}
