export default function ProductCardSkeleton() {
  return (
    <div className="product-card skeleton-card" aria-hidden="true">
      <div className="product-card-image skeleton-shimmer" />
      <div className="product-card-body">
        <div className="skeleton-line skeleton-shimmer" style={{ width: '70%' }} />
        <div className="skeleton-line skeleton-shimmer" style={{ width: '40%' }} />
      </div>
    </div>
  );
}
