'use client';

import { useState, useRef, useEffect } from 'react';
import { searchAddress } from '@/lib/geocoding';
import { SearchResult } from '@/types';

interface SearchBarProps {
  onSelectResult: (result: SearchResult) => void;
  onMenuClick: () => void;
  onClear?: () => void;
}

export default function SearchBar({ onSelectResult, onMenuClick, onClear }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const data = await searchAddress(value);
      setResults(data);
      setShowResults(data.length > 0);
      setIsSearching(false);
    }, 1500);
  };

  const handleSelect = (result: SearchResult) => {
    setQuery(result.display_name.split(',')[0]);
    setShowResults(false);
    setResults([]);
    onSelectResult(result);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    onClear?.();
  };

  return (
    <div ref={containerRef} className="absolute top-3 left-3 right-14 z-[1000]">
      <div className="bg-white rounded-xl shadow-lg flex items-center px-2 py-1.5 gap-1">
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          title="Danh sách điểm (L)"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Tìm kiếm địa chỉ..."
          className="flex-1 outline-none text-gray-700 bg-transparent placeholder-gray-400 text-sm py-1"
        />

        {isSearching && (
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full flex-shrink-0" />
        )}

        {query && !isSearching && (
          <button
            onClick={clearSearch}
            className="p-1.5 hover:bg-gray-100 rounded-lg flex-shrink-0"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="mt-1.5 bg-white rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={index}
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-b-0 flex items-start gap-3 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="text-sm text-gray-700 line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

