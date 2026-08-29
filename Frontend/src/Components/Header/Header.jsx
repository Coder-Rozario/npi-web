import { API_BASE_URL } from "../../apiConfig";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFacebookF, faLinkedinIn, faTwitter, faYoutube } from "@fortawesome/free-brands-svg-icons";
import { motion } from "framer-motion";

const Header = () => {
    const [content, setContent] = useState({
        marqueeText: "",
        facebookLink: "",
        linkedinLink: "",
        twitterLink: "",
        youtubeLink: ""
    });

    const instituteColor = "#0186C0";

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/get-web-data`);
                const data = await response.json();
                if (data) {
                    setContent(prev => ({
                        ...prev,
                        ...data
                    }));
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };
        fetchData();
    }, []);

    return (
        <header className="hidden sm:block w-full sticky top-0 z-50 overflow-hidden font-sans">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ backgroundColor: instituteColor }}
                className="w-full text-white py-1.5 px-4 md:px-8 flex justify-between items-center"
            >
                <div className="flex-1 overflow-hidden relative h-6 flex items-center marquee-viewport">
                    <style>
                        {`
                        @keyframes fullScroll {
                            0% { transform: translateX(100vw); }
                            100% { transform: translateX(-100%); }
                        }
                        .marquee-wrapper {
                            display: inline-block;
                            white-space: nowrap;
                            will-change: transform;
                            animation: fullScroll 20s linear infinite;
                            cursor: pointer;
                        }
                        .marquee-wrapper:hover { animation-play-state: paused; }
                        .marquee-text {
                            font-size: 13px;
                            font-weight: 600;
                            letter-spacing: 0.5px;
                            text-transform: uppercase;
                            padding-right: 20px;
                        }
                        .marquee-viewport {
                            -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
                            mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
                        }
                        `}
                    </style>
                    <div className="marquee-wrapper">
                        <span className="marquee-text italic">
                            {content.marqueeText}
                        </span>
                    </div>
                </div>
                <div
                    className="hidden sm:flex items-center space-x-4 border-l border-white/20 pl-4"
                    style={{ backgroundColor: instituteColor }}
                >
                    {[
                        { icon: faFacebookF, link: content.facebookLink },
                        { icon: faLinkedinIn, link: content.linkedinLink },
                        { icon: faTwitter, link: content.twitterLink },
                        { icon: faYoutube, link: content.youtubeLink }
                    ]
                        .filter(item => typeof item.link === "string" && item.link.trim() !== "" && item.link.trim() !== "#")
                        .map((item, index) => (
                        <motion.a
                            key={index}
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            whileHover={{ scale: 1.2, y: -1 }}
                            className="bg-white text-[#0186C0] w-7 h-7 rounded-full flex items-center justify-center transition-all shadow-sm"
                        >
                            <FontAwesomeIcon icon={item.icon} className="text-[12px]" />
                        </motion.a>
                    ))}
                </div>
            </motion.div>
        </header>
    );
};

export default Header;
