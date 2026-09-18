import SearchBar from './SearchBar';

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'newest', label: 'Newest first' },
  { value: 'qty-desc', label: 'Quantity (high–low)' },
];

export default function FilterBar({
  search,
  onSearchChange,
  categories,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  resultCount,
  onClear,
}) {
  const hasActiveFilters = Boolean(search || category);

  return (
    <div className="filter-bar">
      <div className="filter-row">
        <SearchBar value={search} onChange={onSearchChange} />
        <select className="sort-select" value={sort} onChange={(e) => onSortChange(e.target.value)} aria-label="Sort by">
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {categories.length > 0 && (
        <div className="category-pills">
          <button
            type="button"
            className={`pill${category === '' ? ' pill-active' : ''}`}
            onClick={() => onCategoryChange('')}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={`pill${category === c ? ' pill-active' : ''}`}
              onClick={() => onCategoryChange(category === c ? '' : c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="filter-meta">
        <span>{resultCount} product{resultCount === 1 ? '' : 's'}</span>
        {hasActiveFilters && (
          <button type="button" className="link-button" onClick={onClear}>Clear filters</button>
        )}
      </div>
    </div>
  );
}
