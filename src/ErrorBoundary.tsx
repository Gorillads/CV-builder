import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Catches a render crash that would otherwise leave the page blank (just
 *  the body's dark-mode background, no visible UI at all) with no way for
 *  a non-technical user to tell what went wrong. Shows the error text
 *  directly on the page — plain HTML/inline styles only, independent of
 *  the app's own CSS/design tokens, since those may not be what crashed
 *  but shouldn't be relied on here regardless — so it's screenshot-able
 *  without needing to open developer tools. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("CV Builder crashed:", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div
        style={{
          fontFamily: "system-ui, sans-serif",
          maxWidth: 640,
          margin: "40px auto",
          padding: "0 20px",
          color: "#24282e",
          background: "#fff",
          lineHeight: 1.5,
        }}
      >
        <h1 style={{ fontSize: 20 }}>Der opstod en fejl</h1>
        <p>
          Appen kunne ikke indlæses korrekt. Din gemte data i browseren er ikke slettet —
          den er stadig der, den kunne bare ikke vises lige nu.
        </p>
        <p>Send venligst et skærmbillede af hele denne side, så den kan blive rettet.</p>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            background: "#f3f2f0",
            padding: 12,
            borderRadius: 6,
            fontSize: 12,
            border: "1px solid #ddd",
          }}
        >
          {error.message}
          {error.stack ? `\n\n${error.stack}` : ""}
        </pre>
      </div>
    );
  }
}
