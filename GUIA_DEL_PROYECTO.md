# Guia completa del proyecto Mendoza Reviews API para Framer

Este documento explica el proyecto completo para que cualquier persona o IA pueda entender que se hizo, como funciona, donde se configura cada cosa y que se debe cuidar al replicarlo en otros sitios.

Importante: este archivo se puede subir a GitHub porque no contiene secretos reales. Las claves reales deben quedarse solo en Vercel y en el archivo local de respaldo que esta fuera del repositorio.

## 1. Objetivo del proyecto

El sitio de Mendoza Plastic Surgery se esta migrando a Framer. Antes las resenas podian depender de WordPress o de plugins externos, pero la meta es que la web quede 100% en Framer.

Este proyecto crea una API en Vercel que:

1. Se conecta a Google Business Profile con OAuth.
2. Trae las resenas de la ficha de Mendoza Plastic Surgery.
3. Filtra resenas sin comentario.
4. Devuelve maximo las ultimas 50 resenas.
5. Expone las resenas como JSON para que Framer las pinte con un diseno propio.
6. Se actualiza automaticamente con Vercel Cron.

Flujo tecnico:

```text
Google Business Profile API
        |
        v
Vercel Serverless Function /api/sync
        |
        v
Cache opcional en Vercel Blob
        |
        v
Vercel Serverless Function /api/reviews
        |
        v
Componente en Framer
```

## 2. Repositorio y despliegue

Repositorio de GitHub:

```text
https://github.com/IdealTeamDev/mendoza-reviews-api-framer
```

Proyecto en Vercel:

```text
mendoza-reviews-api-framer
```

Dominio actual de Vercel:

```text
https://mendoza-reviews-api-framer-lemon.vercel.app
```

Dominio del sitio final de Mendoza:

```text
https://www.mendozaplasticsurgery.com/
```

Nota importante: el dominio base de Vercel puede mostrar `404: NOT_FOUND`. Eso es correcto porque no se creo una pagina web en la raiz. Este proyecto es una API y se usa desde sus endpoints.

## 3. Endpoints disponibles

### 3.1 Endpoint publico para Framer

```text
GET https://mendoza-reviews-api-framer-lemon.vercel.app/api/reviews
```

Este endpoint devuelve un JSON con esta forma:

```json
{
  "updatedAt": "2026-07-30T08:37:40.918Z",
  "total": 50,
  "reviews": [
    {
      "id": "id-de-google",
      "authorName": "Nombre del paciente",
      "authorPhoto": "https://...",
      "rating": 5,
      "text": "Comentario de la resena",
      "date": "2025-11-14T03:37:29.505947Z",
      "source": "Google"
    }
  ]
}
```

Framer debe consumir este endpoint para construir el carrusel o tarjetas de testimonios con el diseno del Figma.

### 3.2 Endpoint privado/manual de sincronizacion

```text
GET https://mendoza-reviews-api-framer-lemon.vercel.app/api/sync?secret=TU_CRON_SECRET
```

Este endpoint fuerza la actualizacion desde Google. Si todo esta bien responde algo parecido a:

```json
{
  "ok": true,
  "count": 50,
  "updatedAt": "2026-07-30T08:37:40.918Z"
}
```

No se debe compartir la URL con el secret en lugares publicos.

## 4. Actualizacion automatica

El archivo `vercel.json` define un cron diario:

```json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Esto ejecuta `/api/sync` todos los dias a las 08:00 UTC. En Colombia equivale aproximadamente a las 03:00 a. m.

## 5. Variables de entorno reales

Estas variables se agregan en Vercel en:

```text
Project -> Settings -> Environment Variables
```

Todas deben estar activas en:

```text
Production and Preview
```

### 5.1 Variables obligatorias

| Variable | Obligatoria | De donde sale | Comentario |
| --- | --- | --- | --- |
| `GOOGLE_CLIENT_ID` | Si | Google Cloud, cliente OAuth web | Identifica la aplicacion OAuth. |
| `GOOGLE_CLIENT_SECRET` | Si | Google Cloud, cliente OAuth web | Secreto OAuth. Nunca subir a GitHub. |
| `GOOGLE_REFRESH_TOKEN` | Si | OAuth Playground, paso 2 | Token permanente. Empieza con `1//`. Nunca subir a GitHub. |
| `GBP_LOCATION_NAME` | Si | Google Business Profile API | Identificador completo de la ubicacion. |
| `CRON_SECRET` | Si | Valor creado manualmente | Protege `/api/sync` cuando se ejecuta manualmente. |
| `ALLOWED_ORIGIN` | Si | Valor de seguridad CORS | En pruebas puede ser `*`; en produccion puede ser el dominio de Framer. |

### 5.2 Variable opcional

| Variable | Obligatoria | De donde sale | Comentario |
| --- | --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob | Permite guardar cache persistente. Si no existe, la API igual funciona consultando Google. |

### 5.3 Valores no secretos de Mendoza

Estos valores no son secretos y sirven como referencia:

```text
GOOGLE_CLIENT_ID=645244292628-7mkngs39fget7d7rdrcjnlemro49j245.apps.googleusercontent.com
GBP_LOCATION_NAME=accounts/111536937423890926494/locations/9474561777683359510
ALLOWED_ORIGIN=*
```

El `CRON_SECRET` es una clave privada creada para este proyecto. Aunque no es una clave de Google, tambien debe tratarse como dato sensible y no publicarse en documentos publicos.

Los valores reales de `GOOGLE_CLIENT_SECRET` y `GOOGLE_REFRESH_TOKEN` no deben aparecer en GitHub.

## 6. Archivo local de claves

Existe un documento local de respaldo con las variables reales:

```text
C:\Users\eliza\Downloads\VERCEL_ENVIRONMENT_VARIABLES_MENDOZA.md
```

Ese archivo no debe subirse a GitHub bajo ninguna circunstancia.

El repositorio incluye `.gitignore` para bloquear:

```text
VERCEL_ENVIRONMENT_VARIABLES_MENDOZA.md
VERCEL_ENVIRONMENT_VARIABLES_*.md
.env
.env.*
```

Si algun secreto se sube accidentalmente a GitHub, se debe rotar inmediatamente el secreto del cliente OAuth y generar un nuevo refresh token.

## 7. Cuenta de Google usada

Todo se configuro con la cuenta de Google:

```text
santiago@idealteamcolombia.com
```

En esa cuenta estan las fichas de negocios y las credenciales usadas para consultar Google Business Profile.

Cuando se cree una integracion nueva para otra pagina, primero hay que confirmar que esa misma cuenta tiene acceso a la ficha de negocio que se quiere consultar. Si la ficha esta en otra cuenta de Google, se debe generar un nuevo refresh token autorizando con esa otra cuenta.

## 8. APIs habilitadas en Google Cloud

En el proyecto de Google Cloud usado para las resenas se vieron habilitadas estas APIs relacionadas:

```text
Google My Business API
My Business Account Management API
My Business Business Information API
```

La API que consulta las resenas en el codigo es:

```text
https://mybusiness.googleapis.com/v4/{GBP_LOCATION_NAME}/reviews
```

Esta es la integracion avanzada de Google Business Profile. No es Google Places basico.

## 9. OAuth Playground y refresh token

El refresh token se obtiene desde:

```text
https://developers.google.com/oauthplayground/
```

Pasos:

1. Abrir OAuth Playground.
2. Dar clic en el icono de engranaje.
3. Activar `Use your own OAuth credentials`.
4. Configurar:

```text
OAuth flow: Server-side
OAuth endpoints: Google
Access type: Offline
Force prompt: Consent Screen
```

5. Pegar el `GOOGLE_CLIENT_ID`.
6. Pegar el `GOOGLE_CLIENT_SECRET`.
7. Cerrar el panel de configuracion.
8. En Step 1, usar este scope:

```text
https://www.googleapis.com/auth/business.manage
```

9. Dar clic en `Authorize APIs`.
10. Iniciar sesion con `santiago@idealteamcolombia.com`.
11. Aceptar permisos.
12. En Step 2, dar clic en `Exchange authorization code for tokens`.
13. Copiar el `Refresh token`, que empieza por `1//`.

Importante: no usar el `Access token` que empieza por `ya29...`, porque expira aproximadamente en una hora. El servidor necesita el `Refresh token`.

## 10. Como se encontro la cuenta y la ubicacion de Mendoza

Con el access token temporal del OAuth Playground se consulto:

```text
GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts
```

La cuenta devuelta fue:

```text
accounts/111536937423890926494
```

Despues se consultaron las ubicaciones:

```text
GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts/111536937423890926494/locations?readMask=name,title,storefrontAddress
```

La ubicacion elegida para Mendoza fue:

```text
locations/9474561777683359510
Mendoza Plastic Surgery
3970 Rogers Bridge Rd, Duluth, GA, US, 30097-2214
```

Por eso el valor completo de `GBP_LOCATION_NAME` es:

```text
accounts/111536937423890926494/locations/9474561777683359510
```

## 11. Ubicaciones vistas en la cuenta de Google

En la primera consulta de ubicaciones aparecieron estas fichas:

| Numero | Location ID | Nombre |
| --- | --- | --- |
| 1 | `locations/4860902657364432649` | Bar Chiquita Bogota |
| 2 | `locations/9474561777683359510` | Mendoza Plastic Surgery |
| 3 | `locations/8244823656505892518` | Especialistas en Casa |
| 4 | `locations/14679155076337334322` | Bar Chiquita |
| 5 | `locations/5571612341812949372` | Hotel Casa Candela |
| 6 | `locations/5976846637906476928` | Botanika Cocina Fresca |
| 7 | `locations/7565377643566913809` | Batido Smoothies & Paninis - Laureles |
| 8 | `locations/16549395549134920063` | Restaurante Pato Pekin Medellin |
| 9 | `locations/14796674516182327171` | Ideal Plastic Surgery |
| 10 | `locations/956677509478697488` | Mombasa Restaurante Medellin |

La respuesta tambien tenia `nextPageToken`, asi que puede haber mas ubicaciones. Para ver todas, se debe consultar la siguiente pagina con `pageToken`.

## 12. Como se creo el repositorio en GitHub

Se creo un repositorio en la organizacion:

```text
Owner: IdealTeamDev
Repository name: mendoza-reviews-api-framer
Description: API automatica para sincronizar resenas de Google Business Profile de Mendoza Plastic Surgery con Framer.
```

Inicialmente hubo problemas para subir por consola porque:

1. El repositorio estaba privado o la cuenta local no tenia acceso.
2. Git mostro un error de propiedad del directorio: `dubious ownership`.

Para solucionar `dubious ownership` se uso:

```powershell
git config --global --add safe.directory "C:/Users/eliza/Documents/Codex/2026-07-28/es/outputs/mendoza-vercel-reviews"
```

Para corregir el remoto se uso:

```powershell
git remote set-url origin https://github.com/IdealTeamDev/mendoza-reviews-api-framer.git
```

Para subir por primera vez:

```powershell
git push -u origin main
```

Para subir cambios despues:

```powershell
git push
```

## 13. Alerta importante sobre compartir el proyecto

Si el repositorio esta en `IdealTeamDev` y se quiere hacer push desde otra cuenta, esa cuenta debe tener acceso como colaboradora.

Paso recomendado:

1. Entrar al repositorio con la cuenta que lo creo o administra.
2. Ir a `Settings`.
3. Ir a `Collaborators`.
4. Dar clic en `Add people`.
5. Invitar la cuenta personal que vaya a subir cambios.
6. Aceptar la invitacion desde la cuenta personal.

Si no se acepta la invitacion o el usuario no tiene permisos, Git puede mostrar:

```text
remote: Repository not found.
fatal: repository not found
```

Eso no necesariamente significa que el repositorio no exista. Puede significar que la cuenta autenticada no tiene acceso.

## 14. Paso a paso en Vercel

1. Entrar en Vercel.
2. Dar clic en `New Project`.
3. Importar el repositorio:

```text
IdealTeamDev/mendoza-reviews-api-framer
```

4. Seleccionar el team:

```text
IdealTeam
```

5. Dejar el nombre:

```text
mendoza-reviews-api-framer
```

6. Application Preset:

```text
Other
```

7. Root Directory:

```text
./
```

8. Abrir `Environment Variables`.
9. Agregar todas las variables obligatorias.
10. Verificar que todas esten en `Production and Preview`.
11. Dar clic en `Deploy`.

Si el despliegue termina y el dominio base muestra 404, es normal. Probar siempre con:

```text
/api/reviews
/api/sync?secret=TU_CRON_SECRET
```

## 15. Como probar que funciona

Primero ejecutar sincronizacion manual:

```text
https://mendoza-reviews-api-framer-lemon.vercel.app/api/sync?secret=TU_CRON_SECRET
```

Debe responder:

```json
{
  "ok": true,
  "count": 50,
  "updatedAt": "fecha"
}
```

Luego revisar las resenas:

```text
https://mendoza-reviews-api-framer-lemon.vercel.app/api/reviews
```

Debe devolver un JSON con `reviews`.

## 16. Como funciona el codigo

### `api/reviews.js`

Endpoint publico. Framer lo llama para leer resenas.

1. Permite `OPTIONS` para CORS.
2. Solo acepta `GET`.
3. Intenta leer cache desde Vercel Blob.
4. Si no hay cache, consulta Google.
5. Devuelve JSON.

### `api/sync.js`

Endpoint de sincronizacion.

1. Permite `OPTIONS`.
2. Valida `CRON_SECRET` cuando se ejecuta manualmente.
3. Permite ejecucion automatica desde Vercel Cron.
4. Consulta Google.
5. Guarda cache si Vercel Blob esta activo.
6. Devuelve cantidad de resenas sincronizadas.

### `lib/google.js`

Contiene la logica principal de Google.

1. Usa el refresh token para pedir un access token temporal.
2. Consulta `mybusiness.googleapis.com`.
3. Ordena por `updateTime desc`.
4. Pide `pageSize=50`.
5. Filtra comentarios vacios.
6. Normaliza los campos para Framer.
7. Devuelve maximo 50 resenas.

### `lib/cache.js`

Maneja cache opcional con Vercel Blob.

Si `BLOB_READ_WRITE_TOKEN` no existe, no falla. La API simplemente consulta Google directamente.

### `lib/http.js`

Centraliza respuestas JSON y encabezados CORS.

## 17. Limite actual de resenas

El proyecto esta configurado para devolver maximo:

```text
50 resenas
```

Esto se controla en `lib/google.js`:

```js
const MAX_REVIEWS = 50;
```

Tambien se pide a Google:

```text
pageSize=50
orderBy=updateTime desc
```

Por eso el sitio trabaja con las ultimas 50 resenas con comentario.

## 18. Como conectar con Framer

En Framer se debe crear un componente o seccion de testimonios que haga fetch a:

```text
https://mendoza-reviews-api-framer-lemon.vercel.app/api/reviews
```

Campos disponibles por resena:

```text
id
authorName
authorPhoto
rating
text
date
source
```

El diseno visual no lo decide esta API. El diseno debe construirse en Framer siguiendo el Figma, usando estos datos.

## 19. Que hacer al crear otra pagina similar

La recomendacion del usuario fue trabajar proyectos independientes por cada web. Para otra pagina se debe:

1. Crear un repositorio nuevo.
2. Copiar este proyecto.
3. Cambiar el nombre del proyecto.
4. Crear un proyecto nuevo en Vercel.
5. Agregar variables de entorno propias.
6. Cambiar `GBP_LOCATION_NAME` por la ubicacion de la ficha correcta.
7. Cambiar `CRON_SECRET`.
8. Cambiar `ALLOWED_ORIGIN` al dominio de la nueva web.

Si la nueva ficha de Google esta en la misma cuenta `santiago@idealteamcolombia.com`, normalmente se puede reutilizar el mismo `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REFRESH_TOKEN`, siempre que el token tenga permisos sobre esa cuenta.

Si la nueva ficha esta en otra cuenta de Google, se debe generar un refresh token nuevo con esa cuenta.

Si se activa Vercel Blob y se usa el mismo proyecto para varias ubicaciones, se debe cambiar el nombre del archivo cacheado para no mezclar resenas. En este proyecto independiente no hay problema porque solo guarda Mendoza.

## 20. Solucion de problemas

### El dominio base muestra 404

Es normal. Este proyecto no tiene homepage. Probar `/api/reviews`.

### `/api/sync` devuelve 401

El `secret` no coincide con `CRON_SECRET`.

### `/api/sync` devuelve 500

Revisar Vercel Logs. Causas comunes:

1. Falta una variable de entorno.
2. El refresh token esta vencido o revocado.
3. El client secret no corresponde al client ID.
4. `GBP_LOCATION_NAME` esta mal.
5. Google API no esta habilitada.

### Error `invalid_grant`

Significa que el refresh token no sirve para ese cliente OAuth o fue revocado. Hay que generar otro refresh token desde OAuth Playground.

### Error `Missing environment variable`

Falta una variable en Vercel. Agregarla en `Settings -> Environment Variables` y redeploy.

### Git dice `Repository not found`

Puede ser falta de permisos. Verificar que la cuenta que hace push sea colaboradora del repo.

### Git dice `dubious ownership`

Ejecutar:

```powershell
git config --global --add safe.directory "C:/Users/eliza/Documents/Codex/2026-07-28/es/outputs/mendoza-vercel-reviews"
```

## 21. Reglas de seguridad

1. No subir secretos a GitHub.
2. No pegar secrets en README ni guias publicas.
3. No subir `.env`.
4. No subir `VERCEL_ENVIRONMENT_VARIABLES_MENDOZA.md`.
5. Si un secreto se expone, rotarlo.
6. Mantener `GOOGLE_REFRESH_TOKEN` solo en Vercel y respaldos locales privados.

## 22. Convencion de commits

El usuario pidio que los commits queden:

```text
En espanol
Solo texto
Sin emojis
```

Ejemplos correctos:

```text
Documentar proyecto y comentar codigo en espanol
Corregir configuracion de Vercel
Limitar resenas a cincuenta
```

## 23. Estado actual esperado

El estado correcto del proyecto es:

1. GitHub contiene el codigo y documentacion sin secretos.
2. Vercel contiene las variables reales.
3. `/api/sync?secret=...` devuelve `ok: true`.
4. `/api/reviews` devuelve hasta 50 resenas.
5. Framer consume `/api/reviews`.
6. El diseno de Framer se arma siguiendo Figma.

## 24. Recordatorio para otra IA

Si otra IA revisa este proyecto, debe saber:

1. No es una web completa; es una API serverless para Framer.
2. La ruta raiz 404 no es un error del proyecto.
3. Los secretos reales no estan en GitHub por seguridad.
4. Las resenas vienen de Google Business Profile, no de Places API basico.
5. El refresh token se obtuvo con OAuth Playground y la cuenta `santiago@idealteamcolombia.com`.
6. El endpoint que Framer debe consumir es `/api/reviews`.
7. El endpoint que actualiza datos es `/api/sync`.
8. El limite actual es de 50 resenas.
9. Todo cambio debe mantener commits en espanol y solo texto.
