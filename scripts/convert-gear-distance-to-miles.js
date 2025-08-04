// scripts/convert-gear-distance-to-miles.js
import { PrismaClient } from '@prisma/client';
import { conversions } from '../src/utils/calculations.js';

const prisma = new PrismaClient();

async function main() {
  const gears = await prisma.gear.findMany();
  for (const gear of gears) {
    if (gear.distance != null && gear.distance > 0) {
      const distanceMiles = conversions.metersToMiles(gear.distance);
      await prisma.gear.update({
        where: { id: gear.id },
        data: { distance: distanceMiles },
      });
      console.log(`Updated gear ${gear.id}: ${gear.distance}m -> ${distanceMiles}mi`);
    }
  }
  console.log('Gear distance conversion complete.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});