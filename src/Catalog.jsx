import { useEffect, useState } from "react";
import { initExperiment, track } from "./experiment.js";
import DebugPanel from "./Debug.jsx";

const EXPERIMENT = "catalog_order";

const INTERESTS = ["Clases particulares", "Formación en empresa", "Talleres propios", "Otro"];

const WORKSHOPS = [
  { id: "w1", title: "Primeros pasos con hojas de cálculo", tag: "Formación en empresa", popularity: 92 },
  { id: "w2", title: "Cómo grabar tus clases en vídeo", tag: "Clases particulares", popularity: 88 },
  { id: "w3", title: "Diseñar un taller de un día", tag: "Talleres propios", popularity: 85 },
  { id: "w4", title: "Comunicación para equipos", tag: "Formación en empresa", popularity: 80 },
  { id: "w5", title: "Preparar exámenes con fichas", tag: "Clases particulares", popularity: 76 },
  { id: "w6", title: "Vender tu taller online", tag: "Talleres propios", popularity: 70 },
  { id: "w7", title: "Gestión del tiempo para docentes", tag: "Otro", popularity: 66 },
  { id: "w8", title: "Evaluar sin exámenes", tag: "Clases particulares", popularity: 60 },
];

/** Control: por popularidad. Variante: primero lo que coincide con el interés elegido. */
export function orderWorkshops(variant, interest) {
  const byPopularity = [...WORKSHOPS].sort((a, b) => b.popularity - a.popularity);
  if (variant !== "by_interest") return byPopularity;
  return [
    ...byPopularity.filter((w) => w.tag === interest),
    ...byPopularity.filter((w) => w.tag !== interest),
  ];
}

export default function Catalog() {
  const [variant, setVariant] = useState(null);
  const [interest, setInterest] = useState(null);
  const [reserved, setReserved] = useState([]);
  const debug = new URLSearchParams(location.search).get("debug") === "1";

  useEffect(() => {
    let alive = true;
    initExperiment(EXPERIMENT)
      .then((v) => {
        if (!alive) return;
        setVariant(v);
        track(EXPERIMENT, "catalog_view", { variant: v });
      })
      .catch((err) => { console.error(err); setVariant("error"); });
    return () => { alive = false; };
  }, []);

  if (variant === null) return <main className="page" aria-busy="true" />;
  if (variant === "error") {
    return (
      <main className="page">
        <p className="error">No se pudo iniciar el experimento. Revisa la consola y el proveedor activo.</p>
      </main>
    );
  }

  const list = interest ? orderWorkshops(variant, interest) : [];

  function chooseInterest(value) {
    const first = interest === null;
    setInterest(value);
    track(EXPERIMENT, "interest_selected", { variant, interest: value });
    if (first) {
      // Exposición real: el usuario ve la lista ordenada por primera vez.
      const order = orderWorkshops(variant, value).map((w) => w.id).join(",");
      track(EXPERIMENT, "catalog_list_view", { variant, interest: value, order });
    }
  }

  function reserve(w, index) {
    if (reserved.includes(w.id)) return;
    setReserved((r) => [...r, w.id]);
    track(EXPERIMENT, "workshop_reserved", {
      variant, interest, workshop_id: w.id, position: index + 1, relevant: w.tag === interest,
    });
  }

  return (
    <main className="page">
      <section className="card wide" aria-labelledby="titulo">
        <p className="brand">Taller</p>
        <h1 id="titulo">Próximos talleres</h1>
        <p className="lead">Elige qué te interesa y te mostramos los talleres disponibles.</p>

        <div className="chips" role="group" aria-label="Tu interés">
          {INTERESTS.map((i) => (
            <button key={i} type="button" className={`chip ${interest === i ? "on" : ""}`}
              aria-pressed={interest === i} onClick={() => chooseInterest(i)}>
              {i}
            </button>
          ))}
        </div>

        {interest && (
          <ul className="list">
            {list.map((w, idx) => (
              <li key={w.id} className="item">
                <div>
                  <p className="item-title">{w.title}</p>
                  <p className="item-tag">{w.tag}</p>
                </div>
                <button type="button" className="reserve" disabled={reserved.includes(w.id)} onClick={() => reserve(w, idx)}>
                  {reserved.includes(w.id) ? "Plaza reservada" : "Reservar plaza"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {debug && <DebugPanel experiment={EXPERIMENT} variant={variant} />}
    </main>
  );
}
