import { useEffect, useState } from 'react';

// Images come through our /api/image proxy, which already retries upstream. This guards the
// remaining browser-side failure modes (dropped connection, a proxy error) so a blip shows a
// placeholder rather than a broken-image icon, and fades images in once decoded instead of
// letting them pop in.
export default function ProductImage({ src, alt, className, placeholderClassName, onClick, eager }) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAttempt(0);
    setFailed(false);
    setLoaded(false);
  }, [src]);

  if (!src || failed) {
    return <div className={placeholderClassName}>No photo</div>;
  }

  function handleError() {
    if (attempt < 2) {
      setTimeout(() => setAttempt((a) => a + 1), 1000 * (attempt + 1));
    } else {
      setFailed(true);
    }
  }

  // Only cache-bust on retries — a successful first load should still hit the browser cache.
  const attemptSrc = attempt === 0 ? src : `${src}&retry=${attempt}`;

  return (
    <img
      src={attemptSrc}
      alt={alt}
      className={`${className || ''} img-fade${loaded ? ' img-loaded' : ''}`}
      loading={eager ? 'eager' : 'lazy'}
      fetchpriority={eager ? 'high' : undefined}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={handleError}
      onClick={onClick}
    />
  );
}
