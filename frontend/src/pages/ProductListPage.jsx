import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { listProducts } from '../api/products';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import ProductCard from '../components/ProductCard';

export default function ProductListPage() {
  const { session } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const data = await listProducts(session.token);
      setItems(data.items);
      setCategories(data.categories);
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

  // Filtering client-side: fine at catalogue scale, and the backend already accepts
  // search/category so this can move server-side later without an API change.
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((p) => {
      if (term && !p.name?.toLowerCase().includes(term)) return false;
      if (category && p.category !== category) return false;
      return true;
    });
  }, [items, search, category]);

  return (
    <div className="product-list-page">
      <div className="toolbar">
        <SearchBar value={search} onChange={setSearch} />
        <CategoryFilter categories={categories} value={category} onChange={setCategory} />
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="form-error">{error}</p>}
      {!loading && !error && filtered.length === 0 && <p>No products found.</p>}

      <div className="product-grid">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
