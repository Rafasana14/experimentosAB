# ab-demo: páginas de prueba para la comparativa de plataformas A/B

Producto ficticio ("Taller") con **dos experimentos independientes**, cada uno en su
propia página, con su propia asignación y su propia métrica:

| Experimento | Página | Variantes | Métrica principal |
|---|---|---|---|
| `signup_flow` | `#/` (registro) | `one_step` / `two_steps` | `signup_completed` |
| `catalog_order` | `#/catalogo` | `by_popularity` / `by_interest` | `workshop_reserved` |

El 1 cambia el **flujo** del usuario (lado cliente). El 2 cambia la **lógica de ordenación**
(los talleres que coinciden con el interés elegido van primero): no se puede hacer solo
con un editor visual, así que sirve para ver qué plataformas exigen código.

## Ejecutar

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite. Añade `?debug=1` para ver un menú entre páginas, el panel con la
variante y los últimos eventos, y el botón "Nueva visita" para simular otro usuario.
Para forzar una variante (solo proveedor `local`): `?signup_flow=two_steps` o
`?catalog_order=by_interest`.

## Eventos

| Evento | Cuándo |
|---|---|
| `signup_view` | Se muestra el formulario (exposición) |
| `step1_completed` | Termina el paso 1 (solo `two_steps`) |
| `signup_validation_error` | Error de validación |
| `signup_completed` | Registro terminado (**métrica principal del experimento 1**) |
| `catalog_view` | Se abre el catálogo |
| `interest_selected` | El usuario elige su interés |
| `catalog_list_view` | Ve la lista ordenada por primera vez (exposición real) |
| `workshop_reserved` | Reserva un taller (**métrica principal del experimento 2**; incluye `position` y `relevant`) |

Todos se guardan también en `localStorage` (`ab_demo_events`): sirve como registro
"de verdad" para comprobar si cada plataforma recibe los mismos eventos.

## Integrar una plataforma

Edita solo `src/experiment.js`: cambia `ACTIVE_PROVIDER` y completa `init(key)` (debe devolver una
variante de `EXPERIMENTS[key].variants`) y `track(key, name, props)` en el proveedor correspondiente, siguiendo
la documentación oficial de esa plataforma. VWO y ABlyft suelen añadir un script en `index.html`.

Nota: el código no se ha ejecutado todavía en un entorno con red (no se pudo instalar
dependencias al prepararlo), así que si `npm install` o `npm run dev` fallan, apunta el error
como parte de tu medición de bloqueos.
