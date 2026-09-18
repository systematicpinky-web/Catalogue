import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <div className="product-card-image">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-card-placeholder">No photo</div>
        )}
      </div>
      <div className="product-card-body">
        <h3>{product.name}</h3>
        {product.category && <span className="badge">{product.category}</span>}
        <p className="product-card-meta">Qty: {product.quantity ?? 0}</p>
      </div>
    </Link>
  );
}
