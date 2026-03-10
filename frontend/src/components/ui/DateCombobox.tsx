import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  X 
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DateComboboxProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: boolean;
  errorMessage?: string;
  disabled?: boolean;
  clearable?: boolean;
  className?: string;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  format?: 'yyyy-MM-dd' | 'dd/MM/yyyy' | 'MM/dd/yyyy';
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = MONTHS_SHORT[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}

function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DateCombobox({
  value,
  onChange,
  placeholder = 'Select date...',
  label,
  error,
  errorMessage,
  disabled,
  clearable = false,
  className,
  required,
  minDate,
  maxDate,
}: DateComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(() => {
    const parsed = parseDate(value || '');
    return parsed || new Date();
  });
  const [showYearSelector, setShowYearSelector] = useState(false);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties | null>(null);

  const selectedDate = useMemo(() => parseDate(value || ''), [value]);
  const minDateParsed = useMemo(() => parseDate(minDate || ''), [minDate]);
  const maxDateParsed = useMemo(() => parseDate(maxDate || ''), [maxDate]);

  // Generate years for selector (20 years back and forward)
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearList: number[] = [];
    for (let i = currentYear - 20; i <= currentYear + 20; i++) {
      yearList.push(i);
    }
    return yearList;
  }, []);

  // Handle click outside (include portal dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current && containerRef.current.contains(target)) return;
      if (dropdownRef.current && dropdownRef.current.contains(target)) return;
      setIsOpen(false);
      setShowYearSelector(false);
      setShowMonthSelector(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Position portal dropdown when open, and update on scroll/resize
  useLayoutEffect(() => {
    if (!isOpen) {
      setDropdownStyle(null);
      return;
    }

    const updatePosition = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const calendarWidth = 288; // w-72 = 18rem = 288px
      let left = rect.left + window.scrollX;
      // Prevent going off-screen to the right
      if (left + calendarWidth > window.innerWidth) {
        left = Math.max(0, window.innerWidth - calendarWidth - 8);
      }
      setDropdownStyle({
        position: 'absolute',
        top: rect.bottom + window.scrollY + 4,
        left,
        zIndex: 9999,
      });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  // Update view date when value changes
  useEffect(() => {
    const parsed = parseDate(value || '');
    if (parsed) {
      setViewDate(parsed);
    }
  }, [value]);

  const handleOpen = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      setShowYearSelector(false);
      setShowMonthSelector(false);
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setShowYearSelector(false);
    setShowMonthSelector(false);
  }, []);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.('');
    handleClose();
  }, [onChange, handleClose]);

  const handleDateSelect = useCallback((day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    
    // Check min/max bounds
    if (minDateParsed && newDate < minDateParsed) return;
    if (maxDateParsed && newDate > maxDateParsed) return;
    
    onChange?.(toISODateString(newDate));
    handleClose();
  }, [viewDate, onChange, handleClose, minDateParsed, maxDateParsed]);

  const handlePrevMonth = useCallback(() => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const handleYearSelect = useCallback((year: number) => {
    setViewDate(prev => new Date(year, prev.getMonth(), 1));
    setShowYearSelector(false);
  }, []);

  const handleMonthSelect = useCallback((monthIndex: number) => {
    setViewDate(prev => new Date(prev.getFullYear(), monthIndex, 1));
    setShowMonthSelector(false);
  }, []);

  const handleToday = useCallback(() => {
    const today = new Date();
    onChange?.(toISODateString(today));
    handleClose();
  }, [onChange, handleClose]);

  // Check if a day is disabled
  const isDayDisabled = useCallback((day: number): boolean => {
    const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    if (minDateParsed && date < minDateParsed) return true;
    if (maxDateParsed && date > maxDateParsed) return true;
    return false;
  }, [viewDate, minDateParsed, maxDateParsed]);

  // Check if selected
  const isSelected = useCallback((day: number): boolean => {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewDate.getMonth() &&
      selectedDate.getFullYear() === viewDate.getFullYear()
    );
  }, [selectedDate, viewDate]);

  // Check if today
  const isToday = useCallback((day: number): boolean => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === viewDate.getMonth() &&
      today.getFullYear() === viewDate.getFullYear()
    );
  }, [viewDate]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
    const days: (number | null)[] = [];

    // Add empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [viewDate]);

  return (
    <div className={cn('relative w-full', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          'flex items-center justify-between w-full h-10 px-3 rounded-lg border bg-white dark:bg-slate-800/50 text-sm transition-all duration-200',
          'focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-500/60',
          error
            ? 'border-red-500 focus:ring-red-500/50 focus:border-red-500'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'ring-1 ring-amber-500/30 border-amber-500/60'
        )}
      >
        <span className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className={cn(value ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500')}>
            {value ? formatDisplayDate(value) : placeholder}
          </span>
        </span>
        <div className="flex items-center gap-1">
          {clearable && value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={cn(
              'w-4 h-4 text-slate-400 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </button>

      {error && errorMessage && (
        <p className="mt-1.5 text-sm text-red-400">{errorMessage}</p>
      )}

      {/* Calendar Dropdown */}
      {isOpen && dropdownStyle && createPortal(
        <div ref={dropdownRef} style={dropdownStyle}>
          <div className="z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2">
                {/* Month Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMonthSelector(!showMonthSelector);
                      setShowYearSelector(false);
                    }}
                    className="px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-sm transition-colors"
                  >
                    {MONTHS[viewDate.getMonth()]}
                  </button>
                  
                  {showMonthSelector && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-36 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                      {MONTHS.map((month, index) => (
                        <button
                          key={month}
                          type="button"
                          onClick={() => handleMonthSelect(index)}
                          className={cn(
                            'w-full px-3 py-1.5 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
                            viewDate.getMonth() === index 
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                              : 'text-slate-700 dark:text-slate-300'
                          )}
                        >
                          {month}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Year Selector */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowYearSelector(!showYearSelector);
                      setShowMonthSelector(false);
                    }}
                    className="px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-sm transition-colors"
                  >
                    {viewDate.getFullYear()}
                  </button>
                  
                  {showYearSelector && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-24 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                      {years.map((year) => (
                        <button
                          key={year}
                          type="button"
                          onClick={() => handleYearSelect(year)}
                          className={cn(
                            'w-full px-3 py-1.5 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors',
                            viewDate.getFullYear() === year 
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                              : 'text-slate-700 dark:text-slate-300'
                          )}
                        >
                          {year}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/30">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-slate-500"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 p-3">
            {calendarDays.map((day, index) => (
              <div key={index} className="aspect-square">
                {day !== null && (
                  <button
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    disabled={isDayDisabled(day)}
                    className={cn(
                      'w-full h-full rounded-lg text-sm font-medium transition-all duration-150',
                      'hover:bg-amber-500/20 focus:outline-none focus:ring-2 focus:ring-amber-500/50',
                      isSelected(day) && 'bg-amber-500 text-white hover:bg-amber-600',
                      isToday(day) && !isSelected(day) && 'ring-1 ring-amber-500/50 text-amber-600 dark:text-amber-400',
                      !isSelected(day) && !isToday(day) && 'text-slate-700 dark:text-slate-300',
                      isDayDisabled(day) && 'opacity-30 cursor-not-allowed hover:bg-transparent'
                    )}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/30 flex items-center justify-between">
            <button
              type="button"
              onClick={handleToday}
              className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Close
            </button>
          </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
