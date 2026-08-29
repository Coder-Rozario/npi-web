import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { getAuthToken } from "../../../apiConfig";

const decodeTokenSafe = (token) => {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const ProtectedRoute = ({ children }) => {
  const token = getAuthToken();
  const payload = decodeTokenSafe(token);
  const isAuthenticated =
    !!token && payload && (!payload.exp || payload.exp * 1000 > Date.now());

  return isAuthenticated ? children : <Navigate to="/Login" replace />;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
