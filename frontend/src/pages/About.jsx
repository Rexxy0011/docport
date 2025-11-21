import React from "react";
import { assets } from "../assets/assets";

const About = () => {
  return (
    <div>
      <div className="text-center text-2xl pt-10 text-gray-500">
        <p>
          ABOUT <span className="text-gray-700 font-medium">US</span>
        </p>
      </div>
      <div className="my-10 flex flex-col md:flex-row gap-12">
        <img
          className="w-full md:max-w-[360px]"
          src={assets.about_image}
          alt=""
        />
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600">
          <p>
            DocPort simplifies healthcare through technology. We bring patients
            and doctors together on one secure, easy-to-use platform — making
            appointments faster, smarter, and stress-free.
          </p>
          <p>
            we are committed to transforming how people experience healthcare.
            We believe technology should remove barriers, not create them —
            helping patients connect with verified doctors quickly, confidently,
            and securely.
          </p>
          <b className="text-gray-800">Our vision</b>
          <p>
            Our vision is to revolutionize the way people access healthcare
            through innovation and technology. We’re shaping a future where
            connecting with the right doctor is effortless, fast, and reliable —
            no matter where you are.
          </p>
        </div>
      </div>
      <div className="text-xl my-4">
        <p>
          WHY{" "}
          <span className="text-gray-700 font-semibold">CHOOSE US</span>{" "}
        </p>
      </div>
      <div className="flex flex-col md:flex-row mb-20">
        <div
          className="border px-10 md:px-16 py-8 sm:py -16 flex flex-col gap-5 text-[15px]
         hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer"
        >
          <b>Efficiency</b>
          <p>
            Get the care you need faster. DocPort streamlines the entire process
            — from finding a doctor to booking an appointment — saving you
            valuable time without compromising quality.
          </p>
        </div>
        <div
          className="border px-10 md:px-16 py-8 sm:py -16 flex flex-col gap-5 text-[15px]
         hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer"
        >
          <b> Convenience</b>
          <p>
            Access trusted healthcare anytime, anywhere. Whether you’re at home
            or on the go, DocPort lets you find doctors, schedule visits, and
            manage appointments with just a few taps.
          </p>
        </div>
        <div
          className="border px-10 md:px-16 py-8 sm:py -16 flex flex-col gap-5 text-[15px]
         hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer"
        >
          <b>Personalization</b>
          <p>
            Healthcare built around you. We connect you with doctors and
            specialists that match your unique needs, ensuring every experience
            feels tailored, comfortable, and personal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
