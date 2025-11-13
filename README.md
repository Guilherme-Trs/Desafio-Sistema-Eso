# 🎮 Desafio Técnico — Sistema ESO  
Projeto desenvolvido por **Guilherme Tófolli Terrassi** para o processo seletivo da Sistema ESO.

Este projeto ainda não está totalmente concluído e possui algumas funcionalidades que não consegui finalizar dentro do prazo. Esta foi minha primeira experiência prática com Desenvolvimento Web full-stack, e tudo o que está implementado aqui foi desenvolvido por mim, com apoio de documentação, vídeos e ferramentas de Inteligência Artificial para aprendizado.

Apesar das limitações atuais, me esforcei para entender o fluxo completo de desenvolvimento e deploy, e pretendo continuar aprimorando o código mesmo após a entrega.

Agradeço muito pela oportunidade de participar do processo e estou totalmente à disposição para uma entrevista quando for conveniente para a empresa.
---

## 🚀 Deploys
Frontend (Vercel):  
👉 https://desafio-sistema-eso.vercel.app

Backend (Render):  
👉 https://desafio-sistemaeso-backend.onrender.com

Repositório (GitHub):  
👉 https://github.com/Guilherme-Trs/Desafio-Sistema-Eso

---

## 📌 Sobre o Projeto
O objetivo deste desafio foi desenvolver um sistema completo de loja virtual temática (inspirada em cosméticos de jogos), com:

- Autenticação de usuário (cadastro e login com JWT)
- Saldo inicial (10.000 V-Bucks)
- Listagem de cosméticos
- Compra e devolução de itens
- Histórico de transações
- Área do usuário ("Meus Itens")
- Integração entre frontend e backend
- Deploy completo do sistema

O projeto contém **Frontend + Backend**, ambos implementados e integrados.

---

## 🧱 Tecnologias Utilizadas

### **Backend**
- Node.js
- Express
- Prisma ORM
- SQLite
- JWT (autenticação)
- Bcrypt (hash de senha)
- Axios
- CORS

### **Frontend**
- React (Vite)
- TailwindCSS
- React Router DOM
- Axios

### **Infra**
- Render (Backend)
- Vercel (Frontend)
- GitHub (versionamento)

---

## 📂 Estrutura das Pastas

```
Desafio-Sistema-Eso/
│
├── backend/
│   ├── src/
│   │   ├── server.js         # Rotas e API principal
│   │   └── prismaClient.js   # Cliente Prisma
│   ├── prisma/
│   │   ├── schema.prisma     # Definição do banco
│   │   └── seed.js           # Seed inicial
│   ├── package.json
│   └── ...
│
└── frontend/
    └── sistema-eso-frontend/
        ├── src/
        │   ├── pages/
        │   ├── components/
        │   ├── api.js
        │   └── ...
        ├── package.json
        └── ...
```

---

## 🖥️ Como Rodar o Projeto Localmente

### 🔧 **Pré-requisitos**
- Node.js 18+
- npm
- Git

---

# 🔙 Backend (API)

### 📌 1. Instalar dependências

```bash
cd backend
npm install
```

### 📌 2. Gerar o Prisma Client

```bash
npx prisma generate
```

### 📌 3. Criar o banco local (SQLite)

```bash
npx prisma migrate dev --name init
```

### 📌 4. Iniciar o servidor

```bash
npm run dev
```

Servidor rodará em:

👉 http://localhost:4000

---

# 🎨 Frontend

### 📌 1. Instalar dependências

```bash
cd frontend/sistema-eso-frontend
npm install
```

### 📌 2. Configurar API (se necessário)

Abra o arquivo:

```
frontend/sistema-eso-frontend/src/api.js
```

E certifique-se que está assim:

```js
const api = axios.create({
  baseURL: "http://localhost:4000"
});
```

### 📌 3. Iniciar o frontend

```bash
npm run dev
```

Frontend rodará em:

👉 http://localhost:5173

---

# 🧪 Testando o Sistema

### ✔️ Criar conta
Via frontend:  
👉 Página de **Registro**

Via API (PowerShell):

```powershell
$body = @{ email="teste@teste.com"; password="123456" } | ConvertTo-Json
Invoke-WebRequest -Method POST -Uri "http://localhost:4000/register" -ContentType "application/json" -Body $body
```

### ✔️ Login

```powershell
$body = @{ email="teste@teste.com"; password="123456" } | ConvertTo-Json
Invoke-WebRequest -Method POST -Uri "http://localhost:4000/login" -ContentType "application/json" -Body $body
```

### ✔️ Listar cosméticos

```
GET http://localhost:4000/cosmetics
```

### ✔️ Comprar item

```
POST http://localhost:4000/buy/:cosmeticId
Authorization: Bearer TOKEN
```

### ✔️ Meus itens

```
GET http://localhost:4000/my-cosmetics
Authorization: Bearer TOKEN
```

---

# 📝 Observações
- O backend no Render utiliza SQLite embarcado.
- Alguns cosméticos podem não ter preço (`price: null`) dependendo do seed.
- Caso desejado, posso realizar um seed completo com valores de preços e imagens para fins de demonstração.

---

# 📞 Contato
**Guilherme Tófolli Terrassi**  
PUC Minas — Ciência da Computação  
LinkedIn: https://www.linkedin.com/in/guilherme-terrassi/  
GitHub: https://github.com/Guilherme-Trs

---
