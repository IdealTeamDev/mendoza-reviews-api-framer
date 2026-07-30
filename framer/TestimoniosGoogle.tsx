import * as React from "react"
import { addPropertyControls, ControlType } from "framer"

type ResenaGoogle = {
    id: string
    authorName: string
    authorPhoto?: string
    rating: number
    text: string
    date?: string
    source?: string
}

type Props = {
    apiUrl: string
}

const URL_POR_DEFECTO =
    "https://mendoza-reviews-api-framer-lemon.vercel.app/api/reviews"

// Este componente solo dibuja el carrusel de tarjetas.
// El titulo, las estadisticas, el boton y el fondo se arman manualmente en Framer.
export default function TestimoniosGoogle({ apiUrl = URL_POR_DEFECTO }: Props) {
    const [resenas, setResenas] = React.useState<ResenaGoogle[]>([])
    const [indiceActual, setIndiceActual] = React.useState(0)
    const [cargando, setCargando] = React.useState(true)
    const [esMovil, setEsMovil] = React.useState(false)

    React.useEffect(() => {
        const actualizarTamano = () => {
            setEsMovil(window.innerWidth < 768)
        }

        actualizarTamano()
        window.addEventListener("resize", actualizarTamano)

        return () => window.removeEventListener("resize", actualizarTamano)
    }, [])

    React.useEffect(() => {
        let componenteActivo = true

        async function cargarResenas() {
            try {
                setCargando(true)

                const respuesta = await fetch(apiUrl)
                const datos = await respuesta.json()

                if (!componenteActivo) return

                setResenas(Array.isArray(datos.reviews) ? datos.reviews : [])
            } catch (error) {
                console.error("No se pudieron cargar las resenas de Google", error)

                if (componenteActivo) {
                    setResenas([])
                }
            } finally {
                if (componenteActivo) {
                    setCargando(false)
                }
            }
        }

        cargarResenas()

        return () => {
            componenteActivo = false
        }
    }, [apiUrl])

    const cantidadVisible = esMovil ? 1 : 2
    const puedeMoverse = resenas.length > cantidadVisible

    const resenasVisibles = React.useMemo(() => {
        if (resenas.length === 0) return []

        return Array.from({ length: Math.min(cantidadVisible, resenas.length) }, (_, i) => {
            const indice = (indiceActual + i) % resenas.length
            return resenas[indice]
        })
    }, [cantidadVisible, indiceActual, resenas])

    function cambiarResena(direccion: number) {
        if (!puedeMoverse) return

        setIndiceActual((valorActual) => {
            return (valorActual + direccion + resenas.length) % resenas.length
        })
    }

    if (cargando) {
        return <div style={estilos.mensaje}>Cargando testimonios...</div>
    }

    if (resenas.length === 0) {
        return <div style={estilos.mensaje}>No hay testimonios disponibles.</div>
    }

    return (
        <section style={estilos.contenedor}>
            <div style={estilos.lista}>
                {resenasVisibles.map((resena) => (
                    <article key={resena.id} style={estilos.tarjeta}>
                        <div style={estilos.encabezado}>
                            <div style={estilos.autor}>
                                {resena.authorPhoto ? (
                                    <img
                                        src={resena.authorPhoto}
                                        alt={resena.authorName}
                                        style={estilos.avatar}
                                    />
                                ) : (
                                    <div style={estilos.avatarTexto}>
                                        {resena.authorName?.charAt(0) || "G"}
                                    </div>
                                )}

                                <div>
                                    <strong style={estilos.nombre}>
                                        {resena.authorName}
                                    </strong>
                                    {resena.date && (
                                        <span style={estilos.fecha}>
                                            {formatearFecha(resena.date)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <span style={estilos.google}>G</span>
                        </div>

                        <div style={estilos.estrellas}>
                            {"\u2605".repeat(Math.round(resena.rating || 5))}
                        </div>

                        <p style={estilos.texto}>{resena.text}</p>
                    </article>
                ))}
            </div>

            {puedeMoverse && (
                <div style={estilos.flechas}>
                    <button
                        type="button"
                        aria-label="Testimonio anterior"
                        style={estilos.flecha}
                        onClick={() => cambiarResena(-1)}
                    >
                        <IconoFlecha direccion="izquierda" />
                    </button>
                    <button
                        type="button"
                        aria-label="Testimonio siguiente"
                        style={estilos.flecha}
                        onClick={() => cambiarResena(1)}
                    >
                        <IconoFlecha direccion="derecha" />
                    </button>
                </div>
            )}
        </section>
    )
}

function IconoFlecha({ direccion }: { direccion: "izquierda" | "derecha" }) {
    const puntos =
        direccion === "izquierda" ? "15 18 9 12 15 6" : "9 18 15 12 9 6"

    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
        >
            <polyline
                points={puntos}
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

function formatearFecha(fecha: string) {
    try {
        return new Intl.DateTimeFormat("es", {
            day: "numeric",
            month: "short",
            year: "numeric",
        }).format(new Date(fecha))
    } catch {
        return fecha
    }
}

const estilos: Record<string, React.CSSProperties> = {
    contenedor: {
        width: "100%",
        background: "transparent",
        position: "relative",
        overflow: "hidden",
        padding: "0 0 36px",
    },
    lista: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 32,
        alignItems: "stretch",
    },
    tarjeta: {
        minHeight: 185,
        background: "#ffffff",
        borderRadius: 8,
        padding: "24px 28px",
        boxShadow: "0 14px 34px rgba(0, 0, 0, 0.16)",
        color: "#111111",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
    },
    encabezado: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 20,
        marginBottom: 14,
    },
    autor: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 0,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
    },
    avatarTexto: {
        width: 38,
        height: 38,
        borderRadius: "50%",
        background: "#7f98a3",
        color: "#ffffff",
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        fontSize: 16,
        flexShrink: 0,
    },
    nombre: {
        display: "block",
        fontSize: 14,
        fontWeight: 700,
        lineHeight: 1.2,
        color: "#111111",
    },
    fecha: {
        display: "block",
        marginTop: 2,
        fontSize: 11,
        color: "#666666",
        lineHeight: 1.2,
    },
    google: {
        fontSize: 18,
        fontWeight: 700,
        color: "#4285f4",
        lineHeight: 1,
    },
    estrellas: {
        color: "#fbbc04",
        fontSize: 18,
        lineHeight: 1,
        letterSpacing: 1,
        marginBottom: 12,
    },
    texto: {
        margin: 0,
        fontSize: 14,
        lineHeight: 1.45,
        color: "#111111",
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 6,
        overflow: "hidden",
    } as React.CSSProperties,
    flechas: {
        display: "flex",
        gap: 10,
        marginTop: 22,
    },
    flecha: {
        width: 32,
        height: 32,
        borderRadius: "50%",
        border: "none",
        background: "#000000",
        color: "#ffffff",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        padding: 0,
        boxShadow: "0 8px 18px rgba(0, 0, 0, 0.18)",
    },
    mensaje: {
        width: "100%",
        minHeight: 120,
        display: "grid",
        placeItems: "center",
        color: "#666666",
        fontSize: 14,
        background: "transparent",
    },
}

addPropertyControls(TestimoniosGoogle, {
    apiUrl: {
        type: ControlType.String,
        title: "URL de API",
        defaultValue: URL_POR_DEFECTO,
    },
})
