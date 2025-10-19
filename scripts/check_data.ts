import { drizzle } from "drizzle-orm/mysql2";
import { stores } from "../drizzle/schema";

const db = drizzle(process.env.DATABASE_URL!);

async function checkData() {
  const result = await db.select().from(stores).limit(2);
  console.log('Sample store data:');
  console.log(JSON.stringify(result, null, 2));
}

checkData();

