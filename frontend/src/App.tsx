// frontend/src/App.tsx
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AppProviders } from "./providers/AppProviders";
import SetupPanel from "./components/atomic/SetupPanel";
import { useFullscreenToggle } from "./utils/hooks/useFullscreenToggle";

function App() {
    // Enable F11 fullscreen toggle globally
    useFullscreenToggle();

    return (
        <AppProviders>
            <SetupPanel isOpen={false} />
            <RouterProvider router={router} />
        </AppProviders>
    );
}

export default App;
