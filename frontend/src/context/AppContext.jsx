import { createContext, useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import apiClient, {
  apiErrorMessage,
  setUnauthorizedHandler,
} from "../utils/apiClient";

// eslint-disable-next-line react-refresh/only-export-components
export const AppContext = createContext();

const readStoredToken = () => {
  const raw = localStorage.getItem("token");
  if (!raw || raw === "false" || raw === "null" || raw === "undefined") {
    return null;
  }
  return raw;
};

const AppContextProvider = (props) => {
  const currencySymbol = "₦";
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [doctors, setDoctors] = useState([]);
  const [token, setTokenState] = useState(readStoredToken);
  const [userData, setUserData] = useState(null);

  const setToken = useCallback((next) => {
    if (next) {
      localStorage.setItem("token", next);
      setTokenState(next);
    } else {
      localStorage.removeItem("token");
      setTokenState(null);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem("token");
      setTokenState(null);
      setUserData(null);
    });
  }, []);

  const getDoctorsData = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/api/doctor/list");
      if (data.success) {
        setDoctors(data.doctors);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }, []);

  const loadUserProfileData = useCallback(async () => {
    try {
      const { data } = await apiClient.post("/api/user/get-profile", {});
      if (data.success) {
        setUserData(data.userData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      if (error?.response?.status !== 401) {
        toast.error(apiErrorMessage(error));
      }
    }
  }, []);

  useEffect(() => {
    getDoctorsData();
  }, [getDoctorsData]);

  useEffect(() => {
    if (token) {
      loadUserProfileData();
    } else {
      setUserData(null);
    }
  }, [token, loadUserProfileData]);

  const value = {
    doctors,
    getDoctorsData,
    currencySymbol,
    token,
    setToken,
    backendUrl,
    userData,
    setUserData,
    loadUserProfileData,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
