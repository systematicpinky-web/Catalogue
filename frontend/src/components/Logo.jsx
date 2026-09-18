// Simple inline wordmark: a small crown mark (nodding to "Rani" pink) + "Catalogue" in the
// display font. Kept as a component (not a raster image) so it stays crisp at any size and
// recolors with currentColor.
export default function Logo({ size = 'md' }) {
  return (
    <span className={`logo logo-${size}`}>
      <svg className="logo-mark" viewBox="0 0 24 20" width="1.15em" height="1em" aria-hidden="true">
        <path d="M2 18.5h20a1 1 0 0 0 1-1l-1.6-8a1 1 0 0 0-1.58-.55l-3.2 2.5-3.8-5.4a1 1 0 0 0-1.64 0l-3.8 5.4-3.2-2.5A1 1 0 0 0 2.6 9.5L1 17.5a1 1 0 0 0 1 1z" />
      </svg>
      <span className="logo-text">Catalogue</span>
    </span>
  );
}
