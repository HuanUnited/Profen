import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./components/layouts/AppLayout";
import Dashboard from "./components/layouts/Dashboard";
import Library from "./components/layouts/Library"; // <--- Import the new component

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Dashboard />
      },
      {
        path: "/library",
        element: <Library /> // <--- Use it here
      },
      {
        path: "/review",
        element: (
          <div className="p-8 border-2 border-dashed border-gray-700 rounded-lg text-center">
            <h2 className="text-xl text-[var(--tui-primary)] mb-2">Study Session</h2>
            <p className="text-gray-500">Coming in Phase 5.3</p>
          </div>
        )
      },
    ],
  },
]);
