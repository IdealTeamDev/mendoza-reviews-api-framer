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

## Cache y Optimizacion de Rendimiento (Edge Caching)

Para evitar consumo excesivo de operaciones, sobrecostos de transferencia de datos y lentitud por intermitencia de la API de Google, el proyecto implementa una arquitectura de caché en el borde (**Vercel Edge Cache / CDN**):

- **Caché CDN de 7 días**: Las respuestas de `/api/reviews` se sirven con la cabecera `Cache-Control: public, s-maxage=604800, stale-while-revalidate=2592000`.
- **Entrega instantánea**: Vercel CDN entrega las reseñas en milisegundos desde la red global de servidores sin invocar la función serverless en cada visita.
- **Revalidación automática en segundo plano**: Las reseñas se actualizan de forma transparente cada 7 días sin bloquear a los usuarios ni exceder cuotas de Vercel.
- **Límite optimizado**: Se procesan y devuelven un máximo de **30 reseñas** con comentario.
- **Tolerancia a fallos**: El backend maneja excepciones de forma segura en caso de caídas o suspensiones de servicios externos.

## Variables de entorno

Las variables requeridas se configuran en Vercel (no se suben al repositorio):

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REFRESH_TOKEN
GBP_LOCATION_NAME
CRON_SECRET
ALLOWED_ORIGIN
```

## Componente de Framer

El archivo `framer/TestimoniosGoogle.tsx` contiene el componente de codigo para Framer.

Ese componente solo muestra el carrusel de testimonios:

```text
Tarjetas de resenas -> flechas del carrusel -> datos desde /api/reviews
```

No incluye el bloque manual de Figma con `TESTIMONIALS`, estadisticas, boton, fondos ni comillas decorativas. Esos elementos se deben armar directamente en Framer para mantener el diseno igual al Figma.

Para usarlo en Framer:

1. Abrir Framer.
2. Ir a `Assets -> Code`.
3. Crear o abrir el archivo `GoogleTestimonials.tsx` o `TestimoniosGoogle.tsx`.
4. Copiar el contenido de `framer/TestimoniosGoogle.tsx`.
5. Guardar con `Ctrl + S`.
6. Insertar el componente en la zona del carrusel.

El componente consume por defecto:

```text
https://mendoza-reviews-api-framer-lemon.vercel.app/api/reviews
```

En escritorio muestra 2 tarjetas. En movil muestra 1 tarjeta para parecerse al diseno de Figma.

Consulte la guia completa en [GUIA_DEL_PROYECTO.md](./GUIA_DEL_PROYECTO.md).
