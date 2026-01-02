import { createBrowserRouter } from "react-router-dom";
import Shell from "./components/layouts/Shell";
import DashboardSidebar from "./components/navigation/DashboardSidebar";
import LibrarySidebar from "./components/navigation/LibrarySidebar";
import Dashboard from "./components/layouts/Dashboard";
import Library from "./components/layouts/Library";

export const router = createBrowserRouter([
  // Group 1: Dashboard Context
  {
    element: <Shell sidebar={<DashboardSidebar />} />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/review", element: <div className="p-8">Review Session (Coming Soon)</div> },
    ]
  },

  // Group 2: Library Context
  {
    element: <Shell sidebar={<LibrarySidebar />} />,
    children: [
      {
        path: "/library",
        element: <Library />
      }
    ]
  }
]);
