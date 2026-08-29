import { API_BASE_URL, authFetch } from "../../../apiConfig";
import { useState, useEffect } from "react";
import { FaEye, FaEyeSlash, FaLock, FaArrowLeft } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ChangePassword = () => {
    const [username, setUsername] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await authFetch(`${API_BASE_URL}/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: username,
                    currentPassword: currentPassword,
                    newPassword: newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Password updated successfully!", { autoClose: 2000 });
                setTimeout(() => navigate("/Login"), 2000);
            } else {
                toast.error(data.message || "Failed to update password.", { autoClose: 2000 });
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("An error occurred. Please try again.", { autoClose: 2000 });
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-indigo-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-indigo-500 p-4 rounded-full shadow-lg mb-4">
                        <FaLock className="text-white text-3xl" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">Change Password</h2>
                    <p className="text-gray-500 mt-2">Keep your account secure</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-50 text-gray-800 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Current Password</label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full bg-gray-50 text-gray-800 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                            >
                                {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-gray-50 text-gray-800 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                            >
                                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                        </div>
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transform hover:-translate-y-1 transition-all shadow-lg active:scale-95 mt-4"
                    >
                        Update Password
                    </button>

                    <div className="flex flex-col space-y-4 pt-4 border-t border-gray-100 mt-6">
                        <Link 
                            to="/ChangeUsername" 
                            className="text-center text-indigo-600 font-medium hover:text-indigo-800 hover:underline transition-colors"
                        >
                            Change username instead?
                        </Link>
                        
                        <Link 
                            to="/Admin" 
                            className="flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <FaArrowLeft className="mr-2" /> Back to Dashboard
                        </Link>
                    </div>
                </form>
            </div>
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        </div>
    );
};

export default ChangePassword;
