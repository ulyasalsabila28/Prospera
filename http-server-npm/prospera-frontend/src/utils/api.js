const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const getAuthToken = () => localStorage.getItem("authToken");
export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const setAuthSession = (token, user) => {
  localStorage.setItem("authToken", token);
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("isLogin", "true");
};

export const clearAuthSession = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  localStorage.removeItem("isLogin");
};

export const authFetch = async (path, options = {}) => {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await response.json() : null;

  if (response.status === 401 || response.status === 403) {
    clearAuthSession();
    window.location.href = "/login";
    throw new Error(data?.message || "Unauthorized");
  }

  if (!response.ok) {
    throw new Error(data?.message || "Terjadi kesalahan pada server.");
  }

  return data;
};

export default API_BASE_URL;
