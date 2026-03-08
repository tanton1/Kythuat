import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

interface SearchableSelectProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Chọn hoặc nhập mới...",
  label,
  required = false,
  className = "",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-dark-muted mb-1">
          {label} {required && "*"}
        </label>
      )}
      <div 
        className="relative cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="text"
          required={required}
          className="w-full rounded-md p-2 text-sm dark-input pr-10"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center text-dark-muted">
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-dark-card border border-dark-border rounded-md shadow-xl max-h-60 overflow-y-auto">
          <div className="sticky top-0 bg-dark-card p-2 border-b border-dark-border">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-dark-muted" />
              <input
                type="text"
                className="w-full bg-dark-bg border border-dark-border rounded p-1 pl-8 text-xs text-dark-text focus:outline-none focus:border-neon-cyan"
                placeholder="Tìm kiếm nhanh..."
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => (
                <div
                  key={idx}
                  className="px-3 py-2 text-sm text-dark-text hover:bg-neon-cyan/10 hover:text-neon-cyan cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                >
                  {opt}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-dark-muted italic">
                Không tìm thấy kết quả. Nhấn Enter để dùng giá trị này.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
