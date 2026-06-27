import { Navigate } from "react-router-dom";
import { isTokenValid } from "../utils/api";

/**
 * Public Route — Pelindung dari Ghost Redirect Flicker (The Fortress Edition)
 * Mencegat perutean di memori. Jika user sudah login (token valid),
 * mereka langsung dilempar ke /dashboard tanpa membiarkan Landing Page termuat.
 */
export default function PublicRoute({ children }) {
    if (isTokenValid()) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
