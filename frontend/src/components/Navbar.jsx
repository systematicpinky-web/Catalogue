import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

export default function Navbar() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <Logo />
      </Link>
      {session && (
        <div className="navbar-actions">
          <span className="navbar-user">{session.displayName || session.username}</span>
          <Link to="/products/new" className="btn btn-primary">
            <span className="btn-icon" aria-hidden="true">+</span> Add product
          </Link>
          <button type="button" className="btn" onClick={handleLogout}>Log out</button>
        </div>
      )}
    </header>
  );
}
