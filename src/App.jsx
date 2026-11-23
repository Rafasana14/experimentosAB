import { useEffect, useState } from "react";
import Signup from "./Signup.jsx";
import Catalog from "./Catalog.jsx";

/** Dos páginas, dos experimentos independientes: #/ (registro) y #/catalogo. */
export default function App() {
  const [hash, setHash] = useState(location.hash);
  const debug = new URLSearchParams(location.search).get("debug") === "1";

  useEffect(() => {
    const onHash = () => setHash(location.hash);
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <>
      {debug && (
        <nav className="nav">
          <a href="#/">Registro</a>
          <a href="#/catalogo">Catálogo</a>
        </nav>
      )}
      {hash === "#/catalogo" ? <Catalog /> : <Signup />}
    </>
  );
}
