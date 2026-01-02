import Dashboard from "./components/layouts/Dashboard";
import { AppProviders } from "./providers/AppProviders";

function App() {
    return (
        <AppProviders>
            <div className="min-h-screen bg-slate-900 text-slate-100">
                <Dashboard />
            </div>
        </AppProviders>
    );
}

export default App;
