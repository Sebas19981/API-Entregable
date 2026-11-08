# Instrucciones para probar la API con Postman

La API administra registros de la tabla `kdramas`. Primero inicia la aplicación con Docker:

```powershell
docker compose up --build -d
```

La dirección base es `http://localhost:3000`. En Postman, crea una solicitud, selecciona el método HTTP y agrega la ruta correspondiente. Para las solicitudes con cuerpo, selecciona **Body → raw → JSON**. No se requiere autenticación.

## Campos de la tabla

| Campo | Tipo | Reglas |
|---|---|---|
| `id` | Número | Lo genera automáticamente la base de datos. |
| `titulo` | Texto | Obligatorio al crear o reemplazar; máximo 150 caracteres. |
| `genero` | Texto | Obligatorio al crear o reemplazar; máximo 80 caracteres. |
| `protagonista` | Texto | Obligatorio al crear o reemplazar; máximo 150 caracteres. |
| `anio` | Número entero | Obligatorio al crear o reemplazar; debe ser positivo. |
| `episodios` | Número entero | Obligatorio al crear o reemplazar; debe ser positivo. |
| `calificacion` | Número | Entre 0 y 10, con máximo un decimal. En POST es opcional; si se omite, vale `0`. |

No envíes `id` ni campos que no estén en esta lista en el cuerpo de una solicitud.

## GET: consultar registros

### Consultar todos

- **Método:** `GET`
- **URL:** `http://localhost:3000/kdramas`
- **Body:** No requiere.
- **Respuesta esperada:** `200 OK`, con una lista JSON de K-dramas.

### Consultar por ID

- **Método:** `GET`
- **URL:** `http://localhost:3000/kdramas/1`
- **Body:** No requiere.
- **Respuesta esperada:** `200 OK`, con el registro cuyo ID sea `1`.
- Si no existe un registro con ese ID, responde `404 Not Found`.

Reemplaza `1` por el ID del registro que quieras consultar.

## POST: crear un registro

- **Método:** `POST`
- **URL:** `http://localhost:3000/kdramas`
- **Body → raw → JSON:**

```json
{
  "titulo": "Mi K-drama",
  "genero": "Romance",
  "protagonista": "Nombre del protagonista",
  "anio": 2024,
  "episodios": 16,
  "calificacion": 9.1
}
```

- **Respuesta esperada:** `201 Created`, con el registro creado y su `id`.
- `calificacion` se puede omitir; en ese caso se guarda como `0`.
- Si faltan campos requeridos o los datos no cumplen las reglas, responde `400 Bad Request`.

## PUT: reemplazar un registro completo

- **Método:** `PUT`
- **URL:** `http://localhost:3000/kdramas/1`
- **Body → raw → JSON:** Debe incluir los seis campos:

```json
{
  "titulo": "Mi K-drama actualizado",
  "genero": "Drama y romance",
  "protagonista": "Nombre actualizado",
  "anio": 2023,
  "episodios": 20,
  "calificacion": 8.7
}
```

- **Respuesta esperada:** `200 OK`, con el registro actualizado.
- Si el ID no corresponde a un registro existente, responde `404 Not Found`.
- PUT requiere todos los campos; para cambiar solo algunos, utiliza PATCH.

## PATCH: actualizar algunos campos

- **Método:** `PATCH`
- **URL:** `http://localhost:3000/kdramas/1`
- **Body → raw → JSON:** Incluye únicamente los campos que quieras cambiar:

```json
{
  "calificacion": 9.5,
  "episodios": 18
}
```

- **Respuesta esperada:** `200 OK`, con el registro actualizado.
- Debes enviar al menos un campo válido.
- Si el ID no corresponde a un registro existente, responde `404 Not Found`.
- Los valores enviados deben cumplir las mismas reglas de tipo y rango indicadas arriba.

## DELETE: eliminar un registro

- **Método:** `DELETE`
- **URL:** `http://localhost:3000/kdramas/1`
- **Body:** No requiere.
- **Respuesta esperada:** `200 OK` con el mensaje `K-drama eliminado`.
- Si el ID no corresponde a un registro existente, responde `404 Not Found`.

## Códigos de respuesta frecuentes

| Código | Significado |
|---|---|
| `200 OK` | Consulta, actualización o eliminación completada. |
| `201 Created` | Registro creado correctamente. |
| `400 Bad Request` | ID, JSON o datos enviados no válidos. |
| `404 Not Found` | Ruta o registro inexistente. |
| `405 Method Not Allowed` | El método no está disponible en esa ruta. |

