import React, { useEffect, useState } from 'react';
import api from '../api';
import { useParams } from 'react-router-dom';

export default function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  useEffect(() => { fetch(); }, [id]);
  async function fetch() {
    const data = await api.get(`/profiles/${id}`);
    setProfile(data);
  }
  if(!profile) return <div className="container"><div className="card">Carregando...</div></div>;
  return (
    <div className="container">
      <div className="card">
        <h2 className="text-xl font-semibold">{profile.name}</h2>
        <div className="small text-slate-500">Email: {profile.email}</div>
        <div className="mt-3">
          <h3 className="font-semibold">Itens adquiridos</h3>
          <ul className="mt-2 space-y-2">
            {profile.items?.map(it => (
              <li key={it.id} className="p-2 border rounded">{it.title}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
