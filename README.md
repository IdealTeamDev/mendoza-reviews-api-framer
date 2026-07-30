# Mendoza Reviews API para Framer

API automatica para sincronizar las ultimas resenas de Google Business Profile de Mendoza Plastic Surgery y mostrarlas en Framer sin depender de WordPress, Wally, Elfsight ni plugins con marca.

Flujo general:

```text
Google Business Profile API -> Vercel Cron -> API JSON -> Framer
```

## Endpoints

```text
GET /api/reviews
```

Devuelve las resenas en JSON para consumirlas desde Framer.

```text
GET /api/sync?secret=TU_CRON_SECRET
```

Actualiza manualmente la cache de resenas. Vercel tambien llama este endpoint automaticamente todos los dias segun `vercel.json`.

La ruta raiz `/` no muestra sitio web. Si abre el dominio base y ve `404: NOT_FOUND`, es normal: este proyecto es solo una API.

## Variables de entorno

Las variables reales se configuran en Vercel, no se suben a GitHub:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN
GBP_LOCATION_NAME
CRON_SECRET
ALLOWED_ORIGIN
```

Opcional:

```text
BLOB_READ_WRITE_TOKEN
```

Consulte la guia completa en [GUIA_DEL_PROYECTO.md](./GUIA_DEL_PROYECTO.md).
