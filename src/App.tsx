import { Route, Routes } from "react-router-dom";
import { NavBar } from "./components/NavBar";
import { Footer } from "./components/Footer";
import { HomePage } from "./pages/HomePage";
import { AboutPage } from "./pages/AboutPage";
import { DepartmentsPage } from "./pages/DepartmentsPage";
import { StaffPage } from "./pages/StaffPage";
import { PatientsPage } from "./pages/PatientsPage";
import { ContactsPage } from "./pages/ContactsPage";

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pro-likarniu" element={<AboutPage />} />
        <Route path="/viddilennya" element={<DepartmentsPage />} />
        <Route path="/viddilennya/:deptId" element={<DepartmentsPage />} />
        <Route path="/spivrobitnyky" element={<StaffPage />} />
        <Route path="/dlya-pacientiv" element={<PatientsPage />} />
        <Route path="/kontakty" element={<ContactsPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;