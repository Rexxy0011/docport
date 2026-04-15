import React, { useEffect, useRef, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";
import apiClient, { apiErrorMessage } from "../utils/apiClient";

const PaymentSuccess = () => {
  const { getDoctorsData } = useContext(AppContext);
  const [params] = useSearchParams();
  const reference = params.get("reference");
  const navigate = useNavigate();

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const verifyPayment = async () => {
      try {
        const { data } = await apiClient.post("/api/user/verify-payment", {
          reference,
        });

        if (data.success) {
          toast.success("Payment Successful!");
          getDoctorsData?.();
          setTimeout(() => navigate("/my-appointments"), 800);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        toast.error(apiErrorMessage(error));
      }
    };

    verifyPayment();
  }, [reference, navigate, getDoctorsData]);

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
