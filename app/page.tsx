
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthController } from "@/lib/controllers/AuthController"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock, Wifi } from "lucide-react"
import Link from "next/link"


export default function LoginPage() {
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const [loginAttempts, setLoginAttempts] = useState(0)
  const [maxAttempts, setMaxAttempts] = useState(3) // valor por defecto, se puede actualizar según backend
  const [blockMinutes, setBlockMinutes] = useState(5) // valor por defecto, se puede actualizar según backend
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockUntil, setBlockUntil] = useState<Date | null>(null)
  const [remainingTime, setRemainingTime] = useState(0)
  // Estado para saber si la configuración ya fue cargada
  const [configLoaded, setConfigLoaded] = useState(false)

  // Al cargar, revisar si hay bloqueo persistente
  useEffect(() => {
    // Obtener configuración de login desde la API
    fetch('/api/configuracion')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          const config = data.data
          const max = config.find((c: any) => c.clave === 'login_intentos_maximos')?.valor
          const min = config.find((c: any) => c.clave === 'login_minutos_congelacion')?.valor
          if (max) setMaxAttempts(Number(max))
          if (min) setBlockMinutes(Number(min))
        }
        setConfigLoaded(true)
      })
      .catch(() => { setConfigLoaded(true) })
    // Al cargar, revisar si hay bloqueo persistente
    const storedBlock = localStorage.getItem("login_block_until")
    if (storedBlock) {
      const until = new Date(storedBlock)
      if (until > new Date()) {
        setIsBlocked(true)
        setBlockUntil(until)
      } else {
        localStorage.removeItem("login_block_until")
      }
    }
  }, [])

  // Manejar el desbloqueo automático
  useEffect(() => {
    if (!blockUntil) return
    const now = new Date()
    const ms = blockUntil.getTime() - now.getTime()
    if (ms <= 0) {
      setIsBlocked(false)
      setBlockUntil(null)
      setLoginAttempts(0)
      localStorage.removeItem("login_block_until")
      return
    }
    localStorage.setItem("login_block_until", blockUntil.toISOString())
    const timeout = setTimeout(() => {
      setIsBlocked(false)
      setBlockUntil(null)
      setLoginAttempts(0)
      localStorage.removeItem("login_block_until")
    }, ms)
    return () => clearTimeout(timeout)
  }, [blockUntil])

  // Actualizar el contador regresivo cuando está bloqueado
  useEffect(() => {
    if (!isBlocked || !blockUntil) {
      setRemainingTime(0)
      return
    }
    const update = () => {
      const now = new Date()
      const diff = Math.max(0, Math.floor((blockUntil.getTime() - now.getTime()) / 1000))
      setRemainingTime(diff)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [isBlocked, blockUntil])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Esperar a que la configuración esté cargada
    if (!configLoaded) {
      setError("Cargando configuración, intente en un momento...")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()
      
      if (response.status === 429) {
        // Extraer minutos de bloqueo del mensaje, pero si no existe usar el valor de la base de datos
        let minutos = blockMinutes
        const match = result.message && result.message.match(/(\d+) min/)
        if (match) minutos = parseInt(match[1], 10)
        setBlockMinutes(minutos)
        setIsBlocked(true)
        const until = new Date(Date.now() + minutos * 60000)
        setBlockUntil(until)
        localStorage.setItem("login_block_until", until.toISOString())
        setError(`Demasiados intentos fallidos. Intente más tarde (${minutos} min).`)
      } else if (result.success && result.user) {
        // Login exitoso: resetear intentos
        setLoginAttempts(0)
        setIsBlocked(false)
        setBlockUntil(null)
        localStorage.removeItem("login_block_until")
        localStorage.setItem("user", JSON.stringify({
          id: result.user.id,
          email: result.user.email,
          role: result.user.rol,
          name: result.user.nombre,
        }))
        router.push("/dashboard")
      } else {
        // Si el mensaje incluye el intento actual y el máximo, extraerlo
        const match = result.message && result.message.match(/Intento (\d+) de (\d+)/)
        if (match) {
          setLoginAttempts(Number(match[1]))
          setMaxAttempts(Number(match[2]))
        } else {
          setLoginAttempts((prev) => prev + 1)
        }
        setError(result.message || "Credenciales incorrectas")
        // Mostrar alert si el usuario no está registrado
        if (response.status === 404 && result.message === "Usuario no encontrado") {
          window.alert("El correo ingresado no está registrado en el sistema.")
        }
      }
    } catch (error) {
      console.error("Error en login:", error)
      setError("Error al conectar con el servidor")
    } finally {
      setIsLoading(false)
    }
  }

  // Pantalla de bienvenida
  if (!showLoginForm) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg,rgb(86, 85, 88) 0%,rgb(19, 33, 67) 50%,rgb(16, 14, 44) 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <div
          className="text-center space-y-8"
          style={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2rem",
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: "8rem",
              height: "8rem",
              background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
              borderRadius: "1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              margin: "0 auto",
            }}
          >
            <span style={{ fontSize: "4rem" }}>📡</span>
          </div>

          {/* Título */}
          <div>
            <h1
              style={{
                fontSize: "4rem",
                fontWeight: "bold",
                marginBottom: "1rem",
                lineHeight: "1",
              }}
            >
              <span style={{ color: "white" }}>Tel</span>
              <span style={{ color: "#3B82F6" }}>Tec</span>
              <span style={{ color: "#22C55E" }}> Net</span>
            </h1>
            <p
              style={{
                color: "#e0e7ff",
                fontSize: "1.5rem",
                fontWeight: "300",
                opacity: 0.9,
              }}
            >
              Sistema de Gestión de Administración
            </p>
          </div>

          {/* Botón Iniciar Sesión */}
          <button
            onClick={() => setShowLoginForm(true)}
            style={{
              background: "linear-gradient(45deg, #06b6d4, #3b82f6)",
              color: "white",
              padding: "1rem 3rem",
              fontSize: "1.25rem",
              fontWeight: "600",
              borderRadius: "1rem",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              transition: "all 0.3s ease",
              marginTop: "2rem",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow =
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
          >
            Iniciar Sesión
          </button>
        </div>
      </div>
    )
  }

  // Formulario de login
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg,rgb(86, 85, 88) 0%,rgb(28, 47, 97) 50%,rgb(39, 35, 105) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        className="w-full max-w-md space-y-8"
        style={{
          width: "100%",
          maxWidth: "28rem",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        {/* Botón volver */}
        <button
          onClick={() => setShowLoginForm(false)}
          style={{
            position: "absolute",
            top: "2rem",
            left: "2rem",
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "0.5rem",
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          ← Volver
        </button>
           <div>
            <h1
              style={{
                fontSize: "5rem",
                fontWeight: "bold",
                marginBottom: "1rem",
                lineHeight: "1",
              }}
            >
              <span style={{ color: "white" }}>Tel</span>
              <span style={{ color: "#3B82F6" }}>Tec</span>
              <span style={{ color: "#22C55E" }}> Net</span>
            </h1>
            <p
              style={{
                color: "#e0e7ff",
                fontSize: "1.5rem",
                fontWeight: "300",
                opacity: 0.9,
              }}
            >
            </p>
          </div>
        {/* Login Form */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "1rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            padding: "2rem",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "white" }}>Iniciar Sesión</h2>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label htmlFor="email" style={{ color: "#e5e7eb", fontSize: "0.875rem" }}>
                Correo Electrónico
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "0.75rem",
                    top: "0.75rem",
                    color: "#9ca3af",
                    fontSize: "1rem",
                  }}
                >
                  
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@ejemplo.com"
                  style={{
                    paddingLeft: "2.5rem",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "white",
                    borderRadius: "0.5rem",
                    padding: "0.75rem",
                    width: "100%",
                    fontSize: "1rem",
                  }}
                  required
                  disabled={isBlocked}
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label htmlFor="password" style={{ color: "#e5e7eb", fontSize: "0.875rem" }}>
                  Contraseña
                </label>
                <a href="/forgot-password" style={{ color: "#06b6d4", fontSize: "0.875rem", textDecoration: "none" }}>
                  ¿Olvidó su contraseña?
                </a>
              </div>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "0.75rem",
                    top: "0.75rem",
                    color: "#9ca3af",
                    fontSize: "1rem",
                  }}
                >
                  
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    paddingLeft: "2.5rem",
                    paddingRight: "2.5rem",
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "white",
                    borderRadius: "0.5rem",
                    padding: "0.75rem",
                    width: "100%",
                    fontSize: "1rem",
                  }}
                  required
                  disabled={isBlocked}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "0.75rem",
                    background: "none",
                    border: "none",
                    color: "#9ca3af",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
            <div style={{
              color: "#dc2626", // rojo fuerte
              fontWeight: 600,
              fontSize: "1.1rem",
              textAlign: "center",
              marginTop: "1rem",
              marginBottom: "1rem",
            }}>
              <p style={{ fontWeight: "normal" }}>Contraseña incorrecta</p>

            </div>
          )}

            <button
              type="submit"
              disabled={isLoading || isBlocked}
              style={{
                width: "100%",
                background: "linear-gradient(45deg, #06b6d4, #3b82f6)",
                color: "white",
                padding: "0.75rem",
                fontSize: "1.125rem",
                fontWeight: "600",
                borderRadius: "0.5rem",
                border: "none",
                cursor: isLoading || isBlocked ? "not-allowed" : "pointer",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                opacity: isLoading || isBlocked ? 0.7 : 1,
              }}
            >
              {isLoading ? "Iniciando..." : "Iniciar Sesión"}
            </button>
            {isBlocked && remainingTime > 0 && (
              <div style={{ marginTop: "0.5rem", textAlign: "center", color: "#64748b", fontSize: "0.95rem" }}>
                Intente nuevamente, por favor espere: <span style={{ color: "#3B82F6", fontWeight: 600 }}>{Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}</span>
              </div>  
            )}
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "#9ca3af" }}>
            <p>Ingresa con tu email y contraseña registrados en el sistema</p>
          </div>
        </div>
      </div>
    </div>
  )
}



