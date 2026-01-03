import { useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './routes';
import { Toaster } from 'sonner';
import BootAnimation from './components/layouts/BootAnimation';
import './App.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

function App() {
    const [showBoot, setShowBoot] = useState(true);

    return (
        <QueryClientProvider client={queryClient}>
            {showBoot ? (
                <BootAnimation onComplete={() => setShowBoot(false)} />
            ) : (
                <>
                    <RouterProvider router={router} />
                    <Toaster position="top-right" theme="dark" />
                </>
            )}
        </QueryClientProvider>
    );
}

export default App;
