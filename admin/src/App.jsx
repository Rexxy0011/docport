import React, { useContext } from "react";
import Login from "./pages/Login";
import { AdminContext } from "./context/AdminContext";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Navigate, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Admin/Dashboard";
import AllApointments from "./pages/Admin/AllApointments";
import AddDoctor from "./pages/Admin/AddDoctor";
import DoctorsList from "./pages/Admin/DoctorsList";
import { DoctorContext } from "./context/DoctorContext";
import { Toaster } from "react-hot-toast";
import DoctorDashboard from "./pages/Doctor/DoctorDashboard";
import DoctorAppointment from "./pages/Doctor/DoctorAppointment";
import DoctorProfile from "./pages/Doctor/DoctorProfile";

const App = () => {
  const { aToken } = useContext(AdminContext);
  const { dToken } = useContext(DoctorContext);

  if (!aToken && !dToken) {
    return (
      <>
        <Login />
        <Toaster position="top-center" />
      </>
    );
  }

  const homeRedirect = aToken ? "/admin-dashboard" : "/doctor-dashboard";

  return (
    <div className="bg-[#f8f9fd]">
      <Toaster position="top-center" />
      <Navbar />

      <div className="flex items-start">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Navigate to={homeRedirect} replace />} />

          {aToken && (
            <>
              <Route path="/admin-dashboard" element={<Dashboard />} />
              <Route path="/all-appointments" element={<AllApointments />} />
              <Route path="/add-doctor" element={<AddDoctor />} />
              <Route path="/doctor-list" element={<DoctorsList />} />
            </>
          )}

          {dToken && (
            <>
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
              <Route
                path="/doctor-appointments"
                element={<DoctorAppointment />}
              />
              <Route path="/doctor-profile" element={<DoctorProfile />} />
            </>
          )}

          <Route path="*" element={<Navigate to={homeRedirect} replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
