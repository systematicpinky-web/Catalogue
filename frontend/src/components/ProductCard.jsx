import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import { imageSrc } from '../utils/driveImage';

export default function ProductCard({ product }) {
  return (
    <Link to={`/products/${product.id}`} className="product-card">
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
  );
}
