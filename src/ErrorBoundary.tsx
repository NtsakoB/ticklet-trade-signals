import { Component, ReactNode } from "react";

export default class ErrorBoundary extends Component<{children: ReactNode}, {error: any}> {
  state = { error: null };
  
  static getDerivedStateFromError(error: any) { 
    return { error }; 
  }
  
  render() {
    return this.state.error
      ? <div style={{padding:16,fontFamily:"ui-sans-serif"}}>
          <h1>UI crashed</h1>
          <pre style={{whiteSpace:"pre-wrap"}}>{String(this.state.error?.message || this.state.error)}</pre>
        </div>
      : this.props.children;
  }
}