import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProduct, deleteProduct } from '../api/products';
import ConfirmDialog from '../components/ConfirmDialog';
import ProductImage from '../components/ProductImage';
import LoadingSpinner from '../components/LoadingSpinner';
import Lightbox from '../components/Lightbox';
import { imageSrc } from '../utils/driveImage';
import { clearProductsCache } from '../state/productsCache';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    getProduct(session.token, id)
      .then(setProduct)
      .catch((err) => setError(err.message || 'Could not load product'));
  }, [id, session.token]);

  async function handleDelete() {
    await deleteProduct(session.token, id);
    clearProductsCache();
    navigate('/');
  }

  if (error) return <p className="form-error">{error}</p>;
  if (!product) return <LoadingSpinner />;

  return (
    <div className="product-detail-page">
      <Link to="/" className="back-link">← Back to catalogue</Link>

      <div className="product-detail-card">
        <ProductImage
          src={imageSrc(product.imageUrl, 1000)}
          alt={product.name}
          className="product-detail-image product-detail-image-zoom"
          placeholderClassName="product-detail-image product-detail-placeholder"
          onClick={() => product.imageUrl && setLightboxOpen(true)}
        />

        <div className="product-detail-body">
          <h1>{product.name}</h1>
          {product.category && <span className="badge">{product.category}</span>}
          {product.description && <p className="product-detail-description">{product.description}</p>}

          <dl className="product-detail-facts">
            <div>
              <dt>Quantity</dt>
              <dd>{product.quantity || 0}</dd>
            </div>
            <div>
              <dt>Value</dt>
              <dd>{product.value === '' || product.value == null ? '—' : product.value}</dd>
            </div>
          </dl>

          <div className="detail-actions">
            <Link to={`/products/${id}/edit`} className="btn btn-primary">Edit</Link>
            <button type="button" className="btn btn-danger" onClick={() => setConfirmOpen(true)}>Delete</button>
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <Lightbox
          src={imageSrc(product.imageUrl, 1000)}
          alt={product.name}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete product"
        message={`Are you sure you want to delete "${product.name}"? This can be reversed later from the sheet if needed.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
