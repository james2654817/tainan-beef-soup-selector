import { drizzle } from 'drizzle-orm/mysql2';
import { stores } from '../drizzle/schema';
import { sql } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);

async function checkDistricts() {
  const result = await db.select({ district: stores.district })
    .from(stores)
    .groupBy(stores.district)
    .orderBy(stores.district);

  console.log('資料庫中的所有區域:');
  result.forEach(r => console.log(r.district || '(無區域)'));

  const counts = await db.select({ 
    district: stores.district,
    count: sql`count(*)`.as('count')
  }).from(stores).groupBy(stores.district).orderBy(stores.district);

  console.log('\n各區域店家數量:');
  counts.forEach(c => console.log(`${c.district || '(無區域)'}: ${c.count} 間`));
}

checkDistricts();

