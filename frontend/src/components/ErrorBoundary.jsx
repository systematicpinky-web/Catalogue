import { Component } from 'react';

// Without this, a render error anywhere unmounts the whole tree and leaves a blank page,
// which in production looks identical to the app failing to load at all.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="error-state">
        <h2>Something went wrong</h2>
        <p>{this.state.error.message || 'An unexpected error occurred.'}</p>
        <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
