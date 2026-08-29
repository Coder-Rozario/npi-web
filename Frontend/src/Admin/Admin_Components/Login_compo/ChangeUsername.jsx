import { API_BASE_URL, authFetch } from "../../../apiConfig";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUserEdit, FaArrowLeft } from "react-icons/fa";

const ChangeUsername = () => {
    const [currentUsername, setCurrentUsername] = useState("");
    const [newUsername, setNewUsername] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await authFetch(`${API_BASE_URL}/change-username`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentUsername: currentUsername,
                    newUsername: newUsername,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("Username updated successfully!", { autoClose: 2000 });
                setTimeout(() => navigate("/Login"), 2000);
            } else {
                toast.error(data.message || "Failed to update username.", { autoClose: 2000 });
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("An error occurred. Please try again.", { autoClose: 2000 });
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-blue-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-blue-500 p-4 rounded-full shadow-lg mb-4">
                        <FaUserEdit className="text-white text-3xl" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800">Change Username</h2>
                    <p className="text-gray-500 mt-2">Update your administrative identity</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
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

                    <div className="flex flex-col space-y-4 pt-4 border-t border-gray-100 mt-6">
                        <Link 
                            to="/ChangePassword" 
                            className="text-center text-blue-600 font-medium hover:text-blue-800 hover:underline transition-colors"
                        >
                            Need to change password instead?
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

export default ChangeUsername;
