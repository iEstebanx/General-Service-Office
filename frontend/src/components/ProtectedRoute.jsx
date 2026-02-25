// frontend/src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("adminToken");
  const location = useLocation();

  if (!token) {
    return (
      <Navigate
        to="/backoffice/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}