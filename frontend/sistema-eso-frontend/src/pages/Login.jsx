import React, { useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const data = await api.post('/login', { email, password });
      // espera { token, user }
      onLogin(data);
      navigate('/shop');
    } catch (err) {
      setMsg(err?.data?.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Entrar</h2>
        {msg && <div className="text-red-600 mb-2">{msg}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="p-2 border rounded" />
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" type="password" className="p-2 border rounded" />
          <button disabled={loading} className="btn btn-primary">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
