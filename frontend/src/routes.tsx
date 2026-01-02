import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./components/layouts/AppLayout";
import Dashboard from "./components/layouts/Dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />, // The Frame
    children: [
      {
        path: "/",
        element: <Dashboard />
      },
      {
        path: "/library",
        element: (
          <div className="p-8 border-2 border-dashed border-gray-700 rounded-lg text-center">
            <h2 className="text-xl text-(--tui-primary) mb-2">Library Module</h2>
            <p className="text-gray-500">Node Editor coming in Phase 5.2</p>
          </div>
        )
      },
      {
        path: "/review",
        element: (
          <div className="p-8 border-2 border-dashed border-gray-700 rounded-lg text-center">
            <h2 className="text-xl text-(--tui-primary) mb-2">Study Session</h2>
            <p className="text-gray-500">Flashcard Loop coming in Phase 5.3</p>
          </div>
        )
      },
    ],
  },
]);
