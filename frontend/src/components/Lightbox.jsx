import { useEffect } from 'react';

export default function Lightbox({ src, alt, downloadSrc, downloadName, onClose }) {
  useEffect(() => {
    if (!src) return undefined;

    function onKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);

    // Stop the page behind the overlay from scrolling while it's open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [src, onClose]);

  if (!src) return null;

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={alt} onClick={onClose}>
      <div className="lightbox-toolbar">
        {downloadSrc && (
          <a
            href={downloadSrc}
            download={downloadName}
            className="lightbox-download"
            onClick={(e) => e.stopPropagation()}
            title="Download full-size photo"
          >
            Download
          </a>
        )}
        <button type="button" className="lightbox-close" onClick={onClose} aria-label="Close">×</button>
      </div>
      <img src={src} alt={alt} className="lightbox-image" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}
