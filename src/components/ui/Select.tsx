import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options?: SelectOption[];
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  placeholder?: string;
  label?: string;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  children?: ReactNode;
}

// Parse children (option elements) to extract options
function parseChildrenToOptions(children: ReactNode): SelectOption[] {
  const options: SelectOption[] = [];
  
  const processChild = (child: any) => {
    if (!child) return;
    
    if (Array.isArray(child)) {
      child.forEach(processChild);
      return;
    }
    
    if (child.type === 'option') {
      options.push({
        value: child.props.value ?? '',
        label: child.props.children ?? '',
        disabled: child.props.disabled,
      });
    }
  };
  
  processChild(children);
  return options;
}

const Select = ({
  options: propOptions,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  error,
  errorMessage,
  disabled,
  className,
  required,
  children,
}: SelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get options from props or parse from children
  const options = useMemo(() => {
    if (propOptions && propOptions.length > 0) return propOptions;
    if (children) return parseChildrenToOptions(children);
    return [];
  }, [propOptions, children]);

  // Find selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || null;
  }, [options, value]);

  // Flat options for navigation
  const flatOptions = useMemo(() => {
    return options.filter((opt) => !opt.disabled);
  }, [options]);

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

  // Position dropdown in a portal to avoid clipping
  useLayoutEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const style: React.CSSProperties = {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      // ensure it sits above other elements
      zIndex: 9999,
    };
    setDropdownStyle(style);
  }, [isOpen]);

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
    (option: SelectOption) => {
      if (option.disabled) return;
      // Simulate native select onChange event
      onChange?.({ target: { value: option.value } });
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

  const getFlatIndex = (option: SelectOption): number => {
    return flatOptions.findIndex((o) => o.value === option.value);
  };

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {/* Label */}
      {/* Dropdown Menu (portal) */}
      {createPortal(
        <div
          ref={dropdownRef}
          className={cn(
            'absolute z-50 rounded-md overflow-hidden',
            'bg-white dark:bg-slate-700 shadow-xl shadow-black/10 dark:shadow-black/30 border border-slate-200 dark:border-slate-600',
            'transition-all duration-150 ease-out origin-top',
            isOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-95 pointer-events-none'
          )}
          style={dropdownStyle}
        >
          <ul
            ref={listRef}
            id="select-listbox"
            role="listbox"
            aria-label="Options"
            className="max-h-64 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent w-full"
          >
            {options.map((option, index) => {
              const flatIndex = getFlatIndex(option);
              const isActive = flatIndex === activeIndex;
              const isSelected = option.value === value;

              return (
                <li
                  key={option.value || `option-${index}`}
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
                    isSelected && 'bg-amber-500 text-white',
                    !isSelected && isActive && 'bg-amber-500/80 text-white',
                    !isSelected && !isActive && 'text-slate-900 dark:text-slate-100 hover:bg-amber-500/60 hover:text-white'
                  )}
                  onClick={() => !option.disabled && handleSelect(option)}
                  onMouseEnter={() => !option.disabled && setActiveIndex(flatIndex)}
                >
                  {option.label}
                </li>
              );
            })}
          </ul>
        </div>,
        document.body
      )}

      {/* Error Message */}
      {error && errorMessage && (
        <p className="mt-1.5 text-xs text-red-400">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

Select.displayName = 'Select';

export { Select };
