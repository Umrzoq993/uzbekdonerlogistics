import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Konsolga minimal log
    // Agar kerak bo'lsa keyinchalik serverga yuborish qo'shiladi
    console.error("UI ErrorBoundary", error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    // optional refresh current route
    if (this.props.onRetry) this.props.onRetry();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32 }}>
          <h2 style={{ marginBottom: 12 }}>Xatolik yuz berdi</h2>
          <pre
            style={{
              background: "#1e1e1e",
              color: "#f5f5f5",
              padding: 12,
              borderRadius: 6,
              maxWidth: 600,
              whiteSpace: "pre-wrap",
            }}
          >
            {String(this.state.error?.message || this.state.error)}
          </pre>
          <button onClick={this.handleRetry} style={{ marginTop: 16 }}>
            Qayta urinib ko'rish
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
