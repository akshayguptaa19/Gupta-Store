import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'gupta-store';

let client;
let cachedClient;

export async function connectToDatabase() {
  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (cachedClient) return { client: cachedClient, db: cachedClient.db(dbName) };

  client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;

  return { client: cachedClient, db: cachedClient.db(dbName) };
}

export async function getDb() {
  const { db } = await connectToDatabase();
  return db;
}

export async function getUsersCollection() {
  const db = await getDb();
  const users = db.collection('users');
  await users.createIndex({ email: 1 }, { unique: true });
  await users.createIndex({ phone: 1 }, { unique: true });
  return users;
}
