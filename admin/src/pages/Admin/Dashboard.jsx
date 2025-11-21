import React, { useContext, useEffect } from "react";
import { AdminContext } from "../../context/AdminContext";
import { assets } from "../../assets/assets";
import { AppContext } from "../../context/AppContext";

const Dashboard = () => {
  const { aToken, getDashData, cancelAppointment, dashData } =
    useContext(AdminContext);

  const { slotDateFormat } = useContext(AppContext);

  useEffect(() => {
    if (aToken) getDashData();
  }, [aToken]);

  if (!dashData) return null;

  return (
    <div className="m-5">
      {/* Top Stats */}
      <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap">
        {/* Doctors */}
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
            src={assets.doctor_icon}
            alt="doctor icon"
          />
          <div className="text-center sm:text-left">
            <p className="text-lg sm:text-xl font-semibold text-gray-600">
              {dashData.doctors}
            </p>
            <p className="text-gray-400 text-sm">Doctors</p>
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
              {dashData.appointment}
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
              {/* Doctor Image */}
              <div className="flex items-center gap-3">
                <img
                  src={item.docData?.image}
                  alt="doctor"
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-700">
                    {item.docData?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {slotDateFormat(item.slotDate)}
                  </p>
                </div>
              </div>

              {/* Cancel / Status */}
              <div>
                {item.cancelled ? (
                  <p className="text-red-400 text-xs font-medium">Cancelled</p>
                ) : item.isCompleted ? (
                  <p className="text-green-500 text-xs font-medium">
                    Completed
                  </p>
                ) : (
                  <img
                    onClick={() => cancelAppointment(item._id)}
                    src={assets.cancel_icon}
                    alt="cancel"
                    className="w-10 cursor-pointer"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
