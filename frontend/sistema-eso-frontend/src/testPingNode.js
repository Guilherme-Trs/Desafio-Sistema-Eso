// src/testPingNode.js
(async () => {
  try {
    const res = await fetch("http://localhost:3333/ping");
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();
    console.log("✅ Conexão OK:", data);
  } catch (err) {
    console.error("❌ Erro na conexão:", err.message || err);
  }
})();
