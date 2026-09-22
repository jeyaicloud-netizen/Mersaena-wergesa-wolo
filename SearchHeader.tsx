import { Menu, Mic, X } from 'lucide-react';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (val: string) => void;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
  onOpenDrawer: () => void;
}

const FILTERS = ['All', 'Missed', 'Contacts', 'Non-spam', 'Spam'];

export default function SearchHeader({
  searchQuery,
  onSearchChange,
  activeFilter,
  onSelectFilter,
  onOpenDrawer,
}: SearchHeaderProps) {
  return (
    <div className="w-full px-4 pt-1 pb-3 space-y-3">
      {/* Search Input Bar */}
      <div className="w-full bg-[#FFFFFF] rounded-full h-12 flex items-center px-4 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[#E5E3EB]">
        <button
          type="button"
          onClick={onOpenDrawer}
          className="p-1 text-[#49454F] hover:text-[#1D1B20] active:scale-95 transition-transform"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search contacts"
          className="flex-1 bg-transparent border-none outline-none px-3 text-[#1D1B20] placeholder-[#79747E] text-[16px]"
        />

        {searchQuery ? (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="p-1 text-[#49454F] hover:text-[#1D1B20]"
            aria-label="Clear search"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            className="p-1 text-[#49454F] hover:text-[#1D1B20] active:scale-95 transition-transform"
            aria-label="Voice search"
            onClick={() => {
              // Subtle voice search simulator or prompt
              alert('Voice search is ready');
            }}
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 text-sm font-medium">
        {FILTERS.map((filter) => {
          const isSelected = activeFilter === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => onSelectFilter(filter)}
              className={`px-4 py-1.5 rounded-xl transition-colors whitespace-nowrap text-[14px] ${
                isSelected
                  ? 'bg-[#E2DEFE] text-[#1E192B] font-semibold'
                  : 'bg-[#F2F1F8] border border-[#E0DFE8] text-[#49454F] hover:bg-[#EAE8F2]'
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
