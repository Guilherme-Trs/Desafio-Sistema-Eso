import axios from "axios";

// Detecta a URL base da API (funciona tanto no Vite quanto no Node)
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  process.env.VITE_API_URL ||
  "http://localhost:3333";

// Cria a instância principal do Axios
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Adiciona automaticamente o token JWT, se existir
api.interceptors.request.use((config) => {
  try {
    let token = null;

    // Browser: pega do localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      token = window.localStorage.getItem("so_token");
    }

    // Node (testes): pega da env
    if (!token && typeof process !== "undefined") {
      token = process.env.SO_TOKEN;
    }

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn("Erro ao adicionar token:", err.message);
  }

  return config;
});

// 👉 ESSA LINHA É A MAIS IMPORTANTE:
export default api;
