import { useEffect, useMemo, useState } from 'react'

type WeatherForecast = {
  date: string
  temperatureC: number
  temperatureF: number
  summary?: string | null
}

const API_BASE = 'http://localhost:5293'

export default function App() {
  const [data, setData] = useState<WeatherForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (!loggedIn) return
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`${API_BASE}/weatherforecast`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<WeatherForecast[]>
      })
      .then((json) => {
        if (cancelled) return
        setData(json)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const averageC = useMemo(() => {
    if (data.length === 0) return null
    const sum = data.reduce((acc, d) => acc + d.temperatureC, 0)
    return Math.round(sum / data.length)
  }, [data])

  if (!loggedIn) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(160deg, #f5f3ff 0%, #eef2ff 45%, #f0f9ff 100%)',
          color: '#0f172a',
          fontFamily:
            '"Raleway", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            background: 'white',
            borderRadius: 16,
            padding: 24,
            border: '1px solid #e2e8f0',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
          }}
        >
          <h2 style={{ margin: '0 0 8px' }}>Iniciar sesion</h2>
          <p style={{ margin: '0 0 20px', color: '#475569' }}>
            Ingresa tu email y contraseña para continuar.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              setLoggedIn(true)
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                }}
              />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                Contraseña
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: '1px solid #e2e8f0',
                  fontSize: 14,
                }}
              />
            </label>
            <button
              type="submit"
              style={{
                marginTop: 8,
                padding: '10px 12px',
                borderRadius: 10,
                border: 'none',
                background: '#4f46e5',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Loguearse
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(160deg, #f5f3ff 0%, #eef2ff 45%, #f0f9ff 100%)',
        color: '#0f172a',
        fontFamily:
          '"Raleway", system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        padding: 32,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
        }}
      >
        <aside
          style={{
            width: 220,
            background: 'white',
            borderRadius: 16,
            padding: 20,
            border: '1px solid #e2e8f0',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.06)',
          }}
        >
          <div
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              fontSize: 11,
              color: '#4f46e5',
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Menu
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['Usuario', 'Temperatura Actual', 'Login'].map((label) => (
              <div
                key={label}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontWeight: 600,
                  color: '#0f172a',
                }}
              >
                {label}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLoggedIn(false)}
              style={{
                marginTop: 8,
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#fff1f2',
                color: '#be123c',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Desloguearse
            </button>
          </nav>
        </aside>

        <div style={{ flex: 1, minWidth: 0 }}>
          <header style={{ marginBottom: 24 }}>
            <p
              style={{
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                fontSize: 12,
                color: '#4f46e5',
                margin: 0,
                fontWeight: 700,
              }}
            >
              Weather API
            </p>
            <h1 style={{ margin: '8px 0 4px', fontSize: 36 }}>
              Pronostico semanal
            </h1>
            <p style={{ margin: 0, color: '#475569' }}>
              Consumido desde la Web API de .NET.
            </p>
          </header>

          <section
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
              border: '1px solid #e2e8f0',
            }}
          >
            {loading && <p>Cargando datos...</p>}
            {error && (
              <div
                style={{
                  background: '#fee2e2',
                  color: '#991b1b',
                  padding: 12,
                  borderRadius: 10,
                  marginBottom: 16,
                }}
              >
                Error al cargar: {error}
              </div>
            )}

            {!loading && !error && data.length === 0 && (
              <p>No hay datos para mostrar.</p>
            )}

            {!loading && !error && data.length > 0 && (
              <>
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    flexWrap: 'wrap',
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      background: '#eef2ff',
                      padding: 16,
                      borderRadius: 12,
                      minWidth: 180,
                      flex: '1 1 180px',
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#4338ca' }}>
                      Promedio (C)
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>
                      {averageC ?? '-'}°
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#e0f2fe',
                      padding: 16,
                      borderRadius: 12,
                      minWidth: 180,
                      flex: '1 1 180px',
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#0369a1' }}>
                      Dias listados
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>
                      {data.length}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16,
                  }}
                >
                  {data.map((item) => (
                    <article
                      key={item.date}
                      style={{
                        background: '#f8fafc',
                        borderRadius: 14,
                        padding: 16,
                        border: '1px solid #e2e8f0',
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {new Date(item.date).toLocaleDateString('es-AR', {
                          weekday: 'long',
                          day: '2-digit',
                          month: 'short',
                        })}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {item.summary ?? 'Sin resumen'}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          marginTop: 12,
                          alignItems: 'baseline',
                        }}
                      >
                        <div style={{ fontSize: 22, fontWeight: 700 }}>
                          {item.temperatureC}°C
                        </div>
                        <div style={{ fontSize: 14, color: '#475569' }}>
                          {item.temperatureF}°F
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
