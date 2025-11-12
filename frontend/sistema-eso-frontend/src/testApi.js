// src/testApi.js
import axios from 'axios';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API = axios.create({ baseURL: BASE_URL, timeout: 5000 });

async function runTests() {
  try {
    console.log('--- GET /items ---');
    let res = await API.get('/items');
    console.log('GET status:', res.status);
    console.log('items:', res.data);

    console.log('\n--- POST /items ---');
    const newItem = { title: 'Item de teste', description: 'Criado pelo testApi' };
    res = await API.post('/items', newItem);
    console.log('POST status:', res.status);
    console.log('created:', res.data);
    const createdId = res.data.id ?? res.data._id ?? null;

    console.log('\n--- PUT /items/:id (se id disponível) ---');
    if (createdId) {
      const updated = { ...newItem, title: 'Item atualizado pelo testApi' };
      res = await API.put(`/items/${createdId}`, updated);
      console.log('PUT status:', res.status);
      console.log('updated:', res.data);
    } else {
      console.log('Nenhum id retornado no POST — pulei o PUT');
    }

    console.log('\n--- DELETE /items/:id (se id disponível) ---');
    if (createdId) {
      res = await API.delete(`/items/${createdId}`);
      console.log('DELETE status:', res.status);
      console.log('delete response:', res.data);
    } else {
      console.log('Nenhum id retornado no POST — pulei o DELETE');
    }

    console.log('\n--- Re-GET /items para confirmar ---');
    res = await API.get('/items');
    console.log('GET status:', res.status);
    console.log('items:', res.data);

    console.log('\nTodos os testes concluídos ✅');
  } catch (err) {
    if (err.response) {
      console.error('Erro HTTP:', err.response.status, err.response.data);
    } else {
      console.error('Erro:', err.message);
    }
    process.exitCode = 1;
  }
}

runTests();
