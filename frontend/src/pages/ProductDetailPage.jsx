import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProduct, deleteProduct } from '../api/products';
import ConfirmDialog from '../components/ConfirmDialog';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    getProduct(session.token, id)
      .then(setProduct)
      .catch((err) => setError(err.message || 'Could not load product'));
  }, [id, session.token]);

  async function handleDelete() {
    await deleteProduct(session.token, id);
    navigate('/');
  }

  if (error) return <p className="form-error">{error}</p>;
  if (!product) return <p>Loading...</p>;

  return (
    <div className="product-detail-page">
      {product.imageUrl && <img src={product.imageUrl} alt={product.name} className="product-detail-image" />}
      <h1>{product.name}</h1>
      {product.category && <span className="badge">{product.category}</span>}
      <p>{product.description}</p>
      <dl className="product-detail-facts">
        <dt>Quantity</dt>
        <dd>{product.quantity}</dd>
        <dt>Value</dt>
        <dd>{product.value}</dd>
      </dl>
      <div className="detail-actions">
        <Link to={`/products/${id}/edit`} className="btn btn-primary">Edit</Link>
        <button type="button" className="btn btn-danger" onClick={() => setConfirmOpen(true)}>Delete</button>
      </div>

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
