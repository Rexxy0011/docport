import React, { useEffect, useRef, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { AppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const PaymentSuccess = () => {
  const { backendUrl, token, getUserAppointments, getDoctorsData } =
    useContext(AppContext);

  const [params] = useSearchParams();
  const reference = params.get("reference");
  const navigate = useNavigate();

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const verifyPayment = async () => {
      try {
        const { data } = await axios.post(
          backendUrl + "/api/user/verify-payment",
          { reference },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (data.success) {
          toast.success("Payment Successful!");

          getUserAppointments?.();
          getDoctorsData?.();

          setTimeout(() => {
            navigate("/my-appointments");
          }, 800);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message);
      }
    };

    verifyPayment();
  }, [
    reference,
    backendUrl,
    token,
    navigate,
    getUserAppointments,
    getDoctorsData,
  ]);

  return (
    <div className="p-6 text-center">
      <h2 className="text-xl font-semibold">Verifying Payment...</h2>
      <p className="text-gray-500 mt-2">
        Please wait while we confirm your transaction.
      </p>
    </div>
  );
};

export default PaymentSuccess;
