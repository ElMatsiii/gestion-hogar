import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import serverModule from '../dist/presentation/server.js';
const app = serverModule.default || serverModule;

let server;
let port;

test.before((t, done) => {
  server = app.listen(0, () => {
    port = server.address().port;
    done();
  });
});

test.after((t, done) => {
  server.close(done);
});

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: payload
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            }
          : {},
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, body: parsed.data !== undefined ? parsed.data : parsed });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

test('API Health: returns online status and architecture info', async () => {
  const res = await request('GET', '/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'online');
  assert.equal(res.body.architecture, 'Clean Architecture (SOLID)');
});

test('Finances & Members Flow: CRUD members, expenses, subscriptions, and summary', async () => {
  // 1. Create member
  const mRes = await request('POST', '/api/finances/members', {
    name: 'Integracion Test',
    role: 'Administrador',
    monthlyIncome: 1000000,
    avatarColor: '#10B981',
  });
  assert.equal(mRes.status, 201);
  assert.ok(mRes.body.id);
  const memberId = mRes.body.id;

  // 2. Update income
  const incRes = await request('PUT', `/api/finances/members/${memberId}/income`, {
    monthlyIncome: 1200000,
  });
  assert.equal(incRes.status, 200);
  assert.equal(incRes.body.monthlyIncome, 1200000);

  // 3. Create shared expense
  const expRes = await request('POST', '/api/finances/expenses', {
    title: 'Gasto Supermercado',
    amount: 200000,
    category: 'ALIMENTACION',
    type: 'SHARED',
    paidById: memberId,
    date: '2026-10-19',
  });
  assert.equal(expRes.status, 201);
  const expenseId = expRes.body.id;

  // 4. Create subscription
  const subRes = await request('POST', '/api/finances/subscriptions', {
    title: 'Internet Fibra',
    amount: 30000,
    billingDay: 10,
    type: 'SHARED',
    category: 'Servicios',
  });
  assert.equal(subRes.status, 201);

  // 5. Check financial summary while subscription is active (includes 200,000 expense + 30,000 subscription)
  const activeSumRes = await request('GET', '/api/finances/summary');
  assert.equal(activeSumRes.status, 200);
  assert.equal(activeSumRes.body.totalExpenses, 230000);
  assert.equal(activeSumRes.body.remainingFamilyPool, 970000);
  const subCategory = activeSumRes.body.categoryBreakdown.find((c) => c.category === 'SUSCRIPCIONES');
  assert.ok(subCategory);
  assert.equal(subCategory.total, 30000);

  // 6. Toggle subscription inactive
  const subId = subRes.body.id;
  const togSub = await request('PATCH', `/api/finances/subscriptions/${subId}/toggle`);
  assert.equal(togSub.status, 200);
  assert.equal(togSub.body.isActive, false);

  // 7. Check financial summary after subscription is paused
  const sumRes = await request('GET', '/api/finances/summary');
  assert.equal(sumRes.status, 200);
  assert.equal(sumRes.body.remainingFamilyPool, 1000000);

  // 7. Delete expense and subscription
  const delExp = await request('DELETE', `/api/finances/expenses/${expenseId}`);
  assert.equal(delExp.status, 200);

  const delSub = await request('DELETE', `/api/finances/subscriptions/${subId}`);
  assert.equal(delSub.status, 200);
});

test('Receipt Scanner Validation: rejects missing image or missing API key', async () => {
  // Missing image payload
  const noImageRes = await request('POST', '/api/finances/scan-receipt', {});
  assert.equal(noImageRes.status, 400);

  // Provided image but invalid/missing Gemini API key
  const noKeyRes = await request('POST', '/api/finances/scan-receipt', {
    imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  });
  assert.equal(noKeyRes.status, 400);

  // Recipe suggestions without API key returns 400 with helpful error
  const noRecipeKeyRes = await request('POST', '/api/inventory/suggest-recipes', {
    inventory: [{ name: 'Pollo', quantity: 1, unit: 'kg', category: 'Carnes y Pescados' }],
    membersCount: 4,
    daysCount: 2,
  });
  assert.equal(noRecipeKeyRes.status, 400);
});

test('Inventory & Shopping List Flow: CRUD items, stock adjustment, and clear purchased', async () => {
  // 1. Create item
  const iRes = await request('POST', '/api/inventory/items', {
    name: 'Aceite de Oliva',
    category: 'Despensa y Granos',
    quantity: 3,
    unit: 'litros',
    minThreshold: 1,
    location: 'Despensa',
  });
  assert.equal(iRes.status, 201);
  const itemId = iRes.body.id;

  // 2. Adjust stock
  const adjRes = await request('PATCH', `/api/inventory/items/${itemId}/stock`, { delta: -1 });
  assert.equal(adjRes.status, 200);
  assert.equal(adjRes.body.quantity, 2);

  // 3. Create shopping item
  const sRes = await request('POST', '/api/inventory/shopping', {
    name: 'Manzanas',
    quantity: 6,
    unit: 'unidades',
    category: 'Frutas y Verduras',
  });
  assert.equal(sRes.status, 201);
  const shopId = sRes.body.id;

  // 4. Toggle purchased
  const togRes = await request('PATCH', `/api/inventory/shopping/${shopId}/toggle`, {
    isPurchased: true,
  });
  assert.equal(togRes.status, 200);
  assert.equal(togRes.body.isPurchased, true);

  // 5. Clear purchased
  const clearRes = await request('DELETE', '/api/inventory/shopping/actions/clear-purchased');
  assert.equal(clearRes.status, 200);
});
