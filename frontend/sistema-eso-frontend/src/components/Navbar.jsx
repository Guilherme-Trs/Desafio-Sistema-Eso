// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Navbar({ user, onLogout }) {
  return (
    <nav className="bg-white shadow-sm">
      <div className="container flex items-center justify-between">
        {/* Logo / Home */}
        <Link to="/" className="flex items-center gap-3 py-3">
          <div className="w-10 h-10 bg-indigo-600 rounded flex items-center justify-center text-white font-bold">
            ESO
          </div>
          <div className="text-lg font-semibold">Sistema ESO</div>
        </Link>

        {/* Menu */}
        <div className="flex items-center gap-3">
          <Link to="/shop" className="small hover:text-indigo-600">
            Loja
          </Link>
          <Link to="/my-items" className="small hover:text-indigo-600">
            Meus Itens
          </Link>
          <Link to="/transactions" className="small hover:text-indigo-600">
            Transações
          </Link>
          <Link to="/profile" className="small hover:text-indigo-600">
            Perfis
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="text-sm">💳 {user.vbucks ?? 0} vb</div>
              <button
                className="btn btn-outline small"
                onClick={onLogout}
              >
                Sair
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary small">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
