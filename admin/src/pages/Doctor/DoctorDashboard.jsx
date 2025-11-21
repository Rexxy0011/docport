import React, { useContext, useEffect } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";

const DoctorDashboard = () => {
  const {
    dToken,
    dashData,
    getDashData,
    completeAppointment,
    cancelAppointment,
  } = useContext(DoctorContext);

  const { currency, slotDateFormat } = useContext(AppContext);

  useEffect(() => {
    if (dToken) {
      getDashData();
    }
  }, [dToken]);

  return (
    dashData && (
      <div className="m-5">
        {/* Top Stats - UPDATED FOR SMALL SCREEN */}
        <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap">
          {/* Earnings */}
          <div
            className="
              flex flex-col items-center justify-center 
              bg-white p-4 rounded-2xl 
              sm:flex-row sm:items-center sm:gap-2 sm:rounded
              border-2 border-gray-100 cursor-pointer 
              hover:scale-105 transition-all
            "
          >
            <img
              className="w-12 sm:w-14"
              src={assets.earning_icon}
              alt="earnings icon"
            />
            <div className="text-center sm:text-left">
              <p className="text-lg sm:text-xl font-semibold text-gray-600">
                {currency}
                {dashData.earnings}
              </p>
              <p className="text-gray-400 text-sm">Earnings</p>
            </div>
          </div>

          {/* Appointments */}
          <div
            className="
              flex flex-col items-center justify-center
              bg-white p-4 rounded-2xl
              sm:flex-row sm:items-center sm:gap-2 sm:rounded
              border-2 border-gray-100 cursor-pointer
              hover:scale-105 transition-all
            "
          >
            <img
              className="w-12 sm:w-14"
              src={assets.appointments_icon}
              alt="appointments icon"
            />
            <div className="text-center sm:text-left">
              <p className="text-lg sm:text-xl font-semibold text-gray-600">
                {dashData.appointments}
              </p>
              <p className="text-gray-400 text-sm">Appointments</p>
            </div>
          </div>

          {/* Patients */}
          <div
            className="
              flex flex-col items-center justify-center
              bg-white p-4 rounded-2xl
              sm:flex-row sm:items-center sm:gap-2 sm:rounded
              border-2 border-gray-100 cursor-pointer
              hover:scale-105 transition-all
            "
          >
            <img
              className="w-12 sm:w-14"
              src={assets.patients_icon}
              alt="patients icon"
            />
            <div className="text-center sm:text-left">
              <p className="text-lg sm:text-xl font-semibold text-gray-600">
                {dashData.patients}
              </p>
              <p className="text-gray-400 text-sm">Patients</p>
            </div>
          </div>
        </div>

        {/* Latest Bookings */}
        <div className="bg-white mt-10 border rounded">
          <div className="flex items-center gap-2.5 px-4 py-4 border-b">
            <img src={assets.list_icon} alt="list" />
            <p className="font-semibold">Latest Bookings</p>
          </div>

          <div className="divide-y">
            {dashData.latestAppointments.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-all"
              >
                {/* Patient Image */}
                <div className="flex items-center gap-3">
                  <img
                    src={item.userData.image}
                    alt="patient"
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-700">
                      {item.userData.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {slotDateFormat(item.slotDate)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  {item.cancelled ? (
                    <p className="text-red-500 font-semibold text-xs bg-red-100 px-3 py-1 rounded-full">
                      Cancelled
                    </p>
                  ) : item.isCompleted ? (
                    <p className="text-green-600 font-semibold text-xs bg-green-100 px-3 py-1 rounded-full">
                      Completed
                    </p>
                  ) : (
                    <div className="flex gap-2">
                      <img
                        onClick={() => cancelAppointment(item._id)}
                        className="w-10 cursor-pointer hover:opacity-70"
                        src={assets.cancel_icon}
                        alt="cancel"
                      />

                      <img
                        onClick={() => completeAppointment(item._id)}
                        className="w-10 cursor-pointer hover:opacity-70"
                        src={assets.tick_icon}
                        alt="complete"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  );
};

export default DoctorDashboard;
