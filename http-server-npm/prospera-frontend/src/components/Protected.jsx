import { Navigate } from "react-router-dom";

export default function Protected({ children }) {
  const isLogin = localStorage.getItem("isLogin");

  if (!isLogin) {
    return <Navigate to="/login" />;
  }

  return children;
}