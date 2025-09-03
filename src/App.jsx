import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import ProtectedRoute from "./routes/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Branches from "./pages/Branches";
import NotFound from "./pages/NotFound";
import FlialPolygons from "./pages/FlialPolygons";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Categories from "./pages/Categories";
import UsersPage from "./pages/UsersPage";

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="branches" element={<Branches />} />
              <Route path="branches/polygons" element={<FlialPolygons />} />
              <Route path="categories" element={<Categories />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </ErrorBoundary>
      <ToastContainer position="top-right" autoClose={3000} />
    </AuthProvider>
  );
}
