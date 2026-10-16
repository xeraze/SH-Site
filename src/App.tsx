import { Route, Routes } from "react-router-dom";
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

function App() {
  return (
    <>
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
          <Route path="/kabinet" element={<CabinetPage />} />
          <Route path="/panel" element={<PanelPage />} />
          <Route path="/oholoshennya" element={<AnnouncementsPage />} />
          <Route path="/oholoshennya/:annId" element={<AnnouncementPage />} />
          <Route path="/arhiv" element={<ArchivePage />} />
          <Route path="/kontakty" element={<ContactsPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App;
