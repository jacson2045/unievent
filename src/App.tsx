import React, { useEffect, useState } from "react"
import AppShell from "./components/layout/AppShell"
import Card from "./components/ui/Card"
import Badge from "./components/ui/Badge"

import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"

import StudentDashboard from "./pages/student/StudentDashboard"
import ExploreEvents from "./pages/student/ExploreEvents"
import EventDetail from "./pages/student/EventDetail"
import EnrollmentFlow from "./pages/student/EnrollmentFlow"
import MyEnrollments from "./pages/student/MyEnrollments"
import AttendancePage from "./pages/student/AttendancePage"
import NotificationsPage from "./pages/student/NotificationsPage"
import ProfilePage from "./pages/student/ProfilePage"

import OrganizerDashboard from "./pages/organizer/OrganizerDashboard"
import CreateEvent from "./pages/organizer/CreateEvent"
import Participants from "./pages/organizer/Participants"

import AdminDashboard from "./pages/admin/AdminDashboard"
import UserManagement from "./pages/admin/UserManagement"
import SystemMonitoring from "./pages/admin/SystemMonitoring"

import { clearAuth, getToken, getUser, isAuthenticated } from "./utils/auth"
import type { Role as AuthRole } from "./utils/auth"

type Role = AuthRole
type AuthView = "login" | "register"

const FALLBACK_ROLE_NAMES: Record<Role, string> = {
  student: "Ana Ramírez Torres",
  organizer: "Carlos Mendoza Quispe",
  admin: "Roberto Lima Paredes",
}

const roleLabels: Record<Role, string> = {
  student: "Estudiante",
  organizer: "Organizador",
  admin: "Administrador",
}

function ComingSoon({ title }: { title: string }) {
  return (
    <Card className="p-10 text-center">
      <Badge variant="pending">Próximamente</Badge>
      <h2 className="mt-4 font-display font-bold text-xl text-slate-900">
        {title}
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Esta pantalla se está construyendo.
      </p>
    </Card>
  )
}

const PAGE_TITLES: Record<string, string> = {
  "student-dashboard": "Inicio",
  "explore-events": "Explorar eventos",
  "event-detail": "Detalle del evento",
  "enrollment-flow": "Inscripción",
  "my-enrollments": "Mis inscripciones",
  "my-payments": "Mis pagos",
  "my-attendance": "Mis asistencias",
  notifications: "Notificaciones",
  profile: "Perfil",
  "organizer-dashboard": "Dashboard",
  "my-events": "Mis eventos",
  "create-event": "Crear evento",
  participants: "Participantes",
  "org-payments": "Pagos",
  "org-stats": "Estadísticas",
  "admin-dashboard": "Dashboard",
  "user-management": "Gestión de usuarios",
  "system-monitoring": "Monitoreo del sistema",
}

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean>(false)
  const [authView, setAuthView] = useState<AuthView>("login")
  const [role, setRole] = useState<Role>("student")
  const [userName, setUserName] = useState<string>("")
  const [currentPage, setCurrentPage] = useState<string>("student-dashboard")
  const [showForgot, setShowForgot] = useState<boolean>(false)

  useEffect(() => {
    if (isAuthenticated()) {
      const user = getUser()
      if (user) {
        setAuthenticated(true)
        setRole(user.rol)
        setUserName(user.nombreCompleto)
        setCurrentPage(
          user.rol === "student"
            ? "student-dashboard"
            : user.rol === "organizer"
              ? "organizer-dashboard"
              : "admin-dashboard",
        )
      } else {
        clearAuth()
      }
    }
  }, [])

  const handleLogin = (r: Role) => {
    setRole(r)
    setAuthenticated(true)
    const user = getUser()
    setUserName(user?.nombreCompleto || FALLBACK_ROLE_NAMES[r])
    setCurrentPage(
      r === "student"
        ? "student-dashboard"
        : r === "organizer"
          ? "organizer-dashboard"
          : "admin-dashboard",
    )
  }

  const handleLogout = () => {
    clearAuth()
    setAuthenticated(false)
    setAuthView("login")
    setShowForgot(false)
    setRole("student")
    setUserName("")
  }

  const handleNavigate = (page: string) => setCurrentPage(page)

  if (!authenticated) {
    if (showForgot) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <Card className="max-w-sm w-full p-8 text-center">
            <h2 className="font-display font-bold text-lg text-slate-900 mb-2">
              Recuperar contraseña
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Te enviaremos un enlace de recuperación a tu correo institucional.
              (Pantalla temporal — próximamente el flujo completo.)
            </p>
            <button
              onClick={() => setShowForgot(false)}
              className="text-sm text-primary-600 font-medium hover:text-primary-800"
            >
              ← Volver al inicio de sesión
            </button>
          </Card>
        </div>
      )
    }

    if (authView === "register") {
      return (
        <Register
          onLogin={(r) => {
            if (r) {
              handleLogin(r)
            } else {
              setAuthView("login")
            }
          }}
          onBack={() => setAuthView("login")}
        />
      )
    }

    return (
      <Login
        onLogin={handleLogin}
        onRegister={() => setAuthView("register")}
        onForgot={() => setShowForgot(true)}
      />
    )
  }

  let content: React.ReactNode

  switch (currentPage) {
    case "student-dashboard":
      content = <StudentDashboard onNavigate={handleNavigate} />
      break
    case "explore-events":
      content = <ExploreEvents onNavigate={handleNavigate} />
      break
    case "event-detail":
      content = <EventDetail onNavigate={handleNavigate} />
      break
    case "enrollment-flow":
      content = <EnrollmentFlow onNavigate={handleNavigate} />
      break
    case "my-enrollments":
      content = <MyEnrollments onNavigate={handleNavigate} />
      break
    case "my-payments":
      content = <ComingSoon title="Mis pagos" />
      break
    case "my-attendance":
      content = <AttendancePage />
      break

    case "organizer-dashboard":
      content = <OrganizerDashboard onNavigate={handleNavigate} />
      break
    case "my-events":
      content = <ComingSoon title="Mis eventos" />
      break
    case "create-event":
      content = <CreateEvent onNavigate={handleNavigate} />
      break
    case "participants":
      content = <Participants />
      break
    case "org-payments":
      content = <ComingSoon title="Pagos" />
      break
    case "org-stats":
      content = <ComingSoon title="Estadísticas" />
      break

    case "admin-dashboard":
      content = <AdminDashboard />
      break
    case "user-management":
      content = <UserManagement />
      break
    case "system-monitoring":
      content = <SystemMonitoring />
      break

    case "notifications":
      content = <NotificationsPage />
      break
    case "profile":
      content = <ProfilePage />
      break

    default:
      content = <ComingSoon title={currentPage} />
  }

  const displayName = userName || FALLBACK_ROLE_NAMES[role]

  return (
    <AppShell
      role={role}
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      title={PAGE_TITLES[currentPage] ?? "UniEvent Pay"}
      userName={displayName}
      userRole={roleLabels[role]}
    >
      {content}
    </AppShell>
  )
}
