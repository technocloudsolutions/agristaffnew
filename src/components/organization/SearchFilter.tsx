import { Search, ArrowUpDown, Filter } from 'lucide-react';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onStatusFilter: (status: string) => void;
  onSortChange: (field: string) => void;
  sortField: string;
  status: string;
}

export default function SearchFilter({
  searchTerm,
  onSearchChange,
  onStatusFilter,
  onSortChange,
  sortField,
  status
}: SearchFilterProps) {
  return (
    <div className="space-y-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name, code, or description..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-foreground 
                     focus:ring-2 focus:ring-primary/50 transition-shadow duration-200"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative min-w-[140px]">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <select
              value={status}
              onChange={(e) => onStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-foreground appearance-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="relative min-w-[140px]">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <select
              value={sortField}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background text-foreground appearance-none cursor-pointer"
            >
              <option value="name">Sort by Name</option>
              <option value="createdAt">Sort by Date</option>
              <option value="status">Sort by Status</option>
            </select>
          </div>
        </div>
      </div>
      {searchTerm && (
        <div className="text-sm text-muted-foreground">
          Showing results for "<span className="font-medium text-foreground">{searchTerm}</span>"
        </div>
      )}
    </div>
  );
} 