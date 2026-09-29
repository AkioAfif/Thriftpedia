// Usage: node scripts/concurrent-purchase.js <productId> <buyerToken1> <buyerToken2> [...]
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5000';

async function main() {
  const [productId, ...tokens] = process.argv.slice(2);
  if (!productId || tokens.length < 2) {
    console.error('Usage: node scripts/concurrent-purchase.js <productId> <token1> <token2> [...]');
    process.exit(1);
  }

  const results = await Promise.all(tokens.map(async (token, i) => {
    const res = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId }),
    });
    return { buyer: i + 1, status: res.status, body: await res.json().catch(() => null) };
  }));

  console.table(results.map(({ buyer, status, body }) => ({ buyer, status, message: body?.message })));
  const wins = results.filter((r) => r.status === 201).length;
  console.log(wins === 1 ? 'PASS: exactly one purchase succeeded' : `FAIL: ${wins} purchases succeeded`);
  process.exitCode = wins === 1 ? 0 : 1;
}

main();
