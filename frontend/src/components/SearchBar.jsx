import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchAddresses } from '../services/api';
import { cn } from '../lib/utils';

export default function SearchBar({ onSearch, size = 'default', className }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchSuggestions = useCallback(async (value) => {
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchAddresses(value);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, fetchSuggestions]);

  function handleSelect(suggestion) {
    setQuery(suggestion.address);
    setSuggestions([]);
    setIsFocused(false);
    onSearch(suggestion.address, suggestion);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelect(suggestions[selectedIndex]);
    } else if (query.trim()) {
      setSuggestions([]);
      onSearch(query.trim());
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setIsFocused(false);
      inputRef.current?.blur();
    }
  }

  const isLarge = size === 'large';

  return (
    <div className={cn('relative w-full', className)}>
      <form onSubmit={handleSubmit}>
        {/* Desktop: single row. Mobile (large size): stacked input + button */}
        <div
          className={cn(
            'relative rounded-2xl border bg-card shadow-lg transition-all duration-300',
            isFocused
              ? 'border-primary/50 shadow-primary/10 shadow-xl ring-4 ring-primary/10'
              : 'border-border hover:border-primary/30 hover:shadow-xl',
            isLarge ? 'sm:h-18' : 'h-12'
          )}
        >
          <div className={cn(
            'flex items-center',
            isLarge ? 'h-12 sm:h-16' : 'h-12'
          )}>
            <div className={cn('flex items-center pl-4 sm:pl-5', isLarge && 'sm:pl-6')}>
              {isLoading ? (
                <Loader2 className={cn('animate-spin text-primary', isLarge ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-5 w-5')} aria-label="Loading" />
              ) : (
                <Search className={cn('text-muted-foreground', isLarge ? 'h-5 w-5 sm:h-6 sm:w-6' : 'h-5 w-5')} aria-hidden="true" />
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(-1);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              onKeyDown={handleKeyDown}
              placeholder={isLarge ? 'Enter a Dallas property address...' : 'Enter a Dallas property address...'}
              aria-label="Property address"
              className={cn(
                'flex-1 min-w-0 bg-transparent outline-none placeholder:text-muted-foreground/50 px-3 sm:px-4',
                isLarge ? 'text-sm sm:text-lg' : 'text-base'
              )}
            />
            {/* Desktop inline button (hidden on mobile for large size) */}
            <button
              type="submit"
              className={cn(
                'flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-medium text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98] shrink-0',
                isLarge
                  ? 'hidden sm:flex mr-2 h-12 px-6 text-base'
                  : 'mr-1.5 h-9 px-4 text-sm'
              )}
            >
              <span className="hidden sm:inline">Analyze</span>
              <ArrowRight className={cn(isLarge ? 'h-5 w-5' : 'h-4 w-4')} />
            </button>
          </div>
          {/* Mobile full-width button (only for large size) */}
          {isLarge && (
            <div className="sm:hidden px-3 pb-3">
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 font-medium text-white h-11 text-sm transition-all hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
              >
                Analyze Property
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </form>

      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(suggestion)}
                className={cn(
                  'flex w-full items-center gap-3 px-4 py-3 text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted'
                )}
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm">{suggestion.address}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
