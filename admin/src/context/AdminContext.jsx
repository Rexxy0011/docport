import { createContext, useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  adminApi,
  apiErrorMessage,
  setUnauthorizedHandler,
} from "../utils/apiClient";

// eslint-disable-next-line react-refresh/only-export-components
export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [aToken, setATokenState] = useState(
    () => localStorage.getItem("aToken") || ""
  );
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(false);

  const setAToken = useCallback((next) => {
    if (next) {
      localStorage.setItem("aToken", next);
      setATokenState(next);
    } else {
      localStorage.removeItem("aToken");
      setATokenState("");
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler("aToken", () => {
      localStorage.removeItem("aToken");
      setATokenState("");
    });
  }, []);

  const getAllDoctors = useCallback(async () => {
    try {
      const { data } = await adminApi.post("/api/admin/all-Doctors", {});
      if (data.success) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }, []);

  const changeAvailability = useCallback(
    async (docId) => {
      try {
        const { data } = await adminApi.post(
          "/api/admin/change-availability",
          { docId }
        );
        if (data.success) {
          toast.success(data.message);
          getAllDoctors();
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(apiErrorMessage(error));
      }
    },
    [getAllDoctors]
  );

  const getAllAppointments = useCallback(async () => {
    try {
      const { data } = await adminApi.post("/api/admin/appointments", {});
      if (data.success) {
        setAppointments(data.appointments);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }, []);

  const cancelAppointment = useCallback(
    async (appointmentId) => {
      try {
        const { data } = await adminApi.post("/api/admin/cancel-appointment", {
          appointmentId,
        });
        if (data.success) {
          toast.success(data.message);
          getAllAppointments();
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(apiErrorMessage(error));
      }
    },
    [getAllAppointments]
  );

  const getDashData = useCallback(async () => {
    try {
      const { data } = await adminApi.get("/api/admin/dashboard");
      if (data.success) {
        setDashData(data.dashData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }, []);

  const value = {
    aToken,
    setAToken,
    backendUrl,
    doctors,
    getAllDoctors,
    changeAvailability,
    appointments,
    getAllAppointments,
    setAppointments,
    cancelAppointment,
    dashData,
    getDashData,
  };

  return (
    <AdminContext.Provider value={value}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
