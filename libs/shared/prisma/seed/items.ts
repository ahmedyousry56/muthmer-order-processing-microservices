import { PrismaClient } from '@prisma/client';

// Seed for sampling and testing only
export async function seedItems(prisma: PrismaClient) {
  const items = [
    {
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with 2.4GHz USB receiver',
      price: 29.99,
      sku: 'MOUSE-001',
      stock: 150,
    },
    {
      name: 'Mechanical Keyboard',
      description: 'RGB mechanical keyboard with blue switches',
      price: 89.99,
      sku: 'KEYBOARD-001',
      stock: 75,
    },
    {
      name: 'USB-C Hub',
      description:
        '7-in-1 USB-C hub with HDMI, SD card reader, and power delivery',
      price: 45.0,
      sku: 'HUB-001',
      stock: 200,
    },
  ];

  for (const item of items) {
    await prisma.items.upsert({
      where: { sku: item.sku },
      update: {
        name: item.name,
        description: item.description,
        stock: item.stock,
        price: item.price,
      },
      create: item,
    });
  }
  console.log(`Seeded ${items.length} items.`);
}
