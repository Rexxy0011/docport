import React, { useContext, useState } from "react";
import { assets } from "../../assets/assets";
import { AdminContext } from "../../context/AdminContext";
import { toast } from "react-hot-toast";
import axios from "axios";

const AddDoctor = () => {
  const [docImg, setDocImg] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [experience, setExperience] = useState("1 Year");
  const [fees, setFees] = useState("");
  const [about, setAbout] = useState("");
  const [speciality, setSpeciality] = useState("General Physician");

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [degree, setDegree] = useState("");

  const { backendUrl, aToken } = useContext(AdminContext);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    try {
      if (!docImg) {
        return toast.error("Image not selected");
      }

      const formData = new FormData();

      formData.append("image", docImg);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("experience", experience);
      formData.append("fees", Number(fees));
      formData.append("about", about);
      formData.append("speciality", speciality);
      formData.append("degree", degree);
      formData.append(
        "address",
        JSON.stringify({ line1: address1, line2: address2 })
      );

      const { data } = await axios.post(
        backendUrl + "/api/admin/add-doctor",
        formData,
        { headers: { Authorization: `Bearer ${aToken}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setDocImg(false);
        setName("");
        setPassword("");
        setEmail("");
        setAddress1("");
        setAddress2("");
        setDegree("");
        setFees("");
        setAbout("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
      console.log(error);
    }
  };

  return (
    <form onSubmit={onSubmitHandler} className="m-4 w-full max-w-4xl mx-auto">
      <p className="mb-4 text-xl font-semibold text-gray-800">Add Doctor</p>

      <div className="bg-white px-6 py-8 border rounded-xl shadow-sm w-full max-h-[80vh] overflow-y-auto">
        {/* Upload Image */}
        <div className="flex items-center gap-4 mb-8">
          <label htmlFor="doc-img" className="cursor-pointer">
            <img
              className="w-20 h-20 rounded-full object-cover border shadow-sm bg-gray-100"
              src={docImg ? URL.createObjectURL(docImg) : assets.upload_area}
              alt=""
            />
          </label>
          <input
            onChange={(e) => setDocImg(e.target.files[0])}
            type="file"
            id="doc-img"
            hidden
          />
          <p className="text-gray-500 text-sm">
            <span className="font-medium text-gray-700">
              Upload doctor picture
            </span>
            <br />
            JPG, PNG only
          </p>
        </div>

        {/* Two Columns */}
        <div className="flex flex-col lg:flex-row gap-8 text-gray-700">
          {/* Left Column */}
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="font-medium">Doctor Name</p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                type="text"
                placeholder="Name"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-medium">Doctor Email</p>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                type="email"
                placeholder="Email"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-medium">Doctor Password</p>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                type="password"
                placeholder="Password"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-medium">Experience</p>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                className="border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-400 outline-none"
              >
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i} value={`${i + 1} Years`}>
                    {i + 1} {i + 1 === 1 ? "Year" : "Years"}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-medium">Fees</p>
              <input
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                type="number"
                placeholder="Consultation Fees"
                required
              />
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full lg:flex-1 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="font-medium">Speciality</p>
              <select
                value={speciality}
                onChange={(e) => setSpeciality(e.target.value)}
                className="border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-400 outline-none"
              >
                <option value="General Physician">General Physician</option>
                <option value="Gynecologist">Gynecologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Pediatrician">Pediatrician</option>
                <option value="Neurologist">Neurologist</option>
                <option value="Gastroenterologist">Gastroenterologist</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-medium">Education</p>
              <input
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                type="text"
                placeholder="Degree / Certification"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <p className="font-medium">Address</p>
              <input
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                type="text"
                placeholder="Address line 1"
                required
              />
              <input
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
                type="text"
                placeholder="Address line 2"
                required
              />
            </div>
          </div>
        </div>

        {/* About */}
        <div>
          <p className="mt-6 mb-2 font-medium">About Doctor</p>
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="w-full px-4 pt-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            rows={5}
            placeholder="Write about the doctor..."
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 transition px-10 py-3 mt-6 text-white rounded-full font-medium shadow-md"
        >
          Add Doctor
        </button>
      </div>
    </form>
  );
};

export default AddDoctor;
