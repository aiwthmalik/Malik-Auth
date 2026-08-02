// @ts-nocheck
import * as React from 'react';
import { AlertTriangle } from 'lucide-react';

// @ts-ignore
export class SafeRender extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    // @ts-ignore
    this.state = { hasError: false, error: null };
  }

  // @ts-ignore
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: error.message || String(error) };
  }

  // @ts-ignore
  componentDidCatch(error: any, info: any) {
    console.error(`[SafeRender] Error in ${this.props.name || 'component'}:`, error, info);
  }

  // @ts-ignore
  render() {
    // @ts-ignore
    if (this.state.hasError) {
      // @ts-ignore
      const errorMsg = this.state.error || 'Unknown error';
      // @ts-ignore
      const name = this.props.name || 'component';
      return (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-700 dark:text-rose-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
            <div>
              <p className="text-sm font-bold">Error in {name}</p>
              <p className="mt-1 text-xs font-mono break-words">{errorMsg}</p>
              <p className="mt-2 text-xs text-rose-600/70">Check browser console (F12) for full stack trace</p>
            </div>
          </div>
        </div>
      );
    }
    // @ts-ignore
    return this.props.children;
  }
}
