import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Protected from './components/Protected';
import PublicRoute from './components/PublicRoute';
import TourGuide from './components/TourGuide';
import ErrorBoundary from './components/ErrorBoundary';
import { useTheme } from './hooks/useTheme';
import { apiFetch, clearAuthSession } from './utils/api';
import { ToastProvider } from './contexts/ToastContext';
import { ConfirmProvider } from './contexts/ConfirmContext';

// App Shell (eager load — selalu dibutuhkan)
import Login from './pages/Login';
import Register from './pages/Register';

// FIX (HIGH-FE-03): Code Splitting via React.lazy() + dynamic import.
// Vite akan memecah setiap page menjadi chunk JS terpisah yang hanya di-download
// saat user navigasi ke route tersebut. Ini mempercepat initial load secara signifikan.
// Login & Register tetap eager (entry point — tidak boleh lazy).
const Landing        = lazy(() => import('./pages/Landing'));
const Index          = lazy(() => import('./pages/Index'));
const BiAnalytics    = lazy(() => import('./pages/BiAnalytics'));
const SmartPredict   = lazy(() => import('./pages/SmartPredict'));
const Products       = lazy(() => import('./pages/Products'));
const Categories     = lazy(() => import('./pages/Categories'));
const Transaction    = lazy(() => import('./pages/Transaction'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const StoreSettings  = lazy(() => import('./pages/StoreSettings'));
const Features       = lazy(() => import('./pages/Features'));

// Fallback UI saat chunk sedang di-download (lazy loading)
// Menggunakan Bootstrap spinner agar selaras dengan design system yang sudah ada
const PageLoadingFallback = () => (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="text-center">
            <div className="spinner-border text-primary" role="status" aria-label="Memuat halaman...">
                <span className="visually-hidden">Memuat...</span>
            </div>
            <p className="text-muted mt-3 small">Memuat halaman...</p>
        </div>
    </div>
);


/**
 * Layout wrapper to conditionally show Sidebar
 */
const Layout = ({ children }) => {
    const location = useLocation();
    const noSidebarPaths = ['/login', '/register', '/', '/features'];
    const showSidebar = !noSidebarPaths.includes(location.pathname);

    return (
        <>
            {showSidebar && <Sidebar />}
            {showSidebar && <TourGuide />}
            <main className={showSidebar ? "main-content" : ""}>
                {children}
            </main>
        </>
    );
};

function App() {
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    // Mount the Enterprise Dark Mode Architecture
    useTheme();

    useEffect(() => {
        // Prevent initial transition sweep by removing preload class
        document.body.classList.remove('preload');
        
        // Session Hydration (Anti-Flicker UX)
        const hydrateSession = async () => {
            try {
                const res = await apiFetch('/auth/me');
                if (res && res.user) {
                    sessionStorage.setItem("user", JSON.stringify(res.user));
                }
            } catch {
                clearAuthSession();
            } finally {
                setIsAuthLoading(false);
            }
        };
        hydrateSession();
    }, []);

    if (isAuthLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-body)' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span className="visually-hidden">Memuat sesi...</span>
                    </div>
                    <p className="text-muted mt-3 fw-bold">Memverifikasi Sesi...</p>
                </div>
            </div>
        );
    }

    return (
        <ToastProvider>
            <ConfirmProvider>
                <Router>
                    <Layout>
                        {/* FIX (HIGH-FE-03): Suspense boundary untuk lazy page chunks.
                            Sidebar tetap terlihat saat page chunk di-download. */}
                        <Suspense fallback={<PageLoadingFallback />}>
                            <Routes>
                                {/* Landing Page is Public */}
                                <Route path="/" element={<PublicRoute><ErrorBoundary><Landing /></ErrorBoundary></PublicRoute>} />
                                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

                                {/* Neutral Route — Bisa diakses Guest maupun Logged-in User */}
                                <Route path="/features" element={<ErrorBoundary><Features /></ErrorBoundary>} />

                                {/* Protected Routes — Semua role */}
                                <Route path="/products" element={<Protected><ErrorBoundary><Products /></ErrorBoundary></Protected>} />
                                <Route path="/categories" element={<Protected><ErrorBoundary><Categories /></ErrorBoundary></Protected>} />
                                <Route path="/transaction" element={<Protected><ErrorBoundary><Transaction /></ErrorBoundary></Protected>} />

                                {/* Protected Routes — Owner only */}
                                <Route path="/dashboard" element={<Protected allowedRoles={['owner']}><ErrorBoundary><Index /></ErrorBoundary></Protected>} />
                                <Route path="/bi-analytics" element={<Protected allowedRoles={['owner']}><ErrorBoundary><BiAnalytics /></ErrorBoundary></Protected>} />
                                <Route path="/smart-predict" element={<Protected allowedRoles={['owner']}><ErrorBoundary><SmartPredict /></ErrorBoundary></Protected>} />
                                <Route path="/user-management" element={<Protected allowedRoles={['owner']}><ErrorBoundary><UserManagement /></ErrorBoundary></Protected>} />
                                <Route path="/settings" element={<Protected allowedRoles={['owner']}><ErrorBoundary><StoreSettings /></ErrorBoundary></Protected>} />

                                {/* Catch all redirect to login */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </Layout>
                </Router>
            </ConfirmProvider>
        </ToastProvider>
    );
}

export default App;
