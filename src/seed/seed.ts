import prisma from "../app/shared/prisma";

async function main() {
  // Find an owner for shops (prefer VENDOR, fallback ADMIN, fallback any)
  let owner = await prisma.user.findFirst({ where: { role: "VENDOR" } });
  if (!owner) owner = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (!owner) owner = await prisma.user.findFirst();
  if (!owner) {
    console.log("No users found to own shops. Seed aborted.");
    return;
  }

  const shops = [
    {
      name: "Cha House",
      slug: "cha-house",
      description: "Famous for cha and snacks.",
    },
    {
      name: "Burger Station",
      slug: "burger-station",
      description: "Burgers, fries, and fast bites.",
    },
    {
      name: "Food Corner",
      slug: "food-corner",
      description: "Local favorites and classics.",
    },
  ];

  // Upsert shops
  const upserted: Record<string, string> = {};
  for (const s of shops) {
    const shop = await prisma.shop.upsert({
      where: { slug: s.slug },
      update: { name: s.name, description: s.description, ownerId: owner.id },
      create: { ...s, ownerId: owner.id },
    });
    upserted[s.slug] = shop.id;
  }

  // Attach posts based on title heuristics
  const allPosts = await prisma.post.findMany({ where: { shopId: null } });
  for (const p of allPosts) {
    const title = p.title.toLowerCase();
    let shopId: string | null = null;
    if (/\bcha\b|chai|tea/.test(title)) shopId = upserted["cha-house"];
    else if (/burger|fries|fried chicken/.test(title))
      shopId = upserted["burger-station"];
    else if (/biryani|kebab|rice|pulao|khichuri/.test(title))
      shopId = upserted["food-corner"];

    if (!shopId) {
      // fallback: distribute to Food Corner
      shopId = upserted["food-corner"];
    }

    await prisma.post.update({ where: { id: p.id }, data: { shopId } });
  }

  console.log("Seeded shops and attached posts");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
