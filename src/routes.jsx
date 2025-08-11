import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Orders from "./pages/Orders.jsx";
import Branches from "./pages/Branches.jsx";
import NotFound from "./pages/NotFound.jsx";

// Agar ProtectedRoute kerak bo'lsa keyin qo'shamiz
export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "orders", element: <Orders /> },
      { path: "branches", element: <Branches /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
