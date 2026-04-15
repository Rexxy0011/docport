import { createContext, useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  doctorApi,
  apiErrorMessage,
  setUnauthorizedHandler,
} from "../utils/apiClient";

// eslint-disable-next-line react-refresh/only-export-components
export const DoctorContext = createContext();

const DoctorContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [dToken, setDTokenState] = useState(
    () => localStorage.getItem("dToken") || ""
  );
  const [appointments, setAppointments] = useState([]);
  const [dashData, setDashData] = useState(false);
  const [profileData, setProfileData] = useState(false);

  const setDToken = useCallback((next) => {
    if (next) {
      localStorage.setItem("dToken", next);
      setDTokenState(next);
    } else {
      localStorage.removeItem("dToken");
      setDTokenState("");
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler("dToken", () => {
      localStorage.removeItem("dToken");
      setDTokenState("");
    });
  }, []);

  const getAppointments = useCallback(async () => {
    if (!localStorage.getItem("dToken")) return;
    try {
      const { data } = await doctorApi.get("/api/doctor/appointments");
      if (data.success) {
        setAppointments(data.appointments);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }, []);

  const completeAppointment = useCallback(
    async (appointmentId) => {
      try {
        const { data } = await doctorApi.post(
          "/api/doctor/complete-appointment",
          { appointmentId }
        );
        if (data.success) {
          toast.success(data.message);
          getAppointments();
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(apiErrorMessage(error));
      }
    },
    [getAppointments]
  );

  const cancelAppointment = useCallback(
    async (appointmentId) => {
      try {
        const { data } = await doctorApi.post(
          "/api/doctor/cancel-appointment",
          { appointmentId }
        );
        if (data.success) {
          toast.success(data.message);
          getAppointments();
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(apiErrorMessage(error));
      }
    },
    [getAppointments]
  );

  const getDashData = useCallback(async () => {
    try {
      const { data } = await doctorApi.get("/api/doctor/dashboard");
      if (data.success) {
        setDashData(data.dashData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }, []);

  const getProfileData = useCallback(async () => {
    try {
      const { data } = await doctorApi.get("/api/doctor/profile");
      if (data.success) {
        setProfileData(data.profileData);
      }
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }, []);

  const value = {
    backendUrl,
    dToken,
    setDToken,
    appointments,
    getAppointments,
    completeAppointment,
    cancelAppointment,
    dashData,
    setDashData,
    getDashData,
    profileData,
    getProfileData,
    setProfileData,
  };

  return (
    <DoctorContext.Provider value={value}>
      {props.children}
    </DoctorContext.Provider>
  );
};

export default DoctorContextProvider;
