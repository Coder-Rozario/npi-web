import { useEffect } from "react";
import { Link } from "react-router-dom";

function ErrorFallback() {
  useEffect(() => {

    const timer = setTimeout(() => {
      window.location.reload();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <h1>Something went wrong</h1>
      <p>Refreshing the page automatically... Please wait.</p>
      <p>If it doesn't refresh, try reloading manually or go back to the home page.</p>
      <Link to="/">Go Home</Link>
    </div>
  );
}

export default ErrorFallback;
