import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/ui/theme-provider"
import { Toaster } from "./components/ui/toaster"
import { AuthProvider } from "./contexts/AuthContext"
import { MuiThemeProvider } from "./contexts/MuiThemeContext"
import { NotificationProvider } from "./contexts/NotificationContext"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Layout } from "./components/Layout"
import { BlankPage } from "./pages/BlankPage"
import { Home } from "./pages/Home"
import { Dashboard } from "./pages/Dashboard"
import { Properties } from "./pages/Properties"
import { PropertyDetails } from "./pages/PropertyDetails"
import { EditProperty } from "./pages/EditProperty"
import { Messages } from "./pages/Messages"
import { Applications } from "./pages/Applications"
import { Profile } from "./pages/Profile"
import { Search } from "./pages/Search"
import { CreateProperty } from "./pages/CreateProperty"
import { CreateListing } from "./pages/CreateListing"
import { HoldingDeposits } from "./pages/HoldingDeposits"
import { Payments } from "./pages/Payments"
import { PaymentHistory } from "./pages/PaymentHistory"
import { RentalAgreements } from "./pages/RentalAgreements"
import { KYCVerification } from "./pages/KYCVerification"
import { VerificationSuccess } from "./pages/VerificationSuccess"
import { VerificationError } from "./pages/VerificationError"

function App() {
  return (
    <MuiThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <ThemeProvider defaultTheme="light" storageKey="ui-theme">
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerificationSuccess />} />
                <Route path="/verification-success" element={<VerificationSuccess />} />
                <Route path="/verification-error" element={<VerificationError />} />
                <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route index element={<Home />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="properties" element={<Properties />} />
                  <Route path="properties/create" element={<CreateProperty />} />
                  <Route path="properties/:id" element={<PropertyDetails />} />
                  <Route path="properties/:id/edit" element={<EditProperty />} />
                  <Route path="listings/create" element={<CreateListing />} />
                  <Route path="search" element={<Search />} />
                  <Route path="messages" element={<Messages />} />
                  <Route path="applications" element={<Applications />} />
                  <Route path="rental-agreements" element={<RentalAgreements />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="profile/holding-deposits" element={<HoldingDeposits />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="profile/payment-history" element={<PaymentHistory />} />
                  <Route path="kyc-verification" element={<KYCVerification />} />
                </Route>
                <Route path="*" element={<BlankPage />} />
              </Routes>
            </Router>
            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </NotificationProvider>
    </MuiThemeProvider>
  )
}

export default App