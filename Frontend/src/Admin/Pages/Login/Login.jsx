import { API_BASE_URL } from "../../../apiConfig";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faKey, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [isPermanentLocked, setIsPermanentLocked] = useState(false);
    const [lockoutMessage, setLockoutMessage] = useState("");
    const [remainingTime, setRemainingTime] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const handleContextMenu = (event) => {
            event.preventDefault();
        };

        const handleKeyDown = (event) => {
            const key = event.key.toLowerCase();
            if (
                event.key === "F12" ||
                (event.ctrlKey && event.shiftKey && (key === "i" || key === "j")) ||
                (event.ctrlKey && key === "u") ||
                (event.ctrlKey && key === "s")
            ) {
                event.preventDefault();
            }
        };

        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    useEffect(() => {
        let timer;
        if (remainingTime > 0) {
            timer = setInterval(() => {
                setRemainingTime((prev) => {
                    if (prev <= 1) {
                        setIsLocked(false);
                        setLockoutMessage("");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [remainingTime]);

    useEffect(() => {
        checkLockoutStatus();
    }, []);

    useEffect(() => {
        return () => {
            setUsername("");
            setPassword("");
            setShowPassword(false);
        };
    }, []);

    const checkLockoutStatus = () => {
        const failedAttempts = parseInt(localStorage.getItem("failedAttempts") || "0");
        const lockoutUntil = parseInt(localStorage.getItem("lockoutUntil") || "0");
        const currentTime = Date.now();

        if (lockoutUntil > currentTime) {
            setIsLocked(true);
            const secondsLeft = Math.ceil((lockoutUntil - currentTime) / 1000);

            if (failedAttempts >= 7) {
                setIsPermanentLocked(true);
                setLockoutMessage("You have tried too many times. Your limit is exceeded. If you forgot your password, please contact the admin.");
            } else {
                setRemainingTime(secondsLeft);
            }
        } else {
            setIsLocked(false);
            setIsPermanentLocked(false);
            setLockoutMessage("");
            setRemainingTime(0);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const lockoutUntil = parseInt(localStorage.getItem("lockoutUntil") || "0");
        if (lockoutUntil > Date.now()) {
            checkLockoutStatus();
            return;
        }

        if (!username || !password) {
            toast.error("Username and password are required.", { autoClose: 2000 });
            return;
        }

        const payload = { username: username.trim(), password };
        const bodyStr = JSON.stringify(payload);

        try {
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Request-Type": "auth-login"
                },
                body: bodyStr,
                credentials: 'omit'
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.removeItem("failedAttempts");
                localStorage.removeItem("lockoutUntil");
                localStorage.setItem("authToken", data.token);
                setUsername("");
                setPassword("");
                setShowPassword(false);
                toast.success(data.message, { autoClose: 2000 });
                setTimeout(() => navigate("/Admin"), 1000);
            } else {
                setPassword("");
                const attempts = handleLoginFailure();

                let errorMessage = data.error || "Invalid username or password!";
                if (attempts === 1) {
                    errorMessage = "Invalid credentials! 2 attempts left before 1 min lockout.";
                } else if (attempts === 2) {
                    errorMessage = "Last attempt! Next failure will lock your account for 1 minute.";
                } else if (attempts === 3) {
                    errorMessage = "Account locked for 1 minute due to 3 failed attempts.";
                } else if (attempts === 4) {
                    errorMessage = "Invalid! One more failure will lock your account for 10 minutes.";
                } else if (attempts === 5) {
                    errorMessage = "Account locked for 10 minutes due to 5 failed attempts.";
                } else if (attempts === 6) {
                    errorMessage = "WARNING! One more failure will result in a 1-week lockout.";
                }

                toast.error(errorMessage, {
                    autoClose: attempts >= 3 ? 3000 : 2000,
                    pauseOnHover: true
                });
            }
        } catch {
            setPassword("");
            toast.error("An error occurred. Please try again.", { autoClose: 1000 });
        }
    };

    const handleLoginFailure = () => {
        let failedAttempts = parseInt(localStorage.getItem("failedAttempts") || "0") + 1;
        localStorage.setItem("failedAttempts", failedAttempts.toString());

        let lockoutTime = 0;

        if (failedAttempts === 3) {

            lockoutTime = Date.now() + 1 * 60 * 1000;
        } else if (failedAttempts === 5) {

            lockoutTime = Date.now() + 10 * 60 * 1000;
        } else if (failedAttempts >= 7) {

            lockoutTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
        }

        if (lockoutTime > 0) {
            localStorage.setItem("lockoutUntil", lockoutTime.toString());
            checkLockoutStatus();
        }
        return failedAttempts;
    };

    return (
        <div className="Login_form text-[18px]">
            <h2 className="title">Admin Login</h2>

            {isPermanentLocked ? (
                <div className="p-6 text-center bg-red-50 border border-red-200 rounded-lg shadow-sm">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-4xl mb-4" />
                    <p className="text-red-700 font-bold leading-relaxed">
                        {lockoutMessage}
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="Log_form" noValidate aria-label="Admin login form" data-role="auth-form">
                    {isLocked && (
                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-orange-700 text-sm font-semibold text-center flex flex-col items-center">
                            <span>Account temporarily locked.</span>
                            <span className="text-xl mt-1">Please try again after: {formatTime(remainingTime)}</span>
                        </div>
                    )}

                    <div className="input-container">
                        <FontAwesomeIcon icon={faUser} className="input-icon" />
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="login_input"
                            disabled={isLocked}
                            autoComplete="username"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            name="username"
                        />
                    </div>

                    <div className="input-container relative">
                        <FontAwesomeIcon icon={faKey} className="input-icon" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login_input"
                            disabled={isLocked}
                            autoComplete="current-password"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
                            data-lpignore="true"
                            data-1p-ignore="true"
                            name="password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                            disabled={isLocked}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className={`button ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isLocked}
                    >
                        {isLocked ? "Locked" : "Login"}
                    </button>
                </form>
            )}

            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        </div>
    );
};

export default Login;
