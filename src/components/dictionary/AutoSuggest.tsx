'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '@/lib/hooks/useDebounce';

interface AutoSuggestProps {
  language: string;
  targetLang?: string;
  sourceWord?: string; // The word to translate (for translation suggestions)
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  apiEndpoint?: string;
  rightElement?: React.ReactNode;
}

export default function AutoSuggest({
  language,
  targetLang,
  sourceWord,
  value,
  onChange,
  placeholder = 'Enter a word...',
  className,
  apiEndpoint = '/api/words/suggest',
  rightElement,
}: AutoSuggestProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [allTranslations, setAllTranslations] = useState<string[]>([]); // Cache for translations of sourceWord
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedValue = useDebounce(value, 200);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFetchedSource = useRef('');
  const lastFetchedLang = useRef('');

  const isTranslationMode = apiEndpoint === '/api/words/translate-suggest';

  const fetchTranslations = useCallback(async (wordToTranslate: string) => {
    if (!wordToTranslate || wordToTranslate.length < 2) return;
    
    // If we've already fetched for this word and this target language, just open the dropdown
    if (wordToTranslate === lastFetchedSource.current && targetLang === lastFetchedLang.current) {
      if (allTranslations.length > 0) setIsOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const url = new URL(apiEndpoint, window.location.origin);
      url.searchParams.set('word', wordToTranslate);
      url.searchParams.set('lang', language);
      if (targetLang) url.searchParams.set('targetLang', targetLang);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        const results = data.suggestions || [];
        setAllTranslations(results);
        lastFetchedSource.current = wordToTranslate;
        lastFetchedLang.current = targetLang || '';
        setIsOpen(results.length > 0);
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint, language, targetLang, allTranslations.length]);

  // Standard suggestion fetching (e.g., from dictionary/word list)
  useEffect(() => {
    if (isTranslationMode) return;

    if (debouncedValue.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const url = new URL(apiEndpoint, window.location.origin);
        url.searchParams.set('q', debouncedValue);
        url.searchParams.set('lang', language);
        
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setIsOpen(data.suggestions?.length > 0);
          setActiveIndex(-1);
        }
      } catch {
        // Silently fail
      }
    };

    fetchSuggestions();
  }, [debouncedValue, language, apiEndpoint, isTranslationMode]);

  // Handle translation filtering
  useEffect(() => {
    if (!isTranslationMode || allTranslations.length === 0) return;

    const query = value.toLowerCase();
    const filtered = query 
      ? allTranslations.filter(t => t.toLowerCase().includes(query))
      : allTranslations;
    
    setSuggestions(filtered);
    // Only auto-open if we have matches and the input is currently focused
    if (document.activeElement === inputRef.current) {
      setIsOpen(filtered.length > 0);
    }
  }, [value, allTranslations, isTranslationMode]);

  // Retrigger fetch if targetLang changes (but not when sourceWord changes while typing)
  useEffect(() => {
    if (isTranslationMode && sourceWord) {
      fetchTranslations(sourceWord);
    }
  }, [targetLang, isTranslationMode, sourceWord, fetchTranslations]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectSuggestion = useCallback(
    (suggestion: string) => {
      onChange(suggestion);
      setIsOpen(false);
      setSuggestions([]);
    },
    [onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0) {
          selectSuggestion(suggestions[activeIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className || ''}`}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (isTranslationMode && sourceWord) {
            fetchTranslations(sourceWord);
          } else if (suggestions.length > 0) {
            setIsOpen(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg)] py-2 text-lg transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/20 ${
          rightElement ? 'pl-3 pr-10' : 'px-3'
        }`}
        autoComplete="off"
      />

      {rightElement && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
          {rightElement}
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-xl border border-[var(--border-color)] bg-[var(--bg)] py-1 shadow-lg">
          {suggestions.map((suggestion, i) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => selectSuggestion(suggestion)}
              className={`w-full px-3 py-2 text-left text-lg transition-colors ${
                i === activeIndex
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                  : 'hover:bg-[var(--surface)]'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
