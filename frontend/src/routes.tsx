import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./components/layouts/AppLayout";
import Dashboard from "./components/layouts/Dashboard";

// We will add Library and StudySession later
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/library", element: <div className="p-4">Library (Coming Soon)</div> },
      { path: "/review", element: <div className="p-4">Review Session (Coming Soon)</div> },
    ],
  },
]);
