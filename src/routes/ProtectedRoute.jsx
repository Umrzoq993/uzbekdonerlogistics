import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const { isAuthed, ready } = useAuth();
  const location = useLocation();

  if (!ready) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
        <div>Yuklanmoqda...</div>
      </div>
    );
  }

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
