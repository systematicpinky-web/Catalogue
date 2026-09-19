import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import { imageSrc } from '../utils/driveImage';

export default function ProductCard({ product }) {
  return (
    <div className="product-card">
      {product.dfNumber && (
        <Link
          to={`/?df=${encodeURIComponent(product.dfNumber)}`}
          className="df-tag"
          onClick={(e) => e.stopPropagation()}
          title="View all colours in this design family"
        >
          DF {product.dfNumber}
        </Link>
      )}
      <Link to={`/products/${product.id}`} className="product-card-link">
        <div className="product-card-image">
          <ProductImage
            src={imageSrc(product.imageUrl, 400)}
            alt={product.name}
            placeholderClassName="product-card-placeholder"
          />
        </div>
        <div className="product-card-body">
          <h3>{product.name}</h3>
          {product.category && <span className="badge">{product.category}</span>}
          <p className="product-card-meta">Qty: {product.quantity ?? 0}</p>
        </div>
      </Link>
    </div>
  );
}
