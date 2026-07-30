# Mendoza Reviews en Vercel

Este proyecto elimina WordPress/Wally/Elfsight y usa:

```text
Google Business Profile API -> Vercel Cron -> /api/reviews -> Framer
```

## Variables de entorno

En Vercel agrega:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN
GBP_LOCATION_NAME
CRON_SECRET
ALLOWED_ORIGIN
BLOB_READ_WRITE_TOKEN
```

`BLOB_READ_WRITE_TOKEN` se crea activando Vercel Blob Storage en el proyecto.

## Endpoints

```text
/api/reviews
```

Devuelve reseñas para Framer.

```text
/api/sync
```

Actualiza reseñas desde Google. Vercel Cron lo llama diario.

Para probar manualmente:

```text
https://tu-proyecto.vercel.app/api/sync?secret=TU_CRON_SECRET
```

## Notas

Esta integración usa Google Business Profile API, no Google Places básico.
Necesita OAuth y un `refresh_token` con scope:

```text
https://www.googleapis.com/auth/business.manage
```

