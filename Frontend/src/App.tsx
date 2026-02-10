import { useEffect, useState } from 'react'

type CurrentWeather = {
  temperatureC: number
  temperatureF: number
}

type DailyForecast = {
  date: string
  tempMin: number
  tempMax: number
  weatherType: 'sunny' | 'cloudy' | 'rainy' | 'thunder'
}

type WeeklyForecast = {
  days: DailyForecast[]
}

const WEATHER_ICONS: Record<DailyForecast['weatherType'], string> = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
  thunder: '⛈️',
}

const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const

type Location = { id: string; name: string; lat: number; lon: number; timezone: string }
const ARGENTINE_LOCATIONS: Location[] = [
  { id: 'caba', name: 'Buenos Aires (CABA)', lat: -34.61315, lon: -58.37723, timezone: 'America/Argentina/Buenos_Aires' },
  { id: 'la-plata', name: 'La Plata', lat: -34.92145, lon: -57.95453, timezone: 'America/Argentina/Buenos_Aires' },
  { id: 'mar-del-plata', name: 'Mar del Plata', lat: -38.00548, lon: -57.54261, timezone: 'America/Argentina/Buenos_Aires' },
  { id: 'bahia-blanca', name: 'Bahía Blanca', lat: -38.71959, lon: -62.27243, timezone: 'America/Argentina/Buenos_Aires' },
  { id: 'cordoba', name: 'Córdoba', lat: -31.42008, lon: -64.18878, timezone: 'America/Argentina/Cordoba' },
  { id: 'mendoza', name: 'Mendoza', lat: -32.88946, lon: -68.84584, timezone: 'America/Argentina/Mendoza' },
  { id: 'rosario', name: 'Rosario', lat: -32.94682, lon: -60.63932, timezone: 'America/Argentina/Cordoba' },
  { id: 'santa-fe', name: 'Santa Fe', lat: -31.64881, lon: -60.70868, timezone: 'America/Argentina/Cordoba' },
  { id: 'parana', name: 'Paraná', lat: -31.73271, lon: -60.52897, timezone: 'America/Argentina/Cordoba' },
  { id: 'tucuman', name: 'San Miguel de Tucumán', lat: -26.80829, lon: -65.21759, timezone: 'America/Argentina/Tucuman' },
  { id: 'salta', name: 'Salta', lat: -24.78590, lon: -65.41166, timezone: 'America/Argentina/Salta' },
  { id: 'jujuy', name: 'San Salvador de Jujuy', lat: -24.19457, lon: -65.29712, timezone: 'America/Argentina/Jujuy' },
  { id: 'neuquen', name: 'Neuquén', lat: -38.95161, lon: -68.05910, timezone: 'America/Argentina/Salta' },
  { id: 'corrientes', name: 'Corrientes', lat: -27.48060, lon: -58.83410, timezone: 'America/Argentina/Cordoba' },
  { id: 'resistencia', name: 'Resistencia', lat: -27.46056, lon: -58.98389, timezone: 'America/Argentina/Cordoba' },
  { id: 'posadas', name: 'Posadas', lat: -27.36708, lon: -55.89608, timezone: 'America/Argentina/Cordoba' },
  { id: 'formosa', name: 'Formosa', lat: -26.18489, lon: -58.17313, timezone: 'America/Argentina/Cordoba' },
  { id: 'san-juan', name: 'San Juan', lat: -31.53750, lon: -68.53639, timezone: 'America/Argentina/San_Juan' },
  { id: 'san-luis', name: 'San Luis', lat: -33.29501, lon: -66.33563, timezone: 'America/Argentina/San_Luis' },
  { id: 'santiago-estero', name: 'Santiago del Estero', lat: -27.79511, lon: -64.26149, timezone: 'America/Argentina/Cordoba' },
  { id: 'catamarca', name: 'San Fernando del Valle de Catamarca', lat: -28.46957, lon: -65.78524, timezone: 'America/Argentina/Catamarca' },
  { id: 'la-rioja', name: 'La Rioja', lat: -29.41105, lon: -66.85067, timezone: 'America/Argentina/La_Rioja' },
  { id: 'ushuaia', name: 'Ushuaia', lat: -54.81084, lon: -68.31591, timezone: 'America/Argentina/Ushuaia' },
  { id: 'rio-gallegos', name: 'Río Gallegos', lat: -51.62261, lon: -69.21813, timezone: 'America/Argentina/Rio_Gallegos' },
  { id: 'rawson', name: 'Rawson (Chubut)', lat: -43.30016, lon: -65.10228, timezone: 'America/Argentina/Catamarca' },
]

const API_BASE =
  import.meta.env.VITE_API_URL ??
  (typeof window !== 'undefined' && window.location.hostname.includes('railway.app')
    ? 'https://optimistic-benevolence-production-ce0f.up.railway.app'
    : 'http://localhost:5293')

export default function App() {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [currentSection, setCurrentSection] = useState<'usuario' | 'temperatura' | 'clima-semanal'>('temperatura')
  const [weeklyForecast, setWeeklyForecast] = useState<WeeklyForecast | null>(null)
  const [weeklyLoading, setWeeklyLoading] = useState(false)
  const [weeklyError, setWeeklyError] = useState<string | null>(null)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [registerNombre, setRegisterNombre] = useState('')
  const [registerApellido, setRegisterApellido] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerPais, setRegisterPais] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location>(ARGENTINE_LOCATIONS[0])

  useEffect(() => {
    if (!loggedIn) {
      setCurrentWeather(null)
      setWeeklyForecast(null)
      setLoading(false)
      setError(null)
      setWeeklyLoading(false)
      setWeeklyError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ lat: String(selectedLocation.lat), lon: String(selectedLocation.lon) })
    fetch(`${API_BASE}/weatherforecast?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<CurrentWeather>
      })
      .then((json) => {
        if (cancelled) return
        setCurrentWeather(json)
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
  }, [loggedIn, selectedLocation.id])

  useEffect(() => {
    if (!loggedIn || currentSection !== 'clima-semanal') return

    let cancelled = false
    setWeeklyLoading(true)
    setWeeklyError(null)

    const params = new URLSearchParams({
      lat: String(selectedLocation.lat),
      lon: String(selectedLocation.lon),
      tz: selectedLocation.timezone,
    })
    fetch(`${API_BASE}/weatherforecast/weekly?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<{ days: DailyForecast[] }>
      })
      .then((json) => {
        if (cancelled) return
        setWeeklyForecast({ days: json.days })
        setWeeklyLoading(false)
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setWeeklyError(err instanceof Error ? err.message : 'Unknown error')
        setWeeklyLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [loggedIn, currentSection, selectedLocation.id])

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
          {loginError && (
            <div
              style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: 12,
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              {loginError}
            </div>
          )}
          <form
            onSubmit={async (event) => {
              event.preventDefault()
              setLoginError(null)
              setLoginLoading(true)
              try {
                const res = await fetch(`${API_BASE}/api/usuarios/login`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ Email: email, Password: password }),
                })
                if (!res.ok) {
                  setLoginError('Tu usuario no existe')
                  setLoginLoading(false)
                  return
                }
                setLoggedIn(true)
              } catch {
                setLoginError('Error de conexión')
              } finally {
                setLoginLoading(false)
              }
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
              disabled={loginLoading}
              style={{
                marginTop: 8,
                padding: '10px 12px',
                borderRadius: 10,
                border: 'none',
                background: loginLoading ? '#a5b4fc' : '#4f46e5',
                color: 'white',
                fontWeight: 600,
                cursor: loginLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {loginLoading ? 'Verificando...' : 'Loguearse'}
            </button>
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                border: 'none',
                background: '#4f46e5',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Registrarse
            </button>
          </form>
        </div>

        {showRegisterModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              boxSizing: 'border-box',
              zIndex: 1000,
            }}
            onClick={() => setShowRegisterModal(false)}
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
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ margin: '0 0 8px' }}>Registrarse</h2>
              <p style={{ margin: '0 0 20px', color: '#475569' }}>
                Completa tus datos para crear una cuenta.
              </p>
              {registerError && (
                <div
                  style={{
                    background: '#fee2e2',
                    color: '#991b1b',
                    padding: 12,
                    borderRadius: 10,
                    marginBottom: 16,
                  }}
                >
                  {registerError}
                </div>
              )}
              <form
                onSubmit={async (event) => {
                  event.preventDefault()
                  setRegisterError(null)
                  setRegisterLoading(true)
                  try {
                    const res = await fetch(`${API_BASE}/api/usuarios/registrar`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        Nombre: registerNombre,
                        Apellido: registerApellido,
                        Email: registerEmail,
                        Password: registerPassword,
                        Pais: registerPais,
                      }),
                    })
                    const data = await res.json().catch(() => ({}))
                    if (!res.ok) {
                      setRegisterError(data.message ?? `Error ${res.status}`)
                      return
                    }
                    setShowRegisterModal(false)
                    setRegisterNombre('')
                    setRegisterApellido('')
                    setRegisterEmail('')
                    setRegisterPassword('')
                    setRegisterPais('')
                  } catch (err) {
                    setRegisterError(err instanceof Error ? err.message : 'Error de conexión')
                  } finally {
                    setRegisterLoading(false)
                  }
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Nombre</span>
                  <input
                    type="text"
                    required
                    value={registerNombre}
                    onChange={(e) => setRegisterNombre(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      fontSize: 14,
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Apellido</span>
                  <input
                    type="text"
                    required
                    value={registerApellido}
                    onChange={(e) => setRegisterApellido(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      fontSize: 14,
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Email</span>
                  <input
                    type="email"
                    required
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      fontSize: 14,
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>Contraseña</span>
                  <input
                    type="password"
                    required
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      fontSize: 14,
                    }}
                  />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>País</span>
                  <input
                    type="text"
                    required
                    value={registerPais}
                    onChange={(e) => setRegisterPais(e.target.value)}
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
                  disabled={registerLoading}
                  style={{
                    marginTop: 8,
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: 'none',
                    background: registerLoading ? '#a5b4fc' : '#4f46e5',
                    color: 'white',
                    fontWeight: 600,
                    cursor: registerLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {registerLoading ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>
            </div>
          </div>
        )}
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
            {[
              { id: 'usuario' as const, label: 'Usuario' },
              { id: 'temperatura' as const, label: 'Temperatura Actual' },
              { id: 'clima-semanal' as const, label: 'Clima Semanal' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setCurrentSection(id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: currentSection === id ? '#eef2ff' : '#f8fafc',
                  border: `1px solid ${currentSection === id ? '#4f46e5' : '#e2e8f0'}`,
                  fontWeight: 600,
                  color: currentSection === id ? '#4f46e5' : '#0f172a',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {label}
              </button>
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
          {currentSection === 'usuario' ? (
            <section
              style={{
                background: 'white',
                borderRadius: 16,
                padding: 24,
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
                border: '1px solid #e2e8f0',
              }}
            >
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
                  Mi cuenta
                </p>
                <h1 style={{ margin: '8px 0 4px', fontSize: 36 }}>
                  Datos del usuario
                </h1>
                <p style={{ margin: 0, color: '#475569' }}>
                  Información de la sesión actual.
                </p>
              </header>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                  maxWidth: 480,
                }}
              >
                <div
                  style={{
                    background: '#f8fafc',
                    padding: 20,
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: '#64748b',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Email
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600 }}>
                    {email || '(No ingresado)'}
                  </div>
                </div>
                <div
                  style={{
                    background: '#f8fafc',
                    padding: 20,
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: '#64748b',
                      marginBottom: 6,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    Contraseña
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      letterSpacing: 4,
                    }}
                  >
                    {password ? '••••••••••' : '(No ingresada)'}
                  </div>
                </div>
              </div>
            </section>
          ) : currentSection === 'clima-semanal' ? (
            <>
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
                  Open-Meteo
                </p>
                <h1 style={{ margin: '8px 0 4px', fontSize: 36 }}>
                  Clima Semanal
                </h1>
                <p style={{ margin: 0, color: '#475569' }}>
                  Pronóstico de 7 días con mínima, máxima e iconos.
                </p>
                <div style={{ marginTop: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                    Ubicación
                  </label>
                  <select
                    value={selectedLocation.id}
                    onChange={(e) => {
                      const loc = ARGENTINE_LOCATIONS.find((l) => l.id === e.target.value)
                      if (loc) setSelectedLocation(loc)
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      fontSize: 14,
                      minWidth: 280,
                      background: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    {ARGENTINE_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                {weeklyLoading && <p>Cargando pronóstico...</p>}
                {weeklyError && (
                  <div
                    style={{
                      background: '#fee2e2',
                      color: '#991b1b',
                      padding: 12,
                      borderRadius: 10,
                      marginBottom: 16,
                    }}
                  >
                    Error al cargar: {weeklyError}
                  </div>
                )}
                {!weeklyLoading && !weeklyError && weeklyForecast && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                      gap: 16,
                    }}
                  >
                    {weeklyForecast.days.map((day) => {
                      const weekday = WEEKDAY_NAMES[new Date(day.date + 'T12:00:00').getDay()]
                      const weatherType = day.weatherType as DailyForecast['weatherType']
                      return (
                        <article
                          key={day.date}
                          style={{
                            background: '#f8fafc',
                            borderRadius: 14,
                            padding: 16,
                            border: '1px solid #e2e8f0',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>
                            {weekday}
                          </div>
                          <div style={{ fontSize: 32, marginBottom: 12 }}>
                            {WEATHER_ICONS[weatherType] ?? '☁️'}
                          </div>
                          <div style={{ fontSize: 13, color: '#64748b' }}>
                            <span style={{ color: '#0ea5e9' }}>Máx {Math.round(day.tempMax)}°</span>
                            {' · '}
                            <span style={{ color: '#64748b' }}>Mín {Math.round(day.tempMin)}°</span>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          ) : (
            <>
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
                  Open-Meteo
                </p>
                <h1 style={{ margin: '8px 0 4px', fontSize: 36 }}>
                  Temperatura Actual
                </h1>
                <p style={{ margin: 0, color: '#475569' }}>
                  Temperatura de hoy en tiempo real.
                </p>
                <div style={{ marginTop: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                    Ubicación
                  </label>
                  <select
                    value={selectedLocation.id}
                    onChange={(e) => {
                      const loc = ARGENTINE_LOCATIONS.find((l) => l.id === e.target.value)
                      if (loc) setSelectedLocation(loc)
                    }}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      fontSize: 14,
                      minWidth: 280,
                      background: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    {ARGENTINE_LOCATIONS.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
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

            {!loading && !error && !currentWeather && (
              <p>No hay datos para mostrar.</p>
            )}

            {!loading && !error && currentWeather && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%)',
                  padding: 32,
                  borderRadius: 16,
                  textAlign: 'center',
                  maxWidth: 320,
                }}
              >
                <div style={{ fontSize: 14, color: '#4338ca', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Hoy
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    justifyContent: 'center',
                    alignItems: 'baseline',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: 48, fontWeight: 700 }}>
                    {Math.round(currentWeather.temperatureC)}°C
                  </span>
                  <span style={{ fontSize: 20, color: '#475569' }}>
                    {currentWeather.temperatureF}°F
                  </span>
                </div>
              </div>
            )}
          </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
