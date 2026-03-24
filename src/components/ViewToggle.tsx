import { LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ViewToggleProps {
  view: 'table' | 'grid';
  onChange: (view: 'table' | 'grid') => void;
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center border rounded-lg overflow-hidden">
      <Button
        variant={view === 'table' ? 'default' : 'ghost'}
        size="sm"
        className="rounded-none h-8 px-3"
        onClick={() => onChange('table')}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={view === 'grid' ? 'default' : 'ghost'}
        size="sm"
        className="rounded-none h-8 px-3"
        onClick={() => onChange('grid')}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}
