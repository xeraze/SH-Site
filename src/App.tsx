import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { StaffPage } from "./pages/StaffPage";
import { ContactsPage } from "./pages/ContactsPage";
import { AuthProvider } from "./portal/AuthContext";
import { LoginPage } from "./portal/LoginPage";
import { ProtectedRoute } from "./portal/ProtectedRoute";
import { PortalLayout } from "./portal/PortalLayout";
import { HierarchyPage } from "./portal/HierarchyPage";
import { ReglamentPage } from "./portal/ReglamentPage";
import { AdminPage } from "./portal/AdminPage";

function PublicSite() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pro-likarniu" element={<AboutPage />} />
        <Route path="/spivrobitnyky" element={<StaffPage />} />
        <Route path="/kontakty" element={<ContactsPage />} />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/portal" element={<LoginPage />} />
        <Route
          path="/portal/dashboard"
          element={
            <ProtectedRoute>
              <PortalLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HierarchyPage />} />
          <Route path="reglament" element={<ReglamentPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
        <Route path="/*" element={<PublicSite />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;