import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
  type KeyboardEvent,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange?: (value: string, option: DropdownOption | null) => void;
  placeholder?: string;
  label?: string;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  showAllOption?: boolean;
  allOptionLabel?: string;
}

export function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  errorMessage,
  disabled,
  className,
  required,
  showAllOption = false,
  allOptionLabel = 'All Categories',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<Map<number, HTMLLIElement>>(new Map());

  // Create "All" option if enabled
  const allOption: DropdownOption | null = showAllOption
    ? { value: '', label: allOptionLabel }
    : null;

  // All options including "All" if enabled
  const allOptions = useMemo(() => {
    return showAllOption && allOption ? [allOption, ...options] : options;
  }, [options, showAllOption, allOption]);

  // Find selected option
  const selectedOption = useMemo(() => {
    if (showAllOption && value === '') return allOption;
    return options.find((opt) => opt.value === value) || null;
  }, [options, value, showAllOption, allOption]);

  // Flat options for navigation
  const flatOptions = useMemo(() => {
    return allOptions.filter((opt) => !opt.disabled);
  }, [allOptions]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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

  // Set active index to selected option when opening
  useEffect(() => {
    if (isOpen) {
      const selectedIndex = flatOptions.findIndex((o) => o.value === value);
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, value, flatOptions]);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const handleSelect = useCallback(
    (option: DropdownOption) => {
      if (option.disabled) return;
      onChange?.(option.value, option);
      handleClose();
    },
    [onChange, handleClose]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;

      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
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
            setIsOpen(true);
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
          handleClose();
          break;
      }
    },
    [disabled, isOpen, activeIndex, flatOptions, handleClose, handleSelect]
  );

  const getFlatIndex = (option: DropdownOption): number => {
    return flatOptions.findIndex((o) => o.value === option.value);
  };

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-1.5">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls="dropdown-listbox"
        aria-label={label || placeholder}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          'relative flex items-center justify-between h-10 w-full rounded-md border-2 px-3 py-2',
          'bg-slate-800 transition-all duration-200 cursor-pointer',
          'focus:outline-none',
          disabled && 'cursor-not-allowed opacity-50',
          error
            ? 'border-red-500'
            : isOpen
              ? 'border-amber-500'
              : 'border-amber-500/70 hover:border-amber-500'
        )}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        {/* Selected Value Display */}
        <span className={cn(
          'text-sm truncate',
          selectedOption ? 'text-slate-100' : 'text-slate-400'
        )}>
          {selectedOption?.label || placeholder}
        </span>

        {/* Dropdown Arrow */}
        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-300 transition-transform duration-200 flex-shrink-0 ml-2',
            isOpen && 'rotate-180'
          )}
        />
      </div>

      {/* Dropdown Menu */}
      <div
        className={cn(
          'absolute z-50 w-full mt-1 rounded-md overflow-hidden',
          'bg-slate-700 shadow-xl shadow-black/30',
          'transition-all duration-150 ease-out origin-top',
          isOpen
            ? 'opacity-100 scale-y-100'
            : 'opacity-0 scale-y-95 pointer-events-none'
        )}
      >
        {/* Options List */}
        <ul
          ref={listRef}
          id="dropdown-listbox"
          role="listbox"
          aria-label="Options"
          className="max-h-64 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent"
        >
          {allOptions.map((option, index) => {
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
                  'px-4 py-2 cursor-pointer transition-colors duration-100',
                  'text-sm',
                  option.disabled && 'opacity-50 cursor-not-allowed',
                  isSelected && 'bg-sky-600 text-white',
                  !isSelected && isActive && 'bg-sky-600/80 text-white',
                  !isSelected && !isActive && 'text-slate-100 hover:bg-sky-600/60 hover:text-white'
                )}
                onClick={() => !option.disabled && handleSelect(option)}
                onMouseEnter={() => !option.disabled && setActiveIndex(flatIndex)}
              >
                {option.label}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Error Message */}
      {error && errorMessage && (
        <p className="mt-1.5 text-xs text-red-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
