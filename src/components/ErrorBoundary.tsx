import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Top-level crash guard. If any route render throws, show the error visibly
 * in the DOM instead of leaving a blank page. This also serves as a
 * diagnostic surface: the message below identifies the crashing component.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('[Meridian] Render crash caught by ErrorBoundary:', error)
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div
          data-testid="error-boundary"
          style={{
            minHeight: '100vh',
            background: '#fff',
            color: '#111',
            padding: '32px 24px',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</h1>
          <p data-testid="error-message" style={{ marginTop: 12 }}>
            {error.name}: {error.message}
          </p>
          <pre
            data-testid="error-stack"
            style={{ marginTop: 12, whiteSpace: 'pre-wrap', fontSize: 12, color: '#444' }}
          >
            {error.stack}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 16,
              padding: '8px 16px',
              border: '1px solid #111',
              borderRadius: 8,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
