import { useState, useRef, useEffect } from 'react';
import { Search, X, Check, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableSingleSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
}

export function SearchableSingleSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  disabled = false,
}: SearchableSingleSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedLabel = options.find((o) => o.value === value)?.label;

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`w-full flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-sm border rounded-md bg-white transition-colors ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-50'
            : open
            ? 'border-emerald-400 ring-1 ring-emerald-200'
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <span className={`flex-1 text-left truncate ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedLabel || placeholder}
        </span>
        {value && !disabled && (
          <X
            className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 shrink-0"
            onClick={handleClear}
          />
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-8 pl-8 pr-3 text-sm border rounded-md outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 bg-gray-50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">No results found</div>
            ) : (
              filtered.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="truncate flex-1">{option.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
