# API: GET /api/v1/population

Resumen del endpoint

- Método: GET
- URL: `/api/v1/population`
- Descripción: Devuelve un arreglo de objetos de población dentro de un rectángulo definido por latitudes y longitudes mínimas y máximas.
- Respuesta: JSON array de objetos `{ lat, lon, POBTOT }`.

Parámetros (query params) — requeridos

- `lat_min`: número (float) — latitud mínima del rectángulo
- `lat_max`: número (float) — latitud máxima del rectángulo
- `lon_min`: número (float) — longitud mínima del rectángulo
- `lon_max`: número (float) — longitud máxima del rectángulo

Ejemplo de uso

GET /api/v1/population?lat_min=19.4&lat_max=19.5&lon_min=-99.2&lon_max=-99.1

Ejemplo curl

```bash
curl "http://127.0.0.1:8000/api/v1/population?lat_min=19.4&lat_max=19.5&lon_min=-99.2&lon_max=-99.1"
```

Snippet JavaScript (fetch)

> Cópialo al frontend y ajusta `baseUrl` según el entorno.

```js
const baseUrl = process.env.API_BASE_URL || "http://127.0.0.1:8000";

async function fetchPopulation(latMin, latMax, lonMin, lonMax) {
  const url = new URL("/api/v1/population", baseUrl);
  url.searchParams.set("lat_min", String(latMin));
  url.searchParams.set("lat_max", String(latMax));
  url.searchParams.set("lon_min", String(lonMin));
  url.searchParams.set("lon_max", String(lonMax));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "Accept": "application/json" }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return data; // array de { lat, lon, POBTOT }
}

// Uso
fetchPopulation(19.4, 19.5, -99.2, -99.1)
  .then(list => console.log("population:", list))
  .catch(err => console.error("API error:", err));
```

Snippet con axios + TypeScript interfaces

```ts
// types
export interface PopulationItem {
  lat: number;
  lon: number;
  POBTOT: number;
}

// function
import axios from "axios";
const api = axios.create({ baseURL: process.env.API_BASE_URL || "http://127.0.0.1:8000" });

export async function getPopulation(latMin: number, latMax: number, lonMin: number, lonMax: number): Promise<PopulationItem[]> {
  const resp = await api.get<PopulationItem[]>('/api/v1/population', {
    params: { lat_min: latMin, lat_max: latMax, lon_min: lonMin, lon_max: lonMax }
  });
  return resp.data;
}

// Uso
// getPopulation(19.4,19.5,-99.2,-99.1).then(r => console.log(r));
```

Ejemplo de respuesta (JSON array)

```json
[
  { "lat": 19.45, "lon": -99.15, "POBTOT": 120 },
  { "lat": 19.46, "lon": -99.14, "POBTOT": 95 }
]
```

Notas rápidas (validación y manejo de errores)

- Validación en backend:
  - Asegurar que los 4 parámetros estén presentes y sean números válidos.
  - Validar que `lat_min < lat_max` y `lon_min < lon_max`.
  - Rechazar requests con un rectángulo demasiado grande (por ejemplo, área > umbral) o pedir paginación/aggregación.
- Errores HTTP sugeridos:
  - 400 Bad Request: parámetros faltantes/ inválidos.
  - 413 Payload Too Large / 422 Unprocessable Entity: si la petición solicita un área demasiado grande.
  - 500 Internal Server Error: errores del servidor o base de datos.
- Manejo en frontend:
  - Validar antes de llamar (evitar solicitudes innecesarias).
  - Mostrar mensajes claros al usuario para 4xx/5xx.
  - Implementar reintentos exponenciales solo para errores transitorios (5xx).

Recomendaciones para el frontend

- Validar entradas antes de llamar (asegurar que `lat_min < lat_max` y `lon_min < lon_max`).
- Usar un límite espacial razonable en el cliente para evitar peticiones que devuelvan miles de filas; si es posible, pedir paginación en backend (puedo añadirla).
- Manejar `status != 200`: mostrar mensaje al usuario y reintentos si procede.
- Activar cache/TTL corto si la misma zona se consulta frecuentemente.
- CORS: la API debe exponer CORS para el origen del frontend; si hay problemas, confirmar `ALLOWED_ORIGINS` en la configuración del backend.
- En producción: cambiar `baseURL` a la dirección pública (ej. `https://api.miapp.com`).

Resumen rápido

- Endpoint: `GET /api/v1/population`
- Query params (requeridos): `lat_min`, `lat_max`, `lon_min`, `lon_max` (floats)
- Respuesta: `200 OK` con JSON array de `{ lat, lon, POBTOT }`
- Validación: asegurar parámetros presentes y range válido; limitar el área solicitada o implementar paginación/aggregación.

---

Si quieres, puedo:

- Añadir paginación (limit/offset) o solicitudes agregadas (hex/quad aggregation) en el backend.
- Generar el endpoint FastAPI/SQLAlchemy real con ejemplos de SQL para tu esquema.
- Añadir tests de integración para el endpoint.

