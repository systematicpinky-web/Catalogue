export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="loading-spinner-wrap">
      <span className="loading-spinner" aria-hidden="true" />
      <span className="loading-spinner-label">{label}</span>
    </div>
  );
}
