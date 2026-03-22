import './Skeleton.css';

interface SkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  className?: string;
  count?: number;
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  className = '',
  count = 1,
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const elements = Array.from({ length: count }, (_, index) => (
    <span
      key={index}
      className={`skeleton skeleton-${variant} ${className}`}
      style={style}
      aria-hidden="true"
    />
  ));

  return <>{elements}</>;
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 5, columns = 6 }: SkeletonTableProps) {
  return (
    <div className="skeleton-table" role="status" aria-label="Loading data">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} variant="text" height={20} />
        ))}
      </div>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }, (_, colIndex) => (
            <Skeleton key={colIndex} variant="text" height={16} />
          ))}
        </div>
      ))}
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card" role="status" aria-label="Loading content">
      <div className="card-header">
        <Skeleton variant="text" width="40%" height={24} />
      </div>
      <div className="card-body">
        <Skeleton variant="text" width="100%" height={16} className="mb-2" />
        <Skeleton variant="text" width="100%" height={16} className="mb-2" />
        <Skeleton variant="text" width="80%" height={16} className="mb-3" />
        <Skeleton variant="text" width="60%" height={16} className="mb-2" />
        <Skeleton variant="text" width="70%" height={16} className="mb-2" />
        <Skeleton variant="text" width="50%" height={16} />
      </div>
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}

export function SkeletonDetailPage() {
  return (
    <div className="card" role="status" aria-label="Loading item details">
      <div className="card-header">
        <Skeleton variant="text" width="50%" height={28} />
      </div>
      <div className="card-body">
        <div className="row mb-4">
          <div className="col-md-12">
            <Skeleton variant="rectangular" width="65%" height={200} className="mb-3" />
          </div>
        </div>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="row mb-2">
            <div className="col-md-3">
              <Skeleton variant="text" width="80%" height={16} />
            </div>
            <div className="col-md-9">
              <Skeleton variant="text" width="60%" height={16} />
            </div>
          </div>
        ))}
      </div>
      <span className="visually-hidden">Loading...</span>
    </div>
  );
}
