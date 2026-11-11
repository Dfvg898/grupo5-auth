
import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import './App.css'

function App() {
  const [sesion, setSesion] = useState(null)
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [responsable, setResponsable] = useState('')
  const [estado, setEstado] = useState('pendiente')
  const [tareas, setTareas] = useState([])
  const [filtro, setFiltro] = useState('Todas')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session)
    })

    const { data } = supabase.auth.onAuthStateChange(
      (_evento, session) => {
        setSesion(session)
      }
    )

    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (sesion) {
      setResponsable(sesion.user.email || '')
      cargarTareas()
    } else {
      setTareas([])
    }
  }, [sesion])

  async function iniciarSesion(e) {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({
      email: correo,
      password: contrasena
    })

    if (error) {
      setMensaje('Error: ' + error.message)
    } else {
      setMensaje('')
    }
  }

  async function cerrarSesion() {
  setMensaje('')

  const { error } = await supabase.auth.signOut()

  if (error) {
    setMensaje('Error al cerrar sesión: ' + error.message)
  }
}

  async function cargarTareas() {
    const { data, error } = await supabase
      .from('tareas')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      setMensaje('Error al cargar tareas: ' + error.message)
    } else {
      setTareas(data)
    }
  }

  async function crearTarea(e) {
    e.preventDefault()

    if (titulo.trim() === '') {
      setMensaje('Debes ingresar un título')
      return
    }

    const { error } = await supabase
      .from('tareas')
      .insert({
        titulo: titulo,
        descripcion: descripcion,
        estado: estado,
        responsable: responsable,
        user_id: sesion.user.id
      })

    if (error) {
      setMensaje('Error al crear tarea: ' + error.message)
    } else {
      setTitulo('')
      setDescripcion('')
      setEstado('pendiente')
      setMensaje('Tarea agregada correctamente')
      cargarTareas()
    }
  }

  async function cambiarEstado(id, nuevoEstado) {
    const { error } = await supabase
      .from('tareas')
      .update({ estado: nuevoEstado })
      .eq('id', id)

    if (error) {
      setMensaje('Error al cambiar estado: ' + error.message)
    } else {
      cargarTareas()
    }
  }

  async function eliminarTarea(id) {
    const { error } = await supabase
      .from('tareas')
      .delete()
      .eq('id', id)

    if (error) {
      setMensaje('Error al eliminar tarea: ' + error.message)
    } else {
      cargarTareas()
    }
  }

  const tareasFiltradas = tareas.filter((tarea) => {
    if (filtro === 'Todas') return true

    return tarea.estado === filtro.toLowerCase()
  })

  if (!sesion) {
    return (
      <div className="login">
        <h1>Mis tareas</h1>
        <p>Inicia sesión para continuar</p>

        <form onSubmit={iniciarSesion}>
          <label>Correo electrónico</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="Tu correo"
            required
          />

          <label>Contraseña</label>
          <input
            type="password"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            placeholder="Tu contraseña"
            required
          />

          <button type="submit">Iniciar sesión</button>
          <p>{mensaje}</p>
        </form>
      </div>
    )
  }

  return (
    <main className="pagina">
      <header className="encabezado">
        <div>
          <h1>Mis tareas</h1>
          <p>{tareas.filter(t => t.estado !== 'hecha').length} tareas abiertas</p>
        </div>

        <button className="boton-sesion" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </header>

      <section className="formulario">
        <form onSubmit={crearTarea}>
          <label>Título</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="¿Qué hay que hacer?"
            required
          />

          <label>Descripción</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Detalles, contexto, enlaces..."
          />

          <div className="fila">
            <div>
              <label>Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en progreso">En progreso</option>
                <option value="hecha">Hecha</option>
              </select>
            </div>

            <div>
              <label>Usuario responsable</label>
              <input
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                placeholder="Nombre o correo"
                required
              />
            </div>
          </div>

          <button className="boton-agregar" type="submit">
            Agregar tarea
          </button>
        </form>

        {mensaje && <p className="mensaje">{mensaje}</p>}
      </section>

      <nav className="filtros">
        {['Todas', 'Pendiente', 'En progreso', 'Hecha'].map((opcion) => {
          const cantidad = opcion === 'Todas'
            ? tareas.length
            : tareas.filter(
                t => t.estado === opcion.toLowerCase()
              ).length

          return (
            <button
              key={opcion}
              className={filtro === opcion ? 'filtro activo' : 'filtro'}
              onClick={() => setFiltro(opcion)}
            >
              {opcion} ({cantidad})
            </button>
          )
        })}
      </nav>

      <section className="lista-tareas">
        {tareasFiltradas.length === 0 ? (
          <p className="vacio">No hay tareas para mostrar.</p>
        ) : (
          tareasFiltradas.map((tarea) => (
            <article className="tarjeta-tarea" key={tarea.id}>
              <div className="contenido-tarea">
                <h3 className={tarea.estado === 'hecha' ? 'tachado' : ''}>
                  {tarea.titulo}
                </h3>

                <p>{tarea.descripcion}</p>

                <div className="detalles-tarea">
                  <span className={'etiqueta ' + tarea.estado.replace(' ', '-')}>
                    {tarea.estado}
                  </span>

                  <span className="responsable">
                    {tarea.responsable || sesion.user.email}
                  </span>
                </div>
              </div>

              <div className="acciones-tarea">
                <select
                  value={tarea.estado}
                  onChange={(e) => cambiarEstado(tarea.id, e.target.value)}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en progreso">En progreso</option>
                  <option value="hecha">Hecha</option>
                </select>

                <button
                  className="boton-eliminar"
                  onClick={() => eliminarTarea(tarea.id)}
                >
                  Eliminar
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  )
}

export default App
