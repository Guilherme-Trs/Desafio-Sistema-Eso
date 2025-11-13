import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

async function main() {
  // Lê shop.json e remove BOM se existir
  let raw = fs.readFileSync("./shop.json", "utf8");
  if (raw && raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);

  const obj = JSON.parse(raw);
  const cosmetics = obj.cosmetics || [];

  let count = 0;

  for (const item of cosmetics) {
    // define um preço entre 200 e 2000 aleatório
    const price = 200 + Math.floor(Math.random() * 1800);
    const onSale = Math.random() < 0.4; // 40% dos itens estarão à venda

    await prisma.cosmetic.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        type: item.type ?? null,
        rarity: item.rarity ?? null,
        price,
        onSale,
        isNew: item.isNew ?? false,
      },
      create: {
        id: item.id,
        name: item.name,
        type: item.type ?? null,
        rarity: item.rarity ?? null,
        price,
        onSale,
        isNew: item.isNew ?? false,
      },
    });

    count++;
  }

  console.log(`Seed concluído — ${count} cosméticos processados.`);
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
