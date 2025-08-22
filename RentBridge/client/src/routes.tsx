import { Routes, Route, Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Layout } from "@/components/Layout"
import { Home } from "@/pages/Home"
import { Login } from "@/pages/Login"
import { Register } from "@/pages/Register"
import { Dashboard } from "@/pages/Dashboard"
import { PropertyDetails } from "@/pages/PropertyDetails"
import { SearchProperties } from "@/pages/SearchProperties"
import { Applications } from "@/pages/Applications"
import { Profile } from "@/pages/Profile"
import { Messages } from "@/pages/Messages"
import { AddProperty } from "@/pages/AddProperty"
import { ManageProperties } from "@/pages/ManageProperties"
import { Tenants } from "@/pages/Tenants"
import { HoldingDeposits } from "@/pages/HoldingDeposits"
import { Payments } from "@/pages/Payments"
import { PaymentHistory } from "@/pages/PaymentHistory"

// Protected Route component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Public Route component (redirects to dashboard if already logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<SearchProperties />} />
      <Route path="/property/:id" element={<PropertyDetails />} />
      
      {/* Auth routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Tenant routes */}
      <Route
        path="/applications"
        element={
          <ProtectedRoute allowedRoles={['tenant']}>
            <Layout>
              <Applications />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/holding-deposits"
        element={
          <ProtectedRoute allowedRoles={['tenant']}>
            <Layout>
              <HoldingDeposits />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payments"
        element={
          <ProtectedRoute allowedRoles={['tenant']}>
            <Layout>
              <Payments />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/payment-history"
        element={
          <ProtectedRoute allowedRoles={['tenant']}>
            <Layout>
              <PaymentHistory />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Landlord routes */}
      <Route
        path="/add-property"
        element={
          <ProtectedRoute allowedRoles={['landlord']}>
            <Layout>
              <AddProperty />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/manage-properties"
        element={
          <ProtectedRoute allowedRoles={['landlord']}>
            <Layout>
              <ManageProperties />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tenants"
        element={
          <ProtectedRoute allowedRoles={['landlord']}>
            <Layout>
              <Tenants />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Shared protected routes */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Layout>
              <Messages />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}