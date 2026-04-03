import { useState, useRef, useEffect } from 'react';
import { Search, X, Check, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Option {
  value: string;
  label: string;
}

interface SearchableMultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  maxDisplay?: number;
}

export function SearchableMultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  maxDisplay = 2,
}: SearchableMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
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

  const toggle = (value: string) => {
    const newValues = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newValues);
  };

  const removeTag = (value: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const selectedLabels = selected
    .map((v) => options.find((o) => o.value === v)?.label ?? v)
    .slice(0, maxDisplay);

  const extraCount = selected.length - maxDisplay;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className={`w-full flex items-center gap-1.5 min-h-[36px] px-3 py-1.5 text-sm border rounded-md bg-white transition-colors ${
          open ? 'border-emerald-400 ring-1 ring-emerald-200' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex-1 flex flex-wrap gap-1 items-center min-w-0">
          {selected.length === 0 ? (
            <span className="text-gray-500 text-sm">{placeholder}</span>
          ) : (
            <>
              {selectedLabels.map((label, i) => (
                <Badge
                  key={selected[i]}
                  variant="secondary"
                  className="text-xs h-5 px-1.5 gap-0.5 bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                >
                  <span className="truncate max-w-[80px]">{label}</span>
                  <X
                    className="w-3 h-3 cursor-pointer shrink-0"
                    onClick={(e) => removeTag(selected[i], e)}
                  />
                </Badge>
              ))}
              {extraCount > 0 && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5 bg-gray-100 text-gray-600">
                  +{extraCount}
                </Badge>
              )}
            </>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg overflow-hidden"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Search input */}
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
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">No results found</div>
            ) : (
              filtered.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <div
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(option.value); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div
                      className={`h-3.5 w-3.5 shrink-0 rounded-sm border flex items-center justify-center ${
                        isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <span className="truncate">{option.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer actions */}
          {selected.length > 0 && (
            <div className="border-t px-3 py-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">{selected.length} selected</span>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange([]); }}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Simple chip-style multi-select (no search, fewer options like Gender, Job Type) */
interface ChipMultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export function ChipMultiSelect({ options, selected, onChange }: ChipMultiSelectProps) {
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-all ${
              isSelected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {isSelected && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
