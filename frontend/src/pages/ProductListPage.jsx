import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listProducts } from '../api/products';
import FilterBar from '../components/FilterBar';
import ProductCard from '../components/ProductCard';
import ProductCardSkeleton from '../components/ProductCardSkeleton';
import { getCachedProducts, setCachedProducts } from '../state/productsCache';

const PAGE_SIZE = 24;

export default function ProductListPage() {
  const { session } = useAuth();
  const cached = getCachedProducts();

  const [items, setItems] = useState(cached?.items ?? []);
  const [categories, setCategories] = useState(cached?.categories ?? []);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('name-asc');
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState('');
  // Render in pages rather than all at once: a large catalogue would otherwise mount
  // thousands of cards (and their image requests) on first paint.
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  async function refresh() {
    try {
      const data = await listProducts(session.token);
      setItems(data.items);
      setCategories(data.categories);
      setCachedProducts(data);
    } catch (err) {
      setError(err.message || 'Could not load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtering/sorting client-side is fine at catalogue scale, and the backend already
  // accepts search/category so this can move server-side later without an API change.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = items.filter((p) => {
      if (term && !p.name?.toLowerCase().includes(term)) return false;
      if (category && p.category !== category) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      switch (sort) {
        case 'name-desc':
          return (b.name || '').localeCompare(a.name || '');
        case 'newest':
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        case 'qty-desc':
          return (b.quantity || 0) - (a.quantity || 0);
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });
  }, [items, search, category, sort]);

  // Any change to the result set should start again from the first page.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, category, sort]);

  function handleClear() {
    setSearch('');
    setCategory('');
  }

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div className="product-list-page">
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        categories={categories}
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
        resultCount={filtered.length}
        onClear={handleClear}
      />

      {error && <p className="form-error">{error}</p>}

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="empty-state">No products found.</p>
      ) : (
        <>
          <div className="product-grid">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {hasMore && (
            <div className="load-more">
              <button
                type="button"
                className="btn"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Load more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
