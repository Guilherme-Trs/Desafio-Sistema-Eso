import React, { useEffect, useState } from 'react';
import api from '../api';
import Spinner from '../components/Spinner';

export default function Shop({ user, onBuy }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [rarity, setRarity] = useState('');
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchItems() {
    setLoading(true);
    setMsg(null);
    try {
      // chamada à API (pode retornar: array, { items: [...] }, { data: [...] } etc.)
      const res = await api.get(`/cosmetics?search=${encodeURIComponent(query)}&type=${filterType}&rarity=${rarity}`);

      // Normaliza a resposta para sempre termos um array em `list`
      let list = [];

      // Caso api.get retorne diretamente um array
      if (Array.isArray(res)) {
        list = res;
      } else if (Array.isArray(res?.data)) {
        // axios padrão: { data: [...] }
        list = res.data;
      } else if (Array.isArray(res?.items)) {
        // formato { items: [...] }
        list = res.items;
      } else if (Array.isArray(res?.data?.items)) {
        // formato { data: { items: [...] } }
        list = res.data.items;
      } else {
        // tenta recuperar qualquer array dentro do objeto (última tentativa)
        const possible = Object.values(res || {}).find(v => Array.isArray(v));
        if (Array.isArray(possible)) list = possible;
      }

      setItems(list);
    } catch (err) {
      console.error('fetchItems error', err);
      setMsg('Erro ao buscar itens');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleBuy(item) {
    if (!user) {
      setMsg('Faça login para comprar');
      return;
    }
    try {
      const res = await api.post(`/buy/${item.id}`);
      onBuy && onBuy(res);
      setMsg('Compra realizada com sucesso');
      fetchItems();
    } catch (err) {
      console.error('handleBuy error', err);
      setMsg(err?.data?.message || 'Erro ao comprar');
    }
  }

  return (
    <div className="container">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nome"
            className="p-2 border rounded"
          />
          <button onClick={fetchItems} className="btn btn-primary">Buscar</button>
        </div>
        <div className="flex gap-2">
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="p-2 border rounded">
            <option value="">Todos os tipos</option>
            <option value="outfit">Outfit</option>
            <option value="backpack">Backpack</option>
          </select>
          <select value={rarity} onChange={e => setRarity(e.target.value)} className="p-2 border rounded">
            <option value="">Todas raridades</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
          </select>
        </div>
      </div>

      {msg && <div className="mb-3 text-sm text-red-600">{msg}</div>}

      {loading ? (
        <Spinner />
      ) : (
        <>
          {items.length === 0 ? (
            <div className="card">Nenhum cosmético encontrado.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {items.map(it => (
                <div key={String(it.id ?? it._id ?? Math.random())} className="card flex flex-col">
                  <img
                    src={it.images?.icon || it.images?.icon_background || it.image || ''}
                    alt={it.name || it.title}
                    className="w-full h-36 object-cover rounded"
                    onError={(e) => { e.currentTarget.src = ''; }}
                  />
                  <div className="mt-2 flex-1">
                    <div className="font-semibold">{it.name || it.title}</div>
                    <div className="small text-slate-500">{it.rarity}</div>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-3">
                    <div className="text-sm font-bold">{it.price ?? '—'} vb</div>
                    <button onClick={() => handleBuy(it)} className="btn btn-primary small">Comprar</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
