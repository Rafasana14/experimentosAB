import { useEffect, useState } from "react";
import { getEventLog, onEvent, resetUser, activeProvider } from "./experiment.js";

export default function DebugPanel({ experiment, variant }) {
  const [log, setLog] = useState(getEventLog());
  useEffect(() => onEvent(() => setLog(getEventLog())), []);
  return (
    <aside className="debug">
      <p>
        Proveedor: <b>{activeProvider}</b> · Experimento: <b>{experiment}</b> · Variante: <b>{variant}</b>
      </p>
      <button type="button" className="secondary" onClick={resetUser}>Nueva visita (nuevo usuario)</button>
      <ol>
        {log.slice(-8).map((e, i) => (
          <li key={i}>{e.t.slice(11, 19)} {e.name} {e.variant ? `(${e.variant})` : ""}</li>
        ))}
      </ol>
    </aside>
  );
}
