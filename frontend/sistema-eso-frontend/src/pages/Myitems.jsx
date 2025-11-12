import React, { useEffect, useState } from 'react';
import api from '../api';
import Spinner from '../components/Spinner';

export default function MyItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchMyItems(); }, []);

  async function fetchMyItems() {
    setLoading(true);
    try {
      const data = await api.get('/my-items');
      setItems(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReturn(item) {
    try {
      await api.post(`/return/${item.id}`);
      fetchMyItems();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="container">
      <h2 className="mb-4">Meus Itens</h2>
      {loading ? <Spinner /> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map(it => (
            <div className="card" key={it.id}>
              <div className="flex gap-3">
                <img src={it.image} alt={it.title} className="w-20 h-20 object-cover rounded" />
                <div>
                  <div className="font-semibold">{it.title}</div>
                  <div className="small text-slate-500">{it.description}</div>
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <button className="btn btn-outline small" onClick={() => handleReturn(it)}>Devolver</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
