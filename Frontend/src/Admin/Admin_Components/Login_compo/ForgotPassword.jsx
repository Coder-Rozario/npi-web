import { API_BASE_URL } from "../../../apiConfig";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [isModalOpen, setModalOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOTPButton = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/send-otp`);

      if (response.status === 200) {
        toast.success("OTP sent successfully! Please check your email.");
        setModalOpen(true);
      }
    } catch  {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = () => {
    setModalOpen(false);
    toast.info("OTP submitted successfully!");
    navigate("/OTP_page");
  };

  const handleModalCancel = () => {
    setModalOpen(false);
    toast.info("OTP submission canceled.");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black">
      <form className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Forgot Password</h2>
        <p className="text-sm text-gray-600 mb-4 text-center">
        We will send an OTP to your registered email address.
        </p>
        <button
          type="button"
          onClick={handleOTPButton}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded w-full mt-7"
          disabled={loading}
        >
          {loading ? "Sending OTP..." : "Click For OTP"}
        </button>

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black flex items-center justify-center otp_modal">
          <div className="bg-white rounded-lg shadow-lg w-96 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Enter OTP</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please enter the OTP sent to your email
            </p>
            <input
              type="number"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full bg-white p-2 border mb-10 rounded mb-4 focus:outline-none focus:ring-2"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleModalSubmit}
                className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded"
              >
                Submit
              </button>
              <button
                onClick={handleModalCancel}
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} theme="colored" /> 
    </div>
  );
};

export default ForgotPassword;
