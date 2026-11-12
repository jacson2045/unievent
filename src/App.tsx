import React, { useCallback, useEffect, useState } from "react"
import AppShell from "./components/layout/AppShell"
import Card from "./components/ui/Card"
import Badge from "./components/ui/Badge"

import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"

import StudentDashboard from "./pages/student/StudentDashboard"
import ExploreEvents from "./pages/student/ExploreEvents"
import EventDetail from "./pages/student/EventDetail"
import EnrollmentFlow from "./pages/student/EnrollmentFlow"
import PaymentResult from "./pages/student/PaymentResult"
import MyEnrollments from "./pages/student/MyEnrollments"
import MyPayments from "./pages/student/MyPayments"
import AttendancePage from "./pages/student/AttendancePage"
import NotificationsPage from "./pages/student/NotificationsPage"
import ProfilePage from "./pages/student/ProfilePage"

import OrganizerDashboard from "./pages/organizer/OrganizerDashboard"
import CreateEvent from "./pages/organizer/CreateEvent"
import Participants from "./pages/organizer/Participants"
import MyEvents from "./pages/organizer/MyEvents"
import OrgPayments from "./pages/organizer/OrgPayments"
import OrgStats from "./pages/organizer/OrgStats"
import AttendanceControl from "./pages/organizer/AttendanceControl"

import AdminDashboard from "./pages/admin/AdminDashboard"
import UserManagement from "./pages/admin/UserManagement"
import SystemMonitoring from "./pages/admin/SystemMonitoring"

import { clearAuth, getToken, getUser, isAuthenticated } from "./utils/auth"
import { getUnreadCount } from "./api/notificationsApi"
import type { Role as AuthRole } from "./utils/auth"

type Role = AuthRole
type AuthView = "login" | "register"

const roleLabels: Record<Role, string> = {
  student: "Estudiante",
  organizer: "Organizador",
  admin: "Administrador",
}

const ROLE_ALLOWED_PAGES: Record<Role, string[]> = {
  student: [
    "student-dashboard", "explore-events", "event-detail",
    "enrollment-flow", "payment-result", "my-enrollments", "my-payments",
    "my-attendance", "notifications", "profile"
  ],
  organizer: [
    "organizer-dashboard", "my-events", "create-event", "edit-event", "event-detail",
    "participants", "attendance-control", "org-payments", "org-stats",
    "notifications", "profile"
  ],
  admin: [
    "admin-dashboard", "user-management",
    "system-monitoring", "notifications", "profile"
  ]
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
  "payment-result": "Resultado del pago",
  "my-enrollments": "Mis inscripciones",
  "my-payments": "Mis pagos",
  "my-attendance": "Mis asistencias",
  notifications: "Notificaciones",
  profile: "Perfil",
  "organizer-dashboard": "Dashboard",
  "my-events": "Mis eventos",
  "create-event": "Crear evento",
  "edit-event": "Editar evento",
  participants: "Participantes",
  "attendance-control": "Control de asistencia",
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
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [showForgot, setShowForgot] = useState<boolean>(false)
  const [accessDenied, setAccessDenied] = useState<string>("")
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0)
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [participantsEventId, setParticipantsEventId] = useState<number | null>(null)

  const refreshUnread = useCallback(() => {
    getUnreadCount()
      .then(setUnreadNotifications)
      .catch(() => undefined) // el contador es secundario: si falla, no se interrumpe la app
  }, [])

  // Contador de notificaciones: al iniciar sesión, al cambiar de pantalla y cada 30 s.
  useEffect(() => {
    if (!authenticated) return
    refreshUnread()
    const timer = window.setInterval(refreshUnread, 30000)
    return () => window.clearInterval(timer)
  }, [authenticated, currentPage, refreshUnread])

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

  useEffect(() => {
    const user = getUser()
    const requestedPage = new URLSearchParams(window.location.search).get("page")

    if (user && requestedPage) {
      if (ROLE_ALLOWED_PAGES[user.rol].includes(requestedPage)) {
        setAccessDenied("")
        setCurrentPage(requestedPage)
      } else {
        setAccessDenied(
          `Tu rol de ${roleLabels[user.rol]} no tiene permiso para acceder a esta pantalla.`
        )
      }
    }
  }, [])

  const handleLogin = (r: Role) => {
    setRole(r)
    setAuthenticated(true)
    const user = getUser()
    setUserName(user?.nombreCompleto || "")
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

  const handleNavigate = (page: string) => {
    if (!ROLE_ALLOWED_PAGES[role].includes(page)) {
      setAccessDenied(
        `Tu rol de ${roleLabels[role]} no tiene permiso para acceder a esta pantalla.`
      )
      return
    }

    setAccessDenied("")
    if (page === "participants") setParticipantsEventId(null)
    setCurrentPage(page)
  }

  const handleSelectEvent = (id: number) => {
    setSelectedEventId(id)
    setCurrentPage("event-detail")
  }

  const handleEditEvent = (id: number) => {
    setEditingEventId(id)
    setCurrentPage("edit-event")
  }

  const handleViewParticipants = (id: number) => {
    setParticipantsEventId(id)
    setCurrentPage("participants")
  }

  /** Retoma la inscripción de un evento (el backend reutiliza la inscripción pendiente). */
  const handleContinuePayment = (id: number) => {
    setSelectedEventId(id)
    setCurrentPage("enrollment-flow")
  }

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
      content = <StudentDashboard onNavigate={handleNavigate} onSelectEvent={handleSelectEvent} />
      break
    case "explore-events":
      content = <ExploreEvents onNavigate={handleNavigate} onSelectEvent={handleSelectEvent} />
      break
    case "event-detail":
      content = (
        <EventDetail
          onNavigate={handleNavigate}
          eventId={selectedEventId}
          canEnroll={role === "student"}
          backPage={role === "organizer" ? "my-events" : "explore-events"}
        />
      )
      break
    case "enrollment-flow":
      content = <EnrollmentFlow onNavigate={handleNavigate} eventId={selectedEventId} />
      break
    case "payment-result":
      content = <PaymentResult onNavigate={handleNavigate} />
      break
    case "my-enrollments":
      content = (
        <MyEnrollments
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          onContinuePayment={handleContinuePayment}
        />
      )
      break
    case "my-payments":
      content = <MyPayments onNavigate={handleNavigate} />
      break
    case "my-attendance":
      content = <AttendancePage onNavigate={handleNavigate} />
      break

    case "organizer-dashboard":
      content = <OrganizerDashboard onNavigate={handleNavigate} onViewParticipants={handleViewParticipants} />
      break
    case "my-events":
      content = (
        <MyEvents
          onNavigate={handleNavigate}
          onEdit={handleEditEvent}
          onViewParticipants={handleViewParticipants}
          onViewEvent={handleSelectEvent}
        />
      )
      break
    case "create-event":
      content = <CreateEvent key="new" onNavigate={handleNavigate} />
      break
    case "edit-event":
      content = <CreateEvent key={`edit-${editingEventId}`} onNavigate={handleNavigate} eventId={editingEventId} />
      break
    case "participants":
      content = <Participants key={participantsEventId ?? "all"} initialEventId={participantsEventId} />
      break
    case "attendance-control":
      content = <AttendanceControl />
      break
    case "org-payments":
      content = <OrgPayments />
      break
    case "org-stats":
      content = <OrgStats />
      break

    case "admin-dashboard":
      content = <AdminDashboard onNavigate={handleNavigate} />
      break
    case "user-management":
      content = <UserManagement />
      break
    case "system-monitoring":
      content = <SystemMonitoring />
      break

    case "notifications":
      content = <NotificationsPage onUnreadChange={setUnreadNotifications} />
      break
    case "profile":
      content = <ProfilePage onNameChange={setUserName} />
      break

    default:
      content = <ComingSoon title={currentPage} />
  }

  if (accessDenied) {
    content = (
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="p-10 text-center">
          <Badge variant="rejected">Acceso denegado</Badge>
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            No tienes permiso para acceder
          </h2>
          <p className="mt-3 text-sm text-slate-600">
            {accessDenied}
          </p>
          <button
            onClick={() => {
              setAccessDenied("")
              setCurrentPage(
                role === "student"
                  ? "student-dashboard"
                  : role === "organizer"
                    ? "organizer-dashboard"
                    : "admin-dashboard"
              )
            }}
            className="mt-6 rounded-xl bg-primary-600 px-5 py-2 text-white"
          >
            Volver al inicio
          </button>
        </Card>
      </div>
    )
  }

  const displayName = userName || roleLabels[role]

  return (
    <AppShell
      role={role}
      currentPage={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
      title={PAGE_TITLES[currentPage] ?? "UniEvent Pay"}
      userName={displayName}
      userRole={roleLabels[role]}
      unreadNotifications={unreadNotifications}
    >
      {content}
    </AppShell>
  )
}
