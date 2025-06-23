"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: number
  email: string
  role: string
  name: string
}

interface DashboardStats {
  totalClientes: number
  clientesActivos: number
  recaudacionMensual: number
  pagosPendientes: number
  gastosDelMes: number
  notificacionesPendientes: number
  serviciosActivos: number
  morosidad: number
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 1234,
    clientesActivos: 1180,
    recaudacionMensual: 45231,
    pagosPendientes: 23,
    gastosDelMes: 8500,
    notificacionesPendientes: 12,
    serviciosActivos: 1180,
    morosidad: 4.2,
  })
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }
    setUser(JSON.parse(userData))
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  if (!user) return null

  const getModulesByRole = (role: string) => {
    const baseModules = [
      {
        name: "Clientes",
        href: "/clientes",
        description: "Gestión completa de clientes",
        color: "linear-gradient(135deg, #3b82f6, #06b6d4)",
        stats: `${stats.totalClientes} registrados`,
        icon: "👥",
      },
      {
        name: "Reportes",
        href: "/reportes",
        description: "Reportes y estadísticas",
        color: "linear-gradient(135deg, #8b5cf6, #ec4899)",
        stats: "Análisis completo",
        icon: "📊",
      },
    ]

    switch (role) {
      case "administrador":
        return [
          ...baseModules,
          {
            name: "Usuarios",
            href: "/usuarios",
            description: "Gestión de usuarios del sistema",
            color: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            stats: "3 roles disponibles",
            icon: "👤",
          },
          {
            name: "Recaudación",
            href: "/recaudacion",
            description: "Registro de pagos y comprobantes",
            color: "linear-gradient(135deg, #10b981, #059669)",
            stats: `$${stats.recaudacionMensual.toLocaleString()}`,
            icon: "💰",
          },
          {
            name: "Gastos",
            href: "/gastos",
            description: "Control de gastos empresariales",
            color: "linear-gradient(135deg, #ef4444, #ec4899)",
            stats: `$${stats.gastosDelMes.toLocaleString()}`,
            icon: "🧾",
          },
          {
            name: "Notificaciones",
            href: "/notificaciones",
            description: "WhatsApp y alertas automáticas",
            color: "linear-gradient(135deg, #f59e0b, #f97316)",
            stats: `${stats.notificacionesPendientes} pendientes`,
            icon: "💬",
          },
          {
            name: "Configuración",
            href: "/configuracion",
            description: "Configuración del sistema",
            color: "linear-gradient(135deg, #6b7280, #4b5563)",
            stats: "Sistema configurado",
            icon: "⚙️",
          },
        ]
      case "economia":
        return [
          ...baseModules,
          {
            name: "Recaudación",
            href: "/recaudacion",
            description: "Registro de pagos y comprobantes",
            color: "linear-gradient(135deg, #10b981, #059669)",
            stats: `$${stats.recaudacionMensual.toLocaleString()}`,
            icon: "💰",
          },
          {
            name: "Gastos",
            href: "/gastos",
            description: "Control de gastos empresariales",
            color: "linear-gradient(135deg, #ef4444, #ec4899)",
            stats: `$${stats.gastosDelMes.toLocaleString()}`,
            icon: "🧾",
          },
        ]
      case "atencion_cliente":
        return [
          ...baseModules,
          {
            name: "Recaudación",
            href: "/recaudacion",
            description: "Registro de pagos",
            color: "linear-gradient(135deg, #10b981, #059669)",
            stats: `${stats.pagosPendientes} pendientes`,
            icon: "💰",
          },
          {
            name: "Notificaciones",
            href: "/notificaciones",
            description: "Comunicación con clientes",
            color: "linear-gradient(135deg, #f59e0b, #f97316)",
            stats: `${stats.notificacionesPendientes} pendientes`,
            icon: "💬",
          },
        ]
      default:
        return baseModules
    }
  }

  const modules = getModulesByRole(user.role)

  const headerStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
    position: "sticky",
    top: 0,
    zIndex: 50,
  }

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc 0%, #dbeafe 50%, #e0e7ff 100%)",
  }

  const cardStyle: React.CSSProperties = {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "1rem",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    padding: "1.5rem",
    cursor: "pointer",
    transition: "all 0.3s ease",
  }

  const statCardStyle: React.CSSProperties = {
    borderRadius: "1rem",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    color: "white",
    padding: "1.5rem",
    border: "none",
  }

  return (
    <div style={containerStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: "4rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    width: "2rem",
                    height: "2rem",
                    background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                    borderRadius: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "0.75rem",
                  }}
                >
                  <span style={{ color: "white", fontSize: "1.25rem" }}>📡</span>
                </div>
                <h1
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    background: "linear-gradient(45deg, #06b6d4, #3b82f6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  TelTec Net
                </h1>
                <span
                  style={{
                    marginLeft: "0.75rem",
                    background: "linear-gradient(45deg, #06b6d4, #3b82f6)",
                    color: "white",
                    padding: "0.25rem 0.5rem",
                    borderRadius: "0.25rem",
                    fontSize: "0.75rem",
                    border: "none",
                  }}
                >
                  v2.0
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button
                style={{
                  background: "none",
                  border: "none",
                  position: "relative",
                  cursor: "pointer",
                  padding: "0.5rem",
                }}
              >
                <span style={{ fontSize: "1.25rem" }}>🔔</span>
                {stats.notificacionesPendientes > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-0.25rem",
                      right: "-0.25rem",
                      height: "1.25rem",
                      width: "1.25rem",
                      borderRadius: "50%",
                      background: "#ef4444",
                      color: "white",
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {stats.notificacionesPendientes}
                  </span>
                )}
              </button>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "0.875rem", fontWeight: "500", color: "#0f172a" }}>{user.name}</p>
                <p style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "capitalize" }}>
                  {user.role.replace("_", " ")}
                </p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  border: "1px solid #e2e8f0",
                  background: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                }}
              >
                <span>🚪</span>
                <span>Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: "80rem", margin: "0 auto", padding: "2rem 1.5rem" }}>
        {/* Welcome Section */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "2.25rem", fontWeight: "bold", color: "#0f172a", marginBottom: "0.5rem" }}>
            Bienvenido,{" "}
            <span
              style={{
                background: "linear-gradient(45deg, #06b6d4, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {user.name}
            </span>
          </h2>
          <p style={{ color: "#64748b", fontSize: "1.125rem" }}>
            Panel de control -{" "}
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Quick Stats 
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <div style={{ ...statCardStyle, background: "linear-gradient(135deg, #3b82f6, #06b6d4)" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}
            >
              <h3 style={{ fontSize: "0.875rem", fontWeight: "500", opacity: 0.9 }}>Total Clientes</h3>
              <span style={{ fontSize: "1.25rem", opacity: 0.9 }}>👥</span>
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: "bold" }}>{stats.totalClientes.toLocaleString()}</div>
            <p style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "0.25rem" }}>
              <span style={{ color: "#bfdbfe" }}>↗ +12%</span> desde el mes pasado
            </p>
          </div>

          <div style={{ ...statCardStyle, background: "linear-gradient(135deg, #10b981, #059669)" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}
            >
              <h3 style={{ fontSize: "0.875rem", fontWeight: "500", opacity: 0.9 }}>Recaudación Mensual</h3>
              <span style={{ fontSize: "1.25rem", opacity: 0.9 }}>💰</span>
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: "bold" }}>${stats.recaudacionMensual.toLocaleString()}</div>
            <p style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "0.25rem" }}>
              <span style={{ color: "#bbf7d0" }}>↗ +8%</span> vs mes anterior
            </p>
          </div>

          <div style={{ ...statCardStyle, background: "linear-gradient(135deg, #f59e0b, #f97316)" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}
            >
              <h3 style={{ fontSize: "0.875rem", fontWeight: "500", opacity: 0.9 }}>Pagos Pendientes</h3>
              <span style={{ fontSize: "1.25rem", opacity: 0.9 }}>⚠️</span>
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: "bold" }}>{stats.pagosPendientes}</div>
            <p style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "0.25rem" }}>Requieren seguimiento</p>
          </div>

          <div style={{ ...statCardStyle, background: "linear-gradient(135deg, #8b5cf6, #ec4899)" }}>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}
            >
              <h3 style={{ fontSize: "0.875rem", fontWeight: "500", opacity: 0.9 }}>Servicios Activos</h3>
              <span style={{ fontSize: "1.25rem", opacity: 0.9 }}>📡</span>
            </div>
            <div style={{ fontSize: "1.875rem", fontWeight: "bold" }}>{stats.serviciosActivos.toLocaleString()}</div>
            <p style={{ fontSize: "0.75rem", opacity: 0.9, marginTop: "0.25rem" }}>
              {((stats.serviciosActivos / stats.totalClientes) * 100).toFixed(1)}% de actividad
            </p>
          </div>
        </div>
         */}
        {/* Modules Grid */}
        <div style={{ marginBottom: "2rem" }}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#0f172a", marginBottom: "1.5rem" }}>
             Servicios
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {modules.map((module) => (
              <div
                key={module.name}
                style={cardStyle}
                onClick={() => router.push(module.href)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)"
                  e.currentTarget.style.boxShadow = "0 32px 64px -12px rgba(0, 0, 0, 0.25)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
              >
                <div
                  style={{
                    height: "0.5rem",
                    background: module.color,
                    borderRadius: "0.5rem 0.5rem 0 0",
                    margin: "-1.5rem -1.5rem 1rem -1.5rem",
                  }}
                ></div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      padding: "0.75rem",
                      borderRadius: "0.75rem",
                      background: module.color,
                      color: "white",
                      fontSize: "1.5rem",
                      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    {module.icon}
                  </div>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      background: "#f1f5f9",
                      color: "#64748b",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                    }}
                  >
                    {module.stats}
                  </span>
                </div>
                <h4 style={{ fontSize: "1.125rem", fontWeight: "600", color: "#0f172a", marginBottom: "0.5rem" }}>
                  {module.name}
                </h4>
                <p style={{ color: "#64748b", fontSize: "0.875rem", marginBottom: "1rem" }}>{module.description}</p>
                <button
                  style={{
                    width: "100%",
                    background: module.color,
                    color: "white",
                    padding: "0.75rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: "500",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  Acceder al módulo
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e293b, #0f172a, #312e81)",
            color: "white",
            borderRadius: "1rem",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            padding: "1.5rem",
          }}
        >
          <h3
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>📅</span>
            <span>Acciones Rápidas</span>
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            <button
              onClick={() => router.push("/clientes")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(255, 255, 255, 0.1)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(8px)",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
              }}
            >
              <span>👤</span>
              <span>Nuevo Cliente</span>
            </button>
            <button
              onClick={() => router.push("/recaudacion")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(255, 255, 255, 0.1)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(8px)",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
              }}
            >
              <span>💳</span>
              <span>Registrar Pago</span>
            </button>
            <button
              onClick={() => router.push("/reportes")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "rgba(255, 255, 255, 0.1)",
                color: "white",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(8px)",
                padding: "0.75rem 1rem",
                borderRadius: "0.5rem",
                cursor: "pointer",
              }}
            >
              <span>📄</span>
              <span>Ver Reportes</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
