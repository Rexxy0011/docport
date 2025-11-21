import React from "react";
import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <div className="md:mx-10">
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        {/* -----left section---- */}
        <div>
          <img className="mb-5 w-40" src={assets.logo} alt="" />
          <p className="w-full md:w-2/3 text-gray-600 leading-6">
            At DocPort, we believe everyone deserves easy access to quality
            care. Book appointments, meet experts, and manage your health — all
            in one place
          </p>
        </div>
        {/* -----center section---- */}
        <div className="">
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li>Home</li>
            <li>About us</li>
            <li>Contact us</li>
            <li>Privacy policy</li>
          </ul>
        </div>
        {/* -----right section---- */}
        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-2 text-gray-600">
            <li>+234 807 788 3737</li>
            <li>Asai@gmail.com</li>
          </ul>
        </div>
      </div>
      {/* COPYRIGHT */}
      <div>
        <hr />

        <p className="text-sm text-gray-400 py-5 text-center">
          © 2025 DocPort. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;
