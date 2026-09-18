import { useState } from 'react';
import { resizeImageFile } from '../utils/imageResize';

// Resizes the picked file client-side and reports {base64, mimeType} up via onImageReady,
// so the parent form can include it in the addProduct/updateProduct payload.
export default function ImageUpload({ currentImageUrl, onImageReady }) {
  const [preview, setPreview] = useState(currentImageUrl || '');
  const [error, setError] = useState('');

  async function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const { base64, mimeType } = await resizeImageFile(file);
      setPreview(`data:${mimeType};base64,${base64}`);
      onImageReady({ base64, mimeType });
    } catch (err) {
      setError('Could not process that image: ' + err.message);
    }
  }

  return (
    <div className="image-upload">
      {preview && <img src={preview} alt="Preview" className="image-upload-preview" />}
      <input type="file" accept="image/*" onChange={handleChange} />
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}
