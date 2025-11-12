import express from "express";
import cors from "cors";
import axios from "axios";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "./prismaClient.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "secret_dev";

// ===== Rota de teste =====
app.get("/ping", (req, res) => {
  res.json({ message: "Servidor rodando com sucesso 🚀" });
});

// ===== REGISTRO =====
app.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email e senha são obrigatórios" });

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: "Email já cadastrado" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, vbucks: 10000 },
      select: { id: true, email: true, vbucks: true, createdAt: true },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

// ===== LOGIN =====
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email e senha são obrigatórios" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Credenciais inválidas" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Credenciais inválidas" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, email: user.email, vbucks: user.vbucks } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no login" });
  }
});

// ===== Middleware de autenticação =====
export const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Token não fornecido" });

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token)
    return res.status(401).json({ error: "Formato do token inválido" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: "Usuário inválido" });

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Token inválido" });
  }
};

// ===== PERFIL LOGADO =====
app.get("/me", auth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, email: true, vbucks: true, createdAt: true },
  });
  res.json({ user });
});

// ===== COMPRAR COSMETIC =====
app.post("/buy/:cosmeticId", auth, async (req, res) => {
  const userId = req.user.id;
  const cosmeticId = req.params.cosmeticId;

  try {
    const cosmetic = await prisma.cosmetic.findUnique({ where: { id: cosmeticId } });
    if (!cosmetic) return res.status(404).json({ error: "Cosmetic não encontrado" });

    const owned = await prisma.userCosmetic.findFirst({
      where: { userId, cosmeticId, returnedAt: null },
    });
    if (owned) return res.status(400).json({ error: "Você já possui esse item" });

    const price = cosmetic.price ?? null;
    if (price === null) return res.status(400).json({ error: "Este item não está à venda" });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.vbucks < price) return res.status(400).json({ error: "Saldo insuficiente" });

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { vbucks: { decrement: price } },
      });

      const userCosmetic = await tx.userCosmetic.create({
        data: { userId, cosmeticId },
      });

      const transaction = await tx.transaction.create({
        data: { userId, cosmeticId, type: "buy", amount: price },
      });

      return { updatedUser, userCosmetic, transaction };
    });

    res.json({ ok: true, result });
  } catch (err) {
    console.error("Erro ao comprar:", err);
    res.status(500).json({ error: "Erro ao processar compra" });
  }
});

// ===== DEVOLVER COSMETIC =====
app.post("/return/:cosmeticId", auth, async (req, res) => {
  const userId = req.user.id;
  const cosmeticId = req.params.cosmeticId;

  try {
    const owned = await prisma.userCosmetic.findFirst({
      where: { userId, cosmeticId, returnedAt: null },
    });
    if (!owned) return res.status(400).json({ error: "Você não possui este item" });

    const cosmetic = await prisma.cosmetic.findUnique({ where: { id: cosmeticId } });
    const refund = cosmetic.price ?? 0;

    const result = await prisma.$transaction(async (tx) => {
      const uc = await tx.userCosmetic.update({
        where: { id: owned.id },
        data: { returnedAt: new Date() },
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { vbucks: { increment: refund } },
      });

      const transaction = await tx.transaction.create({
        data: { userId, cosmeticId, type: "return", amount: refund },
      });

      return { uc, updatedUser, transaction };
    });

    res.json({ ok: true, result });
  } catch (err) {
    console.error("Erro ao devolver:", err);
    res.status(500).json({ error: "Erro ao processar devolução" });
  }
});

// ======= DIA 5 - Sincronização =======

// Atualiza preços e onSale
// ===== Robust /sync/shop with fallback =====
app.get("/sync/shop", async (req, res) => {
  try {
    console.log("🔄 Iniciando sync /shop (tenta API externa)...");
    const url = "https://fortnite-api.com/v2/shop/br";
    // tenta chamar a API externa com timeout; captura a resposta de erro em `r` se houver
    const r = await axios.get(url, { timeout: 20000 }).catch(err => err.response ? err : Promise.reject(err));

    // Se a resposta for erro (status >= 400), tratamos como fallback
    if (r && r.status && r.status >= 400) {
      console.warn(`⚠️ API externa retornou status ${r.status} — acionando fallback seguro`);
      throw { isFallbackTrigger: true, status: r.status, message: r.statusText || "API externa erro" };
    }

    // estrutura defensiva: tente várias formas de extrair dados
    const payload = r.data;
    // possíveis lugares onde podem estar os itens/prices
    let shopEntries = [];

    if (payload?.data?.entries && Array.isArray(payload.data.entries)) {
      shopEntries = payload.data.entries;
    } else if (payload?.data?.storefronts && Array.isArray(payload.data.storefronts)) {
      // alguns formatos: storefronts -> entries
      for (const sf of payload.data.storefronts) {
        if (Array.isArray(sf.entries)) shopEntries.push(...sf.entries);
      }
    } else if (Array.isArray(payload?.data)) {
      shopEntries = payload.data;
    } else {
      shopEntries = payload?.data?.items || payload?.data || [];
    }

    let updated = 0;
    // percorre e tenta atualizar por id/name/offerId conforme o formato
    for (const entry of shopEntries) {
      // se entry tiver items (bundle), itere
      const candidates = entry?.items && Array.isArray(entry.items) ? entry.items : [entry];

      // price pode estar em entry (regularPrice/finalPrice) ou em item
      for (const item of candidates) {
        const possibleId = item?.id || item?.itemId || item?.templateId || item?.offerId || null;
        const price = item?.price ?? item?.finalPrice ?? entry?.regularPrice ?? entry?.finalPrice ?? null;

        if (!possibleId) continue;

        const exists = await prisma.cosmetic.findUnique({ where: { id: possibleId } });
        if (exists) {
          await prisma.cosmetic.update({
            where: { id: possibleId },
            data: { price: price === null ? null : Number(price), onSale: price !== null },
          });
          updated++;
        }
      }
    }

    console.log(`✅ /sync/shop finalizado. Itens atualizados: ${updated}`);
    return res.json({ ok: true, method: "api", updated });
  } catch (err) {
    // Fallback seguro: desmarca onSale e zera price (ou escolha manter preços, aqui usamos desmarcar)
    try {
      console.warn("ℹ️ /sync/shop: executando fallback seguro (desmarcar onSale e limpar price).");
      const result = await prisma.cosmetic.updateMany({
        data: { onSale: false, price: null },
      });

      console.log("✅ /sync/shop (fallback) finalizado. Todos os items desmarcados onSale.");
      return res.status(200).json({ ok: true, method: "fallback", affected: result.count || null });
    } catch (fallbackErr) {
      console.error("❌ Falha no fallback /sync/shop:", fallbackErr);
      return res.status(500).json({ error: "Erro ao sincronizar shop (api+fallback)", details: String(err?.message || err) });
    }
  }
});


// ===== Robust /sync/new with fallback =====
app.get("/sync/new", async (req, res) => {
  try {
    console.log("🔄 Iniciando sync /cosmetics/new (tenta API externa)...");
    const url = "https://fortnite-api.com/v2/cosmetics/br/new";
    const r = await axios.get(url, { timeout: 20000 }).catch(err => err.response ? err : Promise.reject(err));

    if (r && r.status && r.status >= 400) {
      console.warn(`⚠️ API externa retornou status ${r.status} — usando fallback local`);
      throw { isFallbackTrigger: true, status: r.status, message: r.statusText || "API externa erro" };
    }

    const payload = r.data;
    const items = payload?.data?.items || payload?.data || payload || [];

    await prisma.cosmetic.updateMany({ data: { isNew: false } });

    let marked = 0;
    for (const item of items) {
      const id = item?.id || item?.itemId || null;
      const name = item?.name || item?.displayName || null;

      if (id) {
        const exists = await prisma.cosmetic.findUnique({ where: { id } });
        if (exists) {
          await prisma.cosmetic.update({ where: { id }, data: { isNew: true } });
          marked++;
          continue;
        }
      }
      if (name) {
        const existsByName = await prisma.cosmetic.findFirst({ where: { name } });
        if (existsByName) {
          await prisma.cosmetic.update({ where: { id: existsByName.id }, data: { isNew: true } });
          marked++;
          continue;
        }
      }
    }

    console.log(`✅ /sync/new finalizado (API). Itens marcados: ${marked}`);
    return res.json({ ok: true, method: "api", marked });
  } catch (err) {
    try {
      console.log("ℹ️ /sync/new: executando fallback local baseado em createdAt (últimos N dias).");
      const days = parseInt(process.env.SYNC_NEW_FALLBACK_DAYS || "7");
      const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      await prisma.cosmetic.updateMany({ data: { isNew: false } });

      const recent = await prisma.cosmetic.findMany({
        where: { createdAt: { gte: threshold } },
      });

      let marked = 0;
      for (const c of recent) {
        await prisma.cosmetic.update({ where: { id: c.id }, data: { isNew: true } });
        marked++;
      }

      console.log(`✅ /sync/new (fallback) finalizado. Itens marcados: ${marked}`);
      return res.status(200).json({ ok: true, method: "fallback", days, marked });
    } catch (fallbackErr) {
      console.error("❌ Falha no fallback /sync/new:", fallbackErr);
      return res.status(500).json({ error: "Erro ao sincronizar novos (api+fallback)", details: String(err?.message || err) });
    }
  }
});


// Sincroniza ambos
app.get("/sync/all", async (req, res) => {
  try {
    await axios.get("http://localhost:3333/sync/shop");
    await axios.get("http://localhost:3333/sync/new");
    res.json({ ok: true, message: "Sincronização completa" });
  } catch (err) {
    console.error("Erro em /sync/all:", err);
    res.status(500).json({ error: "Erro ao rodar sync/all" });
  }
});
// ===== LISTAR COSMÉTICOS =====
app.get("/cosmetics", async (req, res) => {
  try {
    // parâmetros opcionais de paginação
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.max(1, parseInt(req.query.limit || "24"));
    const skip = (page - 1) * limit;

    // busca no banco com paginação
    const [cosmetics, total] = await Promise.all([
      prisma.cosmetic.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          type: true,
          rarity: true,
          price: true,
          onSale: true,
          isNew: true,
          createdAt: true,
        },
      }),
      prisma.cosmetic.count(),
    ]);

    res.json({
      page,
      total,
      totalPages: Math.ceil(total / limit),
      cosmetics,
    });
  } catch (err) {
    console.error("Erro /cosmetics:", err);
    res.status(500).json({ error: "Erro ao listar cosméticos" });
  }
});
// ===== Day4 - rotas adicionais: meus cosméticos e transações =====

// Lista os cosméticos que o usuário possui (não devolvidos)
app.get("/my-cosmetics", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const items = await prisma.userCosmetic.findMany({
      where: { userId, returnedAt: null },
      include: {
        cosmetic: {
          select: { id: true, name: true, type: true, rarity: true, image: true, price: true },
        },
      },
      orderBy: { boughtAt: "desc" },
    });

    const owned = items.map((it) => ({
      id: it.id,
      cosmeticId: it.cosmetic.id,
      name: it.cosmetic.name,
      type: it.cosmetic.type,
      rarity: it.cosmetic.rarity,
      image: it.cosmetic.image,
      price: it.cosmetic.price,
      boughtAt: it.boughtAt,
    }));

    res.json({ total: owned.length, items: owned });
  } catch (err) {
    console.error("Erro /my-cosmetics:", err);
    res.status(500).json({ error: "Erro ao obter cosméticos do usuário" });
  }
});

// Histórico de transações do usuário (compra/devolução) — paginado
app.get("/transactions", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const perPage = Math.max(1, parseInt(req.query.perPage || "20"));
    const skip = (page - 1) * perPage;

    const [rows, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: perPage,
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    res.json({ page, perPage, total, totalPages: Math.ceil(total / perPage), rows });
  } catch (err) {
    console.error("Erro /transactions:", err);
    res.status(500).json({ error: "Erro ao obter histórico" });
  }
});

// ===== Inicialização =====
const PORT = process.env.PORT || 3333;
app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));
