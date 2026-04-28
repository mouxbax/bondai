import { PrismaClient } from "@prisma/client";
import { SHOP_ITEMS } from "../lib/shop/items";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding shop items...");

  for (const item of SHOP_ITEMS) {
    await prisma.shopItem.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        icon: item.icon,
        rarity: item.rarity,
        consumable: item.consumable,
        effect: item.effect ?? undefined,
      },
      create: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        category: item.category,
        price: item.price,
        icon: item.icon,
        rarity: item.rarity,
        consumable: item.consumable,
        effect: item.effect ?? undefined,
      },
    });
    console.log(`  + ${item.name} (${item.category})`);
  }

  console.log(`Done! ${SHOP_ITEMS.length} items seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
