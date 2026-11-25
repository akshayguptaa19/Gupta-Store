import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getDb } from '@/lib/mongodb';
import { BASE_PRODUCTS } from '@/lib/products';

const BACKUP_FILE = path.join(process.cwd(), 'src', 'data', 'products-store.json');

const DEFAULT_STORE_DATA = {
  overrides: {},
  customs: [],
  stocks: {},
  availability: {},
  images: {},
  deleted: [],
  updatedAt: new Date().toISOString(),
};

async function readBackupFile() {
  try {
    const raw = await fs.readFile(BACKUP_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_STORE_DATA };
  }
}

async function writeBackupFile(data) {
  try {
    const dir = path.dirname(BACKUP_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(BACKUP_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('Failed to write product store backup file:', err?.message);
  }
}

export async function getProductStoreData() {
  let data = null;
  try {
    const db = await getDb();
    const doc = await db.collection('product_store').findOne({ _id: 'global_store_catalog' });
    if (doc) {
      data = {
        overrides: doc.overrides || {},
        customs: doc.customs || [],
        stocks: doc.stocks || {},
        availability: doc.availability || {},
        images: doc.images || {},
        deleted: doc.deleted || [],
        updatedAt: doc.updatedAt || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn('MongoDB fetch product_store failed, falling back to backup file:', err?.message);
  }

  if (!data) {
    data = await readBackupFile();
  }

  return data;
}

export async function saveProductStoreData(data) {
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
  };

  // 1. Write to local file backup
  await writeBackupFile(payload);

  // 2. Persist to MongoDB
  try {
    const db = await getDb();
    await db.collection('product_store').updateOne(
      { _id: 'global_store_catalog' },
      { $set: payload },
      { upsert: true }
    );
  } catch (err) {
    console.warn('MongoDB save product_store failed:', err?.message);
  }

  return payload;
}

export async function getMergedProductsServer() {
  const { overrides, customs, stocks, availability, images, deleted } = await getProductStoreData();

  const merged = BASE_PRODUCTS
    .filter(p => !deleted.includes(p.id))
    .map(p => {
      const ov = overrides[p.id] || {};
      const img = images[p.id] || ov.image || p.image;
      const stk = stocks[p.id] !== undefined ? Number(stocks[p.id]) : p.stock;
      const avl = availability[p.id] !== undefined ? availability[p.id] : true;
      const base = {
        ...p,
        ...ov,
        image: img,
        stock: stk,
      };
      if (!avl) base._hidden = true;
      return base;
    })
    .filter(p => !p._hidden);

  (customs || []).forEach(cp => {
    if (deleted.includes(cp.id)) return;
    const avl = availability[cp.id] !== undefined ? availability[cp.id] : true;
    if (!avl) return;
    merged.push({
      ...cp,
      image: images[cp.id] || cp.image,
      stock: stocks[cp.id] !== undefined ? Number(stocks[cp.id]) : (Number(cp.stock) || 0),
      tags: cp.tags || [cp.name.toLowerCase(), cp.category],
      features: cp.features || ['Admin added product', 'Fresh stock', 'Ready to sell'],
      rating: cp.rating || 4.5,
      reviews: cp.reviews || 0,
    });
  });

  return merged;
}

export async function setProductImageServer(productId, imageUrl) {
  const data = await getProductStoreData();
  const idStr = String(productId);
  const idNum = Number(productId);

  data.images[idStr] = imageUrl;
  if (!isNaN(idNum)) {
    data.images[idNum] = imageUrl;
  }

  if (!data.overrides[idStr]) {
    data.overrides[idStr] = {};
  }
  data.overrides[idStr].image = imageUrl;

  // If it's a custom product, also update cp.image
  const customIdx = (data.customs || []).findIndex(p => String(p.id) === idStr);
  if (customIdx !== -1) {
    data.customs[customIdx].image = imageUrl;
  }

  await saveProductStoreData(data);
  return data;
}
