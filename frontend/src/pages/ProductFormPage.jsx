import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProduct, addProduct, updateProduct } from '../api/products';
import ImageUpload from '../components/ImageUpload';
import { clearProductsCache } from '../state/productsCache';

const emptyForm = { name: '', category: '', description: '', quantity: 0, value: 0 };

export default function ProductFormPage() {
  const { id } = useParams(); // absent => add mode
  const isEdit = Boolean(id);
  const { session } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [pendingImage, setPendingImage] = useState(null); // {base64, mimeType} if a new photo was picked
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getProduct(session.token, id).then((p) => {
      setForm({
        name: p.name,
        category: p.category || '',
        description: p.description || '',
        quantity: p.quantity ?? 0,
        value: p.value ?? 0,
      });
      setExistingImageUrl(p.imageUrl || '');
    });
  }, [id, isEdit, session.token]);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (pendingImage) {
        payload.imageBase64 = pendingImage.base64;
        payload.imageMimeType = pendingImage.mimeType;
      }
      const saved = isEdit
        ? await updateProduct(session.token, id, payload)
        : await addProduct(session.token, payload);
      clearProductsCache();
      navigate(`/products/${saved.id}`);
    } catch (err) {
      setError(err.message || 'Could not save product');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="product-form-page">
      <Link to={isEdit ? `/products/${id}` : '/'} className="back-link">← Back</Link>
      <form className="product-form" onSubmit={handleSubmit}>
        <h1>{isEdit ? 'Edit product' : 'Add product'}</h1>

        <label>
          Name
          <input value={form.name} onChange={(e) => setField('name', e.target.value)} required />
        </label>
        <label>
          Category
          <input value={form.category} onChange={(e) => setField('category', e.target.value)} />
        </label>
        <label>
          Description
          <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} rows={4} />
        </label>

        <div className="form-row">
          <label>
            Quantity
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setField('quantity', Number(e.target.value))}
            />
          </label>
          <label>
            Value
            <input
              type="number"
              step="0.01"
              value={form.value}
              onChange={(e) => setField('value', Number(e.target.value))}
            />
          </label>
        </div>

        <ImageUpload currentImageUrl={existingImageUrl} onImageReady={setPendingImage} />

        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save product'}
        </button>
      </form>
    </div>
  );
}
