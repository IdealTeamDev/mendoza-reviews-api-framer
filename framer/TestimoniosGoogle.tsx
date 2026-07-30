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
    autoPlay: boolean
    intervaloSegundos: number
    tarjetasEscritorio: number
    tarjetasMovil: number
    modoVista: "auto" | "movil" | "escritorio"
}

const URL_POR_DEFECTO =
    "https://mendoza-reviews-api-framer-lemon.vercel.app/api/reviews"

// Componente principal de testimonios para Framer
export default function TestimoniosGoogle({
    apiUrl = URL_POR_DEFECTO,
    autoPlay = true,
    intervaloSegundos = 4.5,
    tarjetasEscritorio = 2,
    tarjetasMovil = 1,
    modoVista = "auto",
}: Props) {
    const [resenas, setResenas] = React.useState<ResenaGoogle[]>([])
    const [indiceActual, setIndiceActual] = React.useState(0)
    const [cargando, setCargando] = React.useState(true)
    const [anchoContenedor, setAnchoContenedor] = React.useState<number>(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth
        }
        return 800
    })
    const [pausadoPorInteraccion, setPausadoPorInteraccion] =
        React.useState(false)
    const temporizadorReanudar = React.useRef<number | null>(null)
    const interaccionActiva = React.useRef(false)
    const contenedorRef = React.useRef<HTMLElement | null>(null)

    const limpiarTemporizadorReanudar = React.useCallback(() => {
        if (temporizadorReanudar.current !== null) {
            window.clearTimeout(temporizadorReanudar.current)
            temporizadorReanudar.current = null
        }
    }, [])

    // El carrusel se pausa mientras el usuario interactúa (hover, touch, click, foco)
    const pausarCarrusel = React.useCallback(() => {
        interaccionActiva.current = true
        setPausadoPorInteraccion(true)
        limpiarTemporizadorReanudar()
    }, [limpiarTemporizadorReanudar])

    // Se reanuda automáticamente tras soltar o quitar el cursor
    const reanudarCarruselDespues = React.useCallback(() => {
        interaccionActiva.current = false
        limpiarTemporizadorReanudar()

        temporizadorReanudar.current = window.setTimeout(() => {
            if (!interaccionActiva.current) {
                setPausadoPorInteraccion(false)
            }
            temporizadorReanudar.current = null
        }, 3000)
    }, [limpiarTemporizadorReanudar])

    // Detectar dinámicamente el ancho del contenedor (en lienzo Framer) y la ventana (en móvil real)
    React.useEffect(() => {
        const elemento = contenedorRef.current

        const actualizarTamanoWindow = () => {
            if (typeof window !== "undefined") {
                setAnchoContenedor((prev) => Math.min(prev, window.innerWidth))
            }
        }

        window.addEventListener("resize", actualizarTamanoWindow)

        if (!elemento) return

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                if (entry.contentRect && entry.contentRect.width > 0) {
                    setAnchoContenedor(entry.contentRect.width)
                }
            }
        })

        observer.observe(elemento)

        return () => {
            observer.disconnect()
            window.removeEventListener("resize", actualizarTamanoWindow)
        }
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
                console.error("No se pudieron cargar las reseñas de Google", error)

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

    React.useEffect(() => {
        return () => limpiarTemporizadorReanudar()
    }, [limpiarTemporizadorReanudar])

    // Determinación de modo móvil (Automático < 650px o forzado desde el panel de Framer)
    const esMovilCalculado =
        anchoContenedor < 650 ||
        (typeof window !== "undefined" && window.innerWidth < 768)

    const esMovil =
        modoVista === "movil"
            ? true
            : modoVista === "escritorio"
            ? false
            : esMovilCalculado

    const cantidadVisible = esMovil ? Math.max(1, tarjetasMovil) : Math.max(1, tarjetasEscritorio)
    const puedeMoverse = resenas.length > cantidadVisible

    // Avance automático continuo que reinicia cíclicamente al llegar al final de la lista
    React.useEffect(() => {
        if (!autoPlay || !puedeMoverse || pausadoPorInteraccion || resenas.length === 0) {
            return
        }

        const ms = Math.max(1500, intervaloSegundos * 1000)
        const intervalo = window.setInterval(() => {
            setIndiceActual((valorActual) => {
                return (valorActual + 1) % resenas.length
            })
        }, ms)

        return () => window.clearInterval(intervalo)
    }, [autoPlay, intervaloSegundos, pausadoPorInteraccion, puedeMoverse, resenas.length])

    const resenasVisibles = React.useMemo(() => {
        if (resenas.length === 0) return []

        return Array.from({ length: Math.min(cantidadVisible, resenas.length) }, (_, i) => {
            const indice = (indiceActual + i) % resenas.length
            return resenas[indice]
        })
    }, [cantidadVisible, indiceActual, resenas])

    function cambiarResena(direccion: number) {
        if (!puedeMoverse) return

        pausarCarrusel()

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
        <section
            ref={contenedorRef}
            style={estilos.contenedor}
            onMouseEnter={pausarCarrusel}
            onMouseLeave={reanudarCarruselDespues}
            onTouchStart={pausarCarrusel}
            onTouchEnd={reanudarCarruselDespues}
            onPointerDown={pausarCarrusel}
            onPointerUp={reanudarCarruselDespues}
            onFocus={pausarCarrusel}
            onBlur={reanudarCarruselDespues}
        >
            <div
                style={{
                    ...estilos.lista,
                    gridTemplateColumns: esMovil
                        ? `repeat(${tarjetasMovil}, minmax(0, 1fr))`
                        : `repeat(${tarjetasEscritorio}, minmax(0, 1fr))`,
                }}
            >
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
                                    <div
                                        style={{
                                            ...estilos.avatarTexto,
                                            backgroundColor: obtenerColorAvatar(resena.authorName),
                                        }}
                                    >
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

                            {/* Logo oficial de Google en 4 colores */}
                            <LogoGoogleSvg />
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

function LogoGoogleSvg() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
            />
        </svg>
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

function obtenerColorAvatar(nombre: string = ""): string {
    const colores = ["#59983b", "#6a828e", "#e07a5f", "#3d405b", "#81b29a", "#f2cc8f"]
    let hash = 0
    for (let i = 0; i < nombre.length; i++) {
        hash = nombre.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colores[Math.abs(hash) % colores.length]
}

const estilos: Record<string, React.CSSProperties> = {
    contenedor: {
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        background: "transparent",
        position: "relative",
        overflow: "visible",
        padding: "10px 10px 36px",
    },
    lista: {
        display: "grid",
        gap: 24,
        alignItems: "stretch",
        width: "100%",
        boxSizing: "border-box",
    },
    tarjeta: {
        minHeight: 200,
        background: "#ffffff",
        borderRadius: 20,
        padding: "24px 28px",
        border: "1px solid rgba(0, 0, 0, 0.04)",
        boxShadow:
            "0 15px 35px -5px rgba(0, 0, 0, 0.08), 0 0 15px rgba(0, 0, 0, 0.03)",
        color: "#111111",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
    },
    encabezado: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 14,
    },
    autor: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 0,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
    },
    avatarTexto: {
        width: 44,
        height: 44,
        borderRadius: "50%",
        color: "#ffffff",
        display: "grid",
        placeItems: "center",
        fontWeight: 700,
        fontSize: 18,
        flexShrink: 0,
    },
    nombre: {
        display: "block",
        fontSize: 15,
        fontWeight: 700,
        lineHeight: 1.2,
        color: "#111111",
    },
    fecha: {
        display: "block",
        marginTop: 3,
        fontSize: 12,
        color: "#888888",
        lineHeight: 1.2,
    },
    estrellas: {
        color: "#fbbc04",
        fontSize: 18,
        lineHeight: 1,
        letterSpacing: 2,
        marginBottom: 14,
    },
    texto: {
        margin: 0,
        fontSize: 14,
        lineHeight: 1.5,
        color: "#222222",
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
        width: 36,
        height: 36,
        borderRadius: "50%",
        border: "none",
        background: "#000000",
        color: "#ffffff",
        cursor: "pointer",
        display: "grid",
        placeItems: "center",
        padding: 0,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
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
    autoPlay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },
    intervaloSegundos: {
        type: ControlType.Number,
        title: "Segundos / Review",
        defaultValue: 4.5,
        min: 1,
        max: 20,
        step: 0.5,
    },
    modoVista: {
        type: ControlType.Enum,
        title: "Modo Vista",
        defaultValue: "auto",
        options: ["auto", "movil", "escritorio"],
        optionTitles: ["Automático (Responsive)", "Móvil (1 Tarjeta)", "Escritorio (2 Tarjetas)"],
    },
    tarjetasEscritorio: {
        type: ControlType.Number,
        title: "Tarjetas Escritorio",
        defaultValue: 2,
        min: 1,
        max: 4,
        step: 1,
    },
    tarjetasMovil: {
        type: ControlType.Number,
        title: "Tarjetas Móvil",
        defaultValue: 1,
        min: 1,
        max: 2,
        step: 1,
    },
})



