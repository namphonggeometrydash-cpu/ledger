import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Ledger crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="auth-screen">
          <div className="auth-card">
            <h1 style={{ fontSize: 20, marginBottom: 10 }}>Something went wrong</h1>
            <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginBottom: 18 }}>
              {this.state.error.message || "The page hit an unexpected error."}
            </p>
            <button
              className="timer-btn primary"
              onClick={() => {
                this.setState({ error: null });
                window.location.href = "/app";
              }}
            >
              Back to dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
