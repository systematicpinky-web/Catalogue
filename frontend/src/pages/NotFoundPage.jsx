import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="not-found-page">
      <h1>Not found</h1>
      <Link to="/">Back to catalogue</Link>
    </div>
  );
}
