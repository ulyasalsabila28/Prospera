import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Products from "./pages/Products.jsx";
import Transaction from "./pages/Transaction.jsx";
import Protected from "./components/Protected.jsx";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route path="/products" element={
          <Protected><Products /></Protected>
        } />

        <Route path="/transaction" element={
          <Protected><Transaction /></Protected>
        } />
      </Routes>
    </BrowserRouter>
  );
}