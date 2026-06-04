import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type SortOption = { value: string; label: string };

type Props = {
  value: string;
  onValueChange: (v: string) => void;
  options: SortOption[];
  className?: string;
  id?: string;
};

export function DataTableSortSelect({ value, onValueChange, options, className, id }: Props) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className={cn('w-[min(100%,300px)]', className)} aria-label="Ordre d'affichage et export">
        <SelectValue placeholder="Trier par…" />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
