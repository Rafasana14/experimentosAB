import { useEffect, useRef, useState } from "react";
import { initExperiment, track } from "./experiment.js";
import DebugPanel from "./Debug.jsx";

const EXPERIMENT = "signup_flow";

const USOS = ["Clases particulares", "Formación en empresa", "Talleres propios", "Otro"];
const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

function Field({ id, label, error, children }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <p className="error" id={`${id}-err`} role="alert">{error}</p>}
    </div>
  );
}

function validate(values, keys) {
  const e = {};
  if (keys.includes("name") && !values.name.trim()) e.name = "Escribe tu nombre.";
  if (keys.includes("email") && !emailOk(values.email)) e.email = "Escribe un email válido, por ejemplo ana@correo.es.";
  if (keys.includes("password") && values.password.length < 8) e.password = "La contraseña necesita al menos 8 caracteres.";
  if (keys.includes("uso") && !values.uso) e.uso = "Elige para qué usarás Taller.";
  return e;
}

export default function Signup() {
  const [variant, setVariant] = useState(null);
  const [step, setStep] = useState(1);
  const [values, setValues] = useState({ name: "", email: "", password: "", uso: "" });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const startedAt = useRef(null);
  const debug = new URLSearchParams(location.search).get("debug") === "1";

  // No se pinta nada hasta conocer la variante: evita el parpadeo entre versiones.
  useEffect(() => {
    let alive = true;
    initExperiment(EXPERIMENT)
      .then((v) => {
        if (!alive) return;
        setVariant(v);
        startedAt.current = performance.now();
        track(EXPERIMENT, "signup_view", { variant: v });
      })
      .catch((err) => { console.error(err); setVariant("error"); });
    return () => { alive = false; };
  }, []);

  const set = (k) => (ev) => setValues((s) => ({ ...s, [k]: ev.target.value }));

  function submitStep(keys, isLast) {
    return (ev) => {
      ev.preventDefault();
      const e = validate(values, keys);
      setErrors(e);
      if (Object.keys(e).length) {
        track(EXPERIMENT, "signup_validation_error", { variant, step, fields: Object.keys(e).join(",") });
        return;
      }
      if (!isLast) {
        track(EXPERIMENT, "step1_completed", { variant });
        setStep(2);
        return;
      }
      track(EXPERIMENT, "signup_completed", {
        variant,
        time_to_complete_ms: Math.round(performance.now() - startedAt.current),
      });
      setDone(true);
    };
  }

  if (variant === null) return <main className="page" aria-busy="true" />;
  if (variant === "error") {
    return (
      <main className="page">
        <p className="error">No se pudo iniciar el experimento. Revisa la consola y el proveedor activo.</p>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="card" aria-labelledby="titulo">
        <p className="brand">Taller</p>
        {done ? (
          <>
            <h1 id="titulo">Cuenta creada</h1>
            <p className="lead">Ya puedes entrar con {values.email}.</p>
          </>
        ) : (
          <>
            <h1 id="titulo">Crea tu cuenta</h1>
            <p className="lead">
              {variant === "two_steps"
                ? `Paso ${step} de 2: ${step === 1 ? "tus datos de acceso" : "cuéntanos sobre ti"}.`
                : "Tarda menos de un minuto."}
            </p>

            {variant === "one_step" && (
              <form noValidate onSubmit={submitStep(["name", "email", "password", "uso"], true)}>
                <Field id="name" label="Nombre" error={errors.name}>
                  <input id="name" autoComplete="name" value={values.name} onChange={set("name")} aria-invalid={!!errors.name} />
                </Field>
                <Field id="email" label="Email" error={errors.email}>
                  <input id="email" type="email" autoComplete="email" value={values.email} onChange={set("email")} aria-invalid={!!errors.email} />
                </Field>
                <Field id="password" label="Contraseña" error={errors.password}>
                  <input id="password" type="password" autoComplete="new-password" value={values.password} onChange={set("password")} aria-invalid={!!errors.password} />
                </Field>
                <Field id="uso" label="¿Para qué usarás Taller?" error={errors.uso}>
                  <select id="uso" value={values.uso} onChange={set("uso")} aria-invalid={!!errors.uso}>
                    <option value="">Elige una opción</option>
                    {USOS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </Field>
                <button type="submit">Crear cuenta</button>
              </form>
            )}

            {variant === "two_steps" && step === 1 && (
              <form noValidate onSubmit={submitStep(["email", "password"], false)}>
                <Field id="email" label="Email" error={errors.email}>
                  <input id="email" type="email" autoComplete="email" value={values.email} onChange={set("email")} aria-invalid={!!errors.email} />
                </Field>
                <Field id="password" label="Contraseña" error={errors.password}>
                  <input id="password" type="password" autoComplete="new-password" value={values.password} onChange={set("password")} aria-invalid={!!errors.password} />
                </Field>
                <button type="submit">Continuar</button>
              </form>
            )}

            {variant === "two_steps" && step === 2 && (
              <form noValidate onSubmit={submitStep(["name", "uso"], true)}>
                <Field id="name" label="Nombre" error={errors.name}>
                  <input id="name" autoComplete="name" value={values.name} onChange={set("name")} aria-invalid={!!errors.name} />
                </Field>
                <Field id="uso" label="¿Para qué usarás Taller?" error={errors.uso}>
                  <select id="uso" value={values.uso} onChange={set("uso")} aria-invalid={!!errors.uso}>
                    <option value="">Elige una opción</option>
                    {USOS.map((u) => <option key={u}>{u}</option>)}
                  </select>
                </Field>
                <button type="submit">Crear cuenta</button>
              </form>
            )}
          </>
        )}
      </section>

      {debug && <DebugPanel experiment={EXPERIMENT} variant={variant} />}
    </main>
  );
}
