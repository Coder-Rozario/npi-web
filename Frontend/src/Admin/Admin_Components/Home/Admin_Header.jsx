import { API_BASE_URL, authFetch } from "../../../apiConfig";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faLinkedinIn, faTwitter, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Back_Header = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEditable, setCurrentEditable] = useState("");
    const [currentValue, setCurrentValue] = useState("");
    const [content, setContent] = useState({
        marqueeText: "Loading...",
        phoneNumbers: "",
        facebookLink: "",
        linkedinLink: "",
        twitterLink: "",
        youtubeLink: ""
    });

    const instituteColor = "#0186C0";


    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/get-web-data?t=${Date.now()}`, { cache: 'no-store' });
                const data = await response.json();
                if (data) {
                    setContent(data);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, []);

    const openModal = (editableKey) => {
        setCurrentEditable(editableKey);
        setCurrentValue(content[editableKey] || "");
        setIsModalOpen(true);
    };

    const closeModal = () => setIsModalOpen(false);

    const handleSave = async () => {
        try {
            const updatedContent = { ...content, [currentEditable]: currentValue };
            const response = await authFetch(`${API_BASE_URL}/update-web-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedContent),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success(data.message || "Updated successfully!");
                setContent(updatedContent);
            } else {
                toast.error(data.error);
            }
        } catch (error) {
            toast.error('Failed to update data.');
        }
        closeModal();
    };

    return (
        <header className="w-full sticky top-0 z-50 overflow-hidden font-sans border-b-4 border-yellow-400">
            
            <div className="bg-black text-[10px] text-white text-center py-0.5 uppercase tracking-widest">
                Admin Panel - Click items to edit
            </div>

            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="w-full text-white py-1.5 px-4 md:px-8 flex justify-between items-center"
                style={{ backgroundColor: instituteColor }}
            >
                
                <div 
                    className="flex-1 overflow-hidden relative h-6 flex items-center cursor-help group"
                    onClick={() => openModal("marqueeText")}
                    title="Click to edit marquee text"
                >
                    <style>
                        {`
                        @keyframes fullScroll {
                            0% { transform: translateX(100vw); } 
                            100% { transform: translateX(-100%); }
                        }
                        .marquee-wrapper {
                            display: inline-block;
                            white-space: nowrap;
                            animation: fullScroll 20s linear infinite;
                        }
                        .marquee-wrapper:hover { animation-play-state: paused; }
                        `}
                    </style>
                    <div className="marquee-wrapper border border-transparent group-hover:border-white/50 border-dashed px-2">
                        <span className="text-[13px] font-semibold uppercase italic tracking-wider">
                            {content.marqueeText || "click to edit marquee text"}
                        </span>
                    </div>
                </div>

                
                <div className="flex items-center space-x-4 border-l border-white/20 pl-4">
                    {[
                        { icon: faFacebookF, key: "facebookLink", color: "hover:bg-blue-600" },
                        { icon: faLinkedinIn, key: "linkedinLink", color: "hover:bg-blue-700" },
                        { icon: faTwitter, key: "twitterLink", color: "hover:bg-blue-400" },
                        { icon: faYoutube, key: "youtubeLink", color: "hover:bg-red-600" }
                    ].map((item, index) => (
                        <button
                            key={index}
                            onClick={() => openModal(item.key)}
                            className={`text-white/90 hover:text-white p-1 rounded transition-all border border-transparent hover:border-white/30`}
                            title={`Edit ${item.key}`}
                        >
                            <FontAwesomeIcon icon={item.icon} className="text-[12px]" />
                        </button>
                    ))}
                    
                    

                </div>
            </motion.div>

            
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-[9999]">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md border-t-8"
                        style={{ borderTopColor: instituteColor }}
                    >
                        <h2 className="text-xl font-bold mb-1 text-gray-800">Update Content</h2>
                        <p className="text-xs text-gray-500 mb-4 uppercase tracking-tighter">Editing: {currentEditable}</p>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                New Value:
                            </label>
                            <textarea
                                rows={3}
                                value={currentValue}
                                onChange={(e) => setCurrentValue(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0186C0] focus:outline-none text-black bg-gray-50"
                                placeholder="Enter text or link here..."
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={closeModal}
                                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-5 py-2.5 text-white rounded-lg font-medium shadow-lg transition-transform active:scale-95"
                                style={{ backgroundColor: instituteColor }}
                            >
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

        </header>
    );
};

export default Back_Header;
