import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import styles from './Layout.module.css';

export interface ErrorBoundaryProps {
  children: ReactNode;
  label?: string;
  onError?: (error: Error, info: ErrorInfo) => void;
}

/** Contains render/lifecycle failures; async and event errors belong to their owner. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <div className={styles.error} role="alert">
          <p>{this.props.label ?? 'This experience'} is temporarily unavailable.</p>
          <p>You can continue using the chapter navigation.</p>
          <button type="button" onClick={() => this.setState({ failed: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
