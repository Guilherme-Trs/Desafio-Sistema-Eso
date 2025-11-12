import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Transactions() {
  const [txs, setTxs] = useState([]);
  useEffect(() => { fetch(); }, []);
  async function fetch() {
    const data = await api.get('/transactions');
    setTxs(data || []);
  }
  return (
    <div className="container">
      <h2>Transações</h2>
      <div className="mt-4">
        {txs.length === 0 ? <div>Nenhuma transação</div> : (
          <ul className="space-y-3">
            {txs.map(t => (
              <li key={t.id} className="card flex justify-between items-center">
                <div>
                  <div className="font-semibold">{t.type.toUpperCase()}</div>
                  <div className="small text-slate-500">{t.title}</div>
                </div>
                <div className="font-bold">{t.amount} vb</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
