import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient();

async function main() {
  // lê o arquivo como texto e remove BOM se existir
  let raw = fs.readFileSync("./shop.json", "utf8");
  if (raw.charCodeAt(0) === 0xFEFF) {
    raw = raw.slice(1);
  }

  const obj = JSON.parse(raw);
  const cosmetics = obj.cosmetics || [];

  let count = 0;
  for (const item of cosmetics) {
    await prisma.cosmetic.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        type: item.type ?? null,
        rarity: item.rarity ?? null,
        price: item.price ?? null,
        isNew: item.isNew ?? false,
        isInShop: item.onSale ?? false,
        raw: item,
      },
      create: {
        id: item.id,
        name: item.name,
        type: item.type ?? null,
        rarity: item.rarity ?? null,
        price: item.price ?? null,
        isNew: item.isNew ?? false,
        isInShop: item.onSale ?? false,
        raw: item,
      },
    });
    count++;
  }

  console.log(`Seed concluído — ${count} cosméticos processados.`);
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
