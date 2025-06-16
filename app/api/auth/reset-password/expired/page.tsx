export default function TokenExpiredPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-red-500">Enlace expirado</h1>
        <p>El enlace de restablecimiento de contraseña ha expirado o ya fue usado.</p>
        <p>Solicita uno nuevo desde la página de recuperación.</p>
      </div>
    </div>
  )
}
