import { cn } from '../../utils/cn';

interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto">
      <table className={cn('w-full hidden md:table', className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }: TableProps) {
  return <thead className={cn('bg-slate-50 dark:bg-slate-800/50', className)}>{children}</thead>;
}

export function TableBody({ children, className }: TableProps) {
  return <tbody className={cn('', className)}>{children}</tbody>;
}

export function TableRow({ children, className }: TableProps) {
  return (
    <tr
      className={cn(
        'border-b border-slate-200 dark:border-slate-700/50 transition-colors',
        'hover:bg-slate-50 dark:hover:bg-slate-800/50',
        className
      )}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-slate-700 dark:text-slate-400 text-sm',
        className
      )}
    >
      {children}
    </th>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}

export function TableCell({ children, className, colSpan }: TableCellProps) {
  return (
    <td colSpan={colSpan} className={cn('px-4 py-3 align-middle text-sm text-slate-800 dark:text-slate-300', className)}>
      {children}
    </td>
  );
}

// Mobile Card Component for responsive tables
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileCard({ children, className, onClick }: MobileCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'md:hidden p-4 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700',
        'shadow-md hover:shadow-lg transition-all duration-200',
        'ring-1 ring-slate-900/5 dark:ring-slate-100/5',
        onClick && 'cursor-pointer active:scale-[0.99]',
        className
      )}
    >
      {children}
    </div>
  );
}

interface MobileCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardHeader({ children, className }: MobileCardHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-3', className)}>
      {children}
    </div>
  );
}

interface MobileCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardContent({ children, className }: MobileCardContentProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
}

interface MobileCardRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function MobileCardRow({ label, value, className }: MobileCardRowProps) {
  return (
    <div className={cn('flex items-center justify-between text-sm', className)}>
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-slate-800 dark:text-slate-200 font-medium">{value}</span>
    </div>
  );
}

interface MobileCardActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardActions({ children, className }: MobileCardActionsProps) {
  return (
    <div className={cn('flex items-center gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-700/50', className)}>
      {children}
    </div>
  );
}

// Container for the mobile cards list
interface MobileCardsContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardsContainer({ children, className }: MobileCardsContainerProps) {
  return (
    <div className={cn('md:hidden space-y-4', className)}>
      {children}
    </div>
  );
}
