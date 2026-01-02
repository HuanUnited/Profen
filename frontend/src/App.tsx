import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AppProviders } from "./providers/AppProviders";
import SetupPanel from "./components/atomic/SetupPanel";

function App() {
    return (
        <AppProviders>
            <SetupPanel isOpen={false} />
            <RouterProvider router={router} />
        </AppProviders>
    );
}

export default App;
