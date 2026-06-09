import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('farmtrack_user')
    return stored ? JSON.parse(stored) : null
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('farmtrack_token')
    if (token) {
      api.get('/auth/me')
        .then(res => { setUser(res.data); localStorage.setItem('farmtrack_user', JSON.stringify(res.data)) })
        .catch(() => logout())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    localStorage.setItem('farmtrack_token', res.data.access_token)
    const me = await api.get('/auth/me')
    setUser(me.data)
    localStorage.setItem('farmtrack_user', JSON.stringify(me.data))
    return me.data
  }

  const register = async (data) => { await api.post('/auth/register', data) }

  const logout = () => {
    localStorage.removeItem('farmtrack_token')
    localStorage.removeItem('farmtrack_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
