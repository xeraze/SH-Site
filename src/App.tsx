import { useEffect } from "react";
import { Route, Routes, Navigate, useLocation, useParams } from "react-router-dom";
import { fetchMe, getToken } from "./api";
import { hrefFor } from "./utils/links";
import { SiteHeader } from "./components/Head";
import { Footer } from "./components/Footer";
import { OnboardingTour } from "./components/Navigator";
import { HomePage } from "./pages/Home";
import { AboutPage } from "./pages/About";
import { DepartmentsPage } from "./pages/Departments";
import { DocumentationPage } from "./pages/Documentation";
import { PatientsPage } from "./pages/ForPatients";
import { ContactsPage } from "./pages/Links";
import { ApplicationsPage } from "./pages/Applications";
import { ReviewsPage } from "./pages/Reviews";
import { CabinetPage } from "./pages/Cabinet";
import { PanelPage } from "./pages/MedPanel";
import { AnnouncementsPage } from "./pages/AnnouncementsPage";
import { AnnouncementPage } from "./pages/Announcements";
import { ArchivePage } from "./pages/Archive";
import { LegalPage } from "./pages/Legal";
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

function DeptRedirect() {
  const { deptId } = useParams();
  return <Navigate to={`/departments/${deptId}`} replace />;
}

function App() {
  return (
    <>
      <ProfileGuard />
      <OnboardingTour />
      <SiteHeader />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about-hospital" element={<AboutPage />} />
          <Route path="/departments" element={<DepartmentsPage />} />
          <Route path="/departments/:deptId" element={<DepartmentsPage />} />
          <Route path="/documentation" element={<DocumentationPage />} />
          <Route path="/for-patients" element={<PatientsPage />} />
          <Route path="/forms" element={<ApplicationsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
          <Route path="/zapys-na-pryiom" element={<AppointmentBookingPage />} />
          <Route path="/kabinet" element={<CabinetPage />} />
          <Route path="/panel" element={<PanelPage />} />
          <Route path="/oholoshennya" element={<AnnouncementsPage />} />
          <Route path="/oholoshennya/:annId" element={<AnnouncementPage />} />
          <Route path="/arhiv" element={<ArchivePage />} />
          <Route path="/links" element={<ContactsPage />} />
          <Route path="/umovy-korystuvannya" element={<LegalPage section="terms" />} />
          <Route path="/polityka-konfidenciynosti" element={<LegalPage section="privacy" />} />
          <Route
            path="/pro-likarniu"
            element={<Navigate to="/about-hospital" replace />}
          />
          <Route path="/viddilennya" element={<Navigate to="/departments" replace />} />
          <Route path="/viddilennya/:deptId" element={<DeptRedirect />} />
          <Route
            path="/dokumentaciya"
            element={<Navigate to="/documentation" replace />}
          />
          <Route
            path="/dlya-pacientiv"
            element={<Navigate to="/for-patients" replace />}
          />
          <Route path="/zayavky" element={<Navigate to="/forms" replace />} />
          <Route path="/vidguky" element={<Navigate to="/reviews" replace />} />
          <Route path="/kontakty" element={<Navigate to="/links" replace />} />
          <Route
            path="/umovy-ta-konfidentsiynist"
            element={<Navigate to="/umovy-korystuvannya" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
