import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { fetchMe, getToken } from "./api";
import { hrefFor } from "./utils/links";
import { SiteHeader } from "./components/SiteHeader";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { DepartmentsPage } from "./pages/DepartmentsPage";
import { StaffPage } from "./pages/StaffPage";
import { PatientsPage } from "./pages/PatientsPage";
import { ContactsPage } from "./pages/ContactsPage";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { CabinetPage } from "./pages/CabinetPage";
import { PanelPage } from "./pages/PanelPage";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { AnnouncementPage } from "./pages/AnnouncementPage";
import { ArchivePage } from "./pages/ArchivePage";
import { LegalPage } from "./pages/LegalPage";
import { AppointmentBookingPage } from "./pages/AppointmentBookingPage";

function ProfileGuard() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!getToken()) return;
    void fetchMe().then((me) => {
      if (!me?.needsProfile) return;
      if (window.location.pathname.startsWith(hrefFor("/kabinet"))) return;
      window.location.assign(hrefFor("/kabinet?tab=profile"));
    });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <>
      <ProfileGuard />
      <SiteHeader />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/pro-likarniu" element={<AboutPage />} />
          <Route path="/viddilennya" element={<DepartmentsPage />} />
          <Route path="/viddilennya/:deptId" element={<DepartmentsPage />} />
          <Route path="/spivrobitnyky" element={<StaffPage />} />
          <Route path="/dlya-pacientiv" element={<PatientsPage />} />
          <Route path="/zayavky" element={<ApplicationsPage />} />
          <Route path="/zapys-na-pryiom" element={<AppointmentBookingPage />} />
          <Route path="/kabinet" element={<CabinetPage />} />
          <Route path="/panel" element={<PanelPage />} />
          <Route path="/oholoshennya" element={<AnnouncementsPage />} />
          <Route path="/oholoshennya/:annId" element={<AnnouncementPage />} />
          <Route path="/arhiv" element={<ArchivePage />} />
          <Route path="/kontakty" element={<ContactsPage />} />
          <Route path="/umovy-ta-konfidentsiynist" element={<LegalPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
