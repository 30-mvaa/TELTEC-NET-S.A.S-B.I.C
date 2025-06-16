
"use client"

import type React from "react"
import { useState } from "react"
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Llamar a la API route para autenticar
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()
      
      if (result.success && result.data) {
        // Guardar usuario en localStorage
        localStorage.setItem("user", JSON.stringify({
          id: result.data.id,
          email: result.data.email,
          role: result.data.rol,
          name: result.data.nombre,
        }))
        
        // Redirigir al dashboard
        router.push("/dashboard")
      } else {
        setError(result.message || "Credenciales incorrectas")
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

            {error && <p style={{ color: "#f87171", fontSize: "0.875rem", textAlign: "center" }}>{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                background: "linear-gradient(45deg, #06b6d4, #3b82f6)",
                color: "white",
                padding: "0.75rem",
                fontSize: "1.125rem",
                fontWeight: "600",
                borderRadius: "0.5rem",
                border: "none",
                cursor: isLoading ? "not-allowed" : "pointer",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? "Iniciando..." : "Iniciar Sesión"}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.875rem", color: "#9ca3af" }}>
            <p>Ingresa con tu email y contraseña registrados en el sistema</p>
          </div>
        </div>
      </div>
    </div>
  )
}