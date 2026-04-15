import React, { useContext, useState, useEffect, useCallback } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";
import apiClient, { apiErrorMessage } from "../utils/apiClient";

const months = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const slotDateFormat = (slotDate) => {
  const dateArray = slotDate.split("-");
  return (
    dateArray[0] + " " + months[Number(dateArray[1])] + " " + dateArray[2]
  );
};

const formatCountdown = (ms) => {
  if (ms <= 0) return "expired";
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
};

const MyAppointments = () => {
  const { token, getDoctorsData } = useContext(AppContext);
  const [appointments, setAppointments] = useState([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const getUserAppointments = useCallback(async () => {
    try {
      const { data } = await apiClient.get("/api/user/appointments");
      if (data.success) {
        setAppointments([...data.appointments].reverse());
      }
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  }, []);

  const cancelAppointment = async (appointmentId) => {
    try {
      const { data } = await apiClient.post("/api/user/cancel-appointment", {
        appointmentId,
      });
      if (data.success) {
        toast.success(data.message);
        getUserAppointments();
        getDoctorsData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const handlePay = async (appointment) => {
    try {
      const { data } = await apiClient.post("/api/user/initiate-payment", {
        appointmentId: appointment._id,
      });
      if (data.success) {
        window.location.href = data.authorization_url;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(apiErrorMessage(error, "Payment initialization failed"));
    }
  };

  useEffect(() => {
    if (token) {
      getUserAppointments();
      getDoctorsData();
    }
  }, [token, getUserAppointments, getDoctorsData]);

  return (
    <div className="p-4">
      <p className="text-xl font-semibold mb-4">My Appointments</p>

      <div>
        {appointments.length === 0 && (
          <p className="text-gray-500 mt-4">No appointments found.</p>
        )}

        {appointments.map((item) => (
          <div
            className="grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-4 border-b"
            key={item._id}
          >
            <div>
              <img
                className="w-32 h-32 object-cover bg-indigo-50 rounded"
                src={item.docData?.image}
                alt={item.docData?.name || "Doctor"}
              />
            </div>

            <div className="flex-1 text-sm text-zinc-600">
              <p className="text-neutral-800 font-semibold text-lg">
                {item.docData?.name}
              </p>

              <p className="capitalize">{item.docData?.speciality}</p>

              <p className="text-zinc-700 font-medium mt-2">Address:</p>
              <p className="text-sm">{item.docData?.address?.line1}</p>
              <p className="text-sm">{item.docData?.address?.line2}</p>

              <p className="text-sm mt-2">
                <span className="font-medium text-neutral-700">
                  Date & Time:
                </span>
                {slotDateFormat(item.slotDate)} | {item.slotTime}
              </p>
            </div>

            <div className="flex flex-col gap-2 justify-end">
              {(() => {
                const expiryMs = item.paymentExpiresAt
                  ? new Date(item.paymentExpiresAt).getTime() - now
                  : null;
                const isOnlinePending =
                  item.paymentMethod === "online" &&
                  !item.payment &&
                  !item.cancelled &&
                  !item.isCompleted;
                const isExpired =
                  isOnlinePending && expiryMs !== null && expiryMs <= 0;
                const showPay = isOnlinePending && !isExpired;

                return (
                  <>
                    {showPay && (
                      <button
                        onClick={() => handlePay(item)}
                        className="text-sm text-stone-500 text-center sm:min-w-40 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300"
                      >
                        Pay Online ({formatCountdown(expiryMs)})
                      </button>
                    )}

                    {isExpired && (
                      <button
                        disabled
                        className="sm:min-w-48 py-2 border border-gray-400 rounded text-gray-500"
                      >
                        Payment window expired
                      </button>
                    )}

                    {item.paymentMethod === "cash" &&
                      !item.payment &&
                      !item.cancelled &&
                      !item.isCompleted && (
                        <button
                          disabled
                          className="sm:min-w-48 py-2 border border-amber-500 rounded text-amber-600"
                        >
                          Pay at visit
                        </button>
                      )}

                    {!item.cancelled && !item.isCompleted && !isExpired && (
                      <button
                        onClick={() => cancelAppointment(item._id)}
                        className="text-sm text-stone-500 text-center sm:min-w-40 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300"
                      >
                        Cancel Appointment
                      </button>
                    )}

                    {item.cancelled && !item.isCompleted && (
                      <button
                        disabled
                        className="sm:min-w-48 py-2 border border-red-500 rounded text-red-500"
                      >
                        Appointment cancelled
                      </button>
                    )}

                    {item.payment && !item.cancelled && (
                      <button
                        disabled
                        className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500"
                      >
                        Paid
                      </button>
                    )}

                    {item.isCompleted && (
                      <button
                        disabled
                        className="sm:min-w-48 py-2 border border-green-500 rounded text-green-500"
                      >
                        Completed
                      </button>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyAppointments;
