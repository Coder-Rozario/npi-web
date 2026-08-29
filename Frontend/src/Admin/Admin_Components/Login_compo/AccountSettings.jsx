import { API_BASE_URL } from "../../../apiConfig";
import { useState } from "react";
import { FaEye, FaEyeSlash, FaLock, FaUserEdit, FaArrowLeft } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AccountSettings = () => {
    const [activeTab, setActiveTab] = useState("username");
    const navigate = useNavigate();

    // Username state
    const [currentUsername, setCurrentUsername] = useState("");
    const [newUsername, setNewUsername] = useState("");

    // Password state
    const [username, setUsername] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Handle Username Change
    const handleUsernameSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`${API_BASE_URL}/change-username`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentUsername: currentUsername,
                    newUsername: newUsername,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Username updated successfully!", { autoClose: 2000 });
                setCurrentUsername("");
                setNewUsername("");
                setTimeout(() => navigate("/Login"), 2000);
            } else {
                toast.error(data.message || "Failed to update username.", { autoClose: 2000 });
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("An error occurred. Please try again.", { autoClose: 2000 });
        }
    };

    // Handle Password Change
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(`${API_BASE_URL}/change-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
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
                setUsername("");
                setCurrentPassword("");
                setNewPassword("");
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
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200">
                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-full shadow-lg mb-4">
                        <FaUserEdit className="text-white text-3xl" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">Account Settings</h2>
                    <p className="text-gray-500 mt-2">Manage your admin credentials</p>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-8 border-b border-slate-200">
                    <button
                        onClick={() => setActiveTab("username")}
                        className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                            activeTab === "username"
                                ? "text-blue-600 border-blue-600"
                                : "text-gray-600 border-transparent hover:text-gray-800"
                        }`}
                    >
                        <FaUserEdit className="inline mr-2" /> Change Username
                    </button>
                    <button
                        onClick={() => setActiveTab("password")}
                        className={`px-6 py-3 font-semibold transition-all border-b-2 ${
                            activeTab === "password"
                                ? "text-indigo-600 border-indigo-600"
                                : "text-gray-600 border-transparent hover:text-gray-800"
                        }`}
                    >
                        <FaLock className="inline mr-2" /> Change Password
                    </button>
                </div>

                {/* Username Tab */}
                {activeTab === "username" && (
                    <form onSubmit={handleUsernameSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="currentUsername" className="block text-sm font-semibold text-gray-700 mb-2">
                                Current Username
                            </label>
                            <input
                                type="text"
                                id="currentUsername"
                                value={currentUsername}
                                onChange={(e) => setCurrentUsername(e.target.value)}
                                className="w-full bg-gray-50 text-gray-800 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                placeholder="Enter current username"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="newUsername" className="block text-sm font-semibold text-gray-700 mb-2">
                                New Username
                            </label>
                            <input
                                type="text"
                                id="newUsername"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                className="w-full bg-gray-50 text-gray-800 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                                placeholder="Enter new username"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 transform hover:-translate-y-1 transition-all shadow-lg active:scale-95"
                        >
                            Update Username
                        </button>
                    </form>
                )}

                {/* Password Tab */}
                {activeTab === "password" && (
                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
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
                    </form>
                )}

                {/* Footer Links */}
                <div className="flex flex-col space-y-3 pt-6 border-t border-gray-100 mt-8">
                    <Link
                        to="/Admin"
                        className="flex items-center justify-center text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    >
                        <FaArrowLeft className="mr-2" /> Back to Dashboard
                    </Link>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        </div>
    );
};

export default AccountSettings;
