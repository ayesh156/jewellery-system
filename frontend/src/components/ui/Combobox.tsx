import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Search, X, Check, SearchX, Building2 } from 'lucide-react';
import { cn } from '../../utils/cn';

// Fuzzy search scoring function
function fuzzyMatch(text: string, query: string): { match: boolean; score: number } {
  if (!query) return { match: true, score: 1 };
  
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  
  // Exact match gets highest score
  if (textLower === queryLower) return { match: true, score: 100 };
  
  // Starts with gets high score
  if (textLower.startsWith(queryLower)) return { match: true, score: 80 };
  
  // Contains gets medium score
  if (textLower.includes(queryLower)) return { match: true, score: 60 };
  
  // Fuzzy matching - characters in order but not necessarily consecutive
  let queryIndex = 0;
  let score = 0;
  let consecutiveBonus = 0;
  
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 10 + consecutiveBonus;
      consecutiveBonus += 5;
      queryIndex++;
    } else {
      consecutiveBonus = 0;
    }
  }
  
  if (queryIndex === queryLower.length) {
    return { match: true, score: score / queryLower.length };
  }
  
  return { match: false, score: 0 };
}

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  avatar?: string;
  disabled?: boolean;
  group?: string;
  count?: number;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string, option: ComboboxOption | null) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  emptyMessage?: string;
  emptyIcon?: ReactNode;
  loading?: boolean;
  grouped?: boolean;
  required?: boolean;
  showAllOption?: boolean;
  allOptionLabel?: string;
  defaultIcon?: ReactNode;
  showFooter?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search',
  label,
  error,
  errorMessage,
  disabled,
  clearable = false,
  className,
  emptyMessage = 'No results found',
  emptyIcon,
  loading,
  grouped = false,
  required,
  showAllOption = false,
  allOptionLabel = 'All Items',
  defaultIcon,
  showFooter = true,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Create "All" option if enabled
  const allOption: ComboboxOption | null = showAllOption
    ? { value: '', label: allOptionLabel, count: options.length, icon: defaultIcon }
    : null;

  // Find selected option
  const selectedOption = useMemo(() => {
    if (showAllOption && value === '') return allOption;
    return options.find((opt) => opt.value === value) || null;
  }, [options, value, showAllOption, allOption]);

  // Filter and sort options with fuzzy search
  const filteredOptions = useMemo(() => {
    const baseOptions = showAllOption && allOption ? [allOption, ...options] : options;
    
    if (!searchQuery.trim()) return baseOptions;

    return baseOptions
      .map((option) => {
        const labelMatch = fuzzyMatch(option.label, searchQuery);
        const descMatch = option.description
          ? fuzzyMatch(option.description, searchQuery)
          : { match: false, score: 0 };
        
        return {
          option,
          score: Math.max(labelMatch.score, descMatch.score * 0.8),
          match: labelMatch.match || descMatch.match,
        };
      })
      .filter((item) => item.match)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.option);
  }, [options, searchQuery, showAllOption, allOption]);

  // Flatten options for keyboard navigation
  const flatOptions = useMemo(() => {
    return filteredOptions.filter((opt) => !opt.disabled);
  }, [filteredOptions]);

  // Handle click outside (must check both container and portal dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInContainer = containerRef.current?.contains(target);
      const clickedInDropdown = dropdownRef.current?.contains(target);
      
      if (!clickedInContainer && !clickedInDropdown) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll active option into view
  useEffect(() => {
    if (activeIndex >= 0 && isOpen) {
      const optionEl = optionRefs.current.get(activeIndex);
      if (optionEl && listRef.current) {
        optionEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeIndex, isOpen]);

  // Reset active index when options change
  useEffect(() => {
    setActiveIndex(-1);
  }, [searchQuery]);

  // Position dropdown in a portal to avoid clipping
  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;

    const updatePosition = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      const dropdownHeight = dropdownRef.current?.offsetHeight || 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const shouldOpenUp = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;
      setOpenUpward(shouldOpenUp);

      const style: React.CSSProperties = {
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: 50,
        ...(shouldOpenUp
          ? { bottom: window.innerHeight - rect.top }
          : { top: rect.bottom }),
      };
      setDropdownStyle(style);
    };

    updatePosition();

    // Update position on scroll/resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen]);

  const handleOpen = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      setActiveIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearchQuery('');
    setActiveIndex(-1);
  }, []);

  const handleSelect = useCallback(
    (option: ComboboxOption) => {
      if (option.disabled) return;
      onChange?.(option.value, option);
      handleClose();
    },
    [onChange, handleClose]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('', null);
      setSearchQuery('');
    },
    [onChange]
  );

  // Navigate to previous/next option
  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      const currentIndex = flatOptions.findIndex((o) => o.value === value);
      let newIndex: number;
      
      if (direction === 'next') {
        newIndex = currentIndex < flatOptions.length - 1 ? currentIndex + 1 : 0;
      } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : flatOptions.length - 1;
      }
      
      const newOption = flatOptions[newIndex];
      if (newOption) {
        onChange?.(newOption.value, newOption);
      }
    },
    [flatOptions, value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (!isOpen) {
            handleOpen();
          } else if (activeIndex >= 0 && flatOptions[activeIndex]) {
            handleSelect(flatOptions[activeIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          handleClose();
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen) {
            handleOpen();
          } else {
            setActiveIndex((prev) =>
              prev < flatOptions.length - 1 ? prev + 1 : 0
            );
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (isOpen) {
            setActiveIndex((prev) =>
              prev > 0 ? prev - 1 : flatOptions.length - 1
            );
          }
          break;

        case 'Home':
          if (isOpen) {
            e.preventDefault();
            setActiveIndex(0);
          }
          break;

        case 'End':
          if (isOpen) {
            e.preventDefault();
            setActiveIndex(flatOptions.length - 1);
          }
          break;

        case 'Tab':
          if (isOpen) {
            handleClose();
          }
          break;
      }
    },
    [disabled, isOpen, activeIndex, flatOptions, handleOpen, handleClose, handleSelect]
  );

  const getFlatIndex = (option: ComboboxOption): number => {
    return flatOptions.findIndex((o) => o.value === option.value);
  };

  const renderOption = (option: ComboboxOption, index: number) => {
    const flatIndex = getFlatIndex(option);
    const isActive = flatIndex === activeIndex;
    const isSelected = option.value === value;

    return (
      <li
        key={option.value || `all-${index}`}
        ref={(el) => {
          if (el) optionRefs.current.set(flatIndex, el);
        }}
        role="option"
        aria-selected={isSelected}
        aria-disabled={option.disabled}
        className={cn(
          'relative flex items-center gap-3 px-3 py-2.5 cursor-pointer',
          'transition-all duration-150 ease-out mx-1.5 rounded-lg',
          option.disabled && 'opacity-50 cursor-not-allowed',
          isActive && 'bg-amber-500/20 dark:bg-sky-500/20',
          !isActive && 'hover:bg-slate-100 dark:hover:bg-slate-700/50',
          isSelected && !isActive && 'bg-slate-100 dark:bg-slate-700/30'
        )}
        onClick={() => !option.disabled && handleSelect(option)}
        onMouseEnter={() => !option.disabled && setActiveIndex(flatIndex)}
      >
        {/* Check mark for selected */}
        <div className="w-4 flex-shrink-0">
          {isSelected && (
            <Check className="w-4 h-4 text-amber-500 dark:text-slate-400" />
          )}
        </div>

        {/* Icon */}
        <div className="flex-shrink-0 text-slate-500">
          {option.icon ? (
            option.icon
          ) : defaultIcon ? (
            defaultIcon
          ) : (
            <Building2 className="w-4 h-4" />
          )}
        </div>

        {/* Label */}
        <span
          className={cn(
            'flex-1 text-sm transition-colors duration-150 min-w-0',
            isSelected ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-700 dark:text-slate-300'
          )}
        >
          {option.label}
        </span>

        {/* Count Badge */}
        {option.count !== undefined && (
          <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700/80 rounded">
            {option.count}
          </span>
        )}
      </li>
    );
  };

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="combobox-listbox"
        aria-label={label || placeholder}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          'relative flex items-center gap-2 h-10 w-full rounded-lg border px-3 py-2',
          'bg-white dark:bg-slate-800/80 transition-all duration-200 cursor-pointer',
          'focus:outline-none focus:ring-1 focus:ring-amber-500/30 dark:focus:ring-slate-600 focus:border-amber-500/60 dark:focus:border-slate-600',
          disabled && 'cursor-not-allowed opacity-50',
          error
            ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
          isOpen && !openUpward && 'rounded-b-none border-amber-500 dark:border-slate-600',
          isOpen && openUpward && 'rounded-t-none border-amber-500 dark:border-slate-600'
        )}
        onClick={handleOpen}
        onKeyDown={handleKeyDown}
      >
        {/* Selected Value Display */}
        {selectedOption ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-slate-500">
              {selectedOption.icon || defaultIcon || <Building2 className="w-4 h-4" />}
            </span>
            <span className="truncate text-sm text-slate-900 dark:text-slate-100">
              {selectedOption.label}
            </span>
            {selectedOption.count !== undefined && (
              <span className="shrink-0 px-1.5 py-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 rounded whitespace-nowrap">
                {selectedOption.count}
              </span>
            )}
          </div>
        ) : (
          <span className="text-sm text-slate-400 dark:text-slate-500 flex-1">{placeholder}</span>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {clearable && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </div>

      {/* Dropdown (portal) */}
      {createPortal(
        <div
          ref={dropdownRef}
          style={{ ...dropdownStyle, zIndex: 9999, minWidth: '200px' }}
          className={cn(
            'fixed overflow-hidden border',
            openUpward
              ? 'rounded-t-lg border-b-0 origin-bottom'
              : 'rounded-b-lg border-t-0 origin-top',
            'bg-white dark:bg-slate-800/95 backdrop-blur-xl border-slate-300 dark:border-slate-600 shadow-2xl shadow-black/10 dark:shadow-black/30',
            'transition-all duration-200 ease-out',
            isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'
          )}
        >
        {/* Search Input */}
        <div className="p-2 border-b border-slate-200 dark:border-slate-700/50">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className={cn(
                'w-full h-9 pl-9 pr-8 rounded-md text-sm',
                'bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500',
                'focus:outline-none focus:border-amber-500 dark:focus:border-slate-600',
                'transition-colors duration-150'
              )}
              aria-label="Search options"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Options List */}
          <ul
            ref={listRef}
          id="combobox-listbox"
          role="listbox"
          aria-label="Options"
          className="max-h-64 overflow-y-auto py-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent"
        >
          {loading ? (
            <li className="flex items-center justify-center gap-2 py-8 text-slate-500 dark:text-slate-400">
              <div className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-slate-500 dark:border-t-slate-400 rounded-full animate-spin" />
              <span className="text-sm">Loading...</span>
            </li>
          ) : filteredOptions.length === 0 ? (
            <li className="py-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
                  {emptyIcon || <SearchX className="w-6 h-6 text-slate-400 dark:text-slate-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{emptyMessage}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Try a different search term
                  </p>
                </div>
              </div>
            </li>
          ) : (
            filteredOptions.map((option, index) => renderOption(option, index))
          )}
        </ul>

        {/* Footer with navigation */}
        {showFooter && selectedOption && (
          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 min-w-0">
              <span className="text-slate-500">
                {selectedOption.icon || defaultIcon || <Building2 className="w-4 h-4" />}
              </span>
              <span className="truncate font-medium">{selectedOption.label}</span>
              {selectedOption.count !== undefined && (
                <span className="px-1.5 py-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 rounded flex-shrink-0">
                  {selectedOption.count}
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleNavigate('prev'); }}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                aria-label="Previous option"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleNavigate('next'); }}
                className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                aria-label="Next option"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        </div>,
        document.body
      )}

      {/* Error Message */}
      {error && errorMessage && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
