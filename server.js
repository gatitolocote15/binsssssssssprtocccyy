const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// CORS abierto para el frontend en Azure
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// ─── BIN → slug mapping ───────────────────────────────────────────────────
function detectSlug(bankName) {
  const b = (bankName || '').toLowerCase();
  if (b.includes('bancolombia'))                        return 'bancolombia';
  if (b.includes('davibank'))                           return 'davibank';
  if (b.includes('davivienda'))                         return 'davivienda';
  if (b.includes('bogot'))                              return 'bogota';
  if (b.includes('popular'))                            return 'popular';
  if (b.includes('occidente') || b.includes('ocidente')) return 'occidente';
  if (b.includes('av villas') || b.includes('avvillas') || b.includes('av-villas')) return 'avvillas';
  if (b.includes('bbva'))                               return 'bbva';
  if (b.includes('nequi'))                              return 'nequi';
  if (b.includes('nubank') || b.includes('nu bank'))   return 'nu';
  if (b.includes('lulo'))                               return 'lulo';
  if (b.includes('dale'))                               return 'dale';
  if (b.includes('rappi'))                              return 'rappipay';
  if (b.includes('pibank'))                             return 'pibank';
  if (b.includes('littio'))                             return 'littio';
  if (b.includes('santander'))                          return 'santander';
  if (b.includes('falabella'))                          return 'falabella';
  if (b.includes('citi'))                               return 'citi';
  if (b.includes('agrario'))                            return 'agrario';
  if (b.includes('sudameris'))                          return 'sudameris';
  if (b.includes('serfinansa') || b.includes('serfi')) return 'serfi';
  if (b.includes('coomeva') || b.includes('comeva'))   return 'comeva';
  if (b.includes('caja social') || b.includes('cajasocial')) return 'socila';
  if (b.includes('finandina'))                          return 'finandina';
  return 'default';
}

// ─── Endpoint principal ───────────────────────────────────────────────────
// GET /bin/453901  →  { scheme, type, bank, slug }
app.get('/bin/:bin', async (req, res) => {
  const bin = req.params.bin.replace(/\D/g, '').slice(0, 8);
  if (bin.length < 6) return res.status(400).json({ error: 'BIN debe tener mínimo 6 dígitos' });

  try {
    const response = await fetch(`https://lookup.binlist.net/${bin}`, {
      headers: { 'Accept-Version': '3' }
    });

    if (!response.ok) {
      return res.status(404).json({ error: 'BIN no encontrado', slug: 'default' });
    }

    const data = await response.json();
    const bankName = data.bank?.name || '';
    const slug     = detectSlug(bankName);

    res.json({
      scheme:  data.scheme          || '',
      type:    data.type            || '',
      brand:   data.brand           || '',
      bank:    bankName,
      country: data.country?.alpha2 || '',
      slug:    slug
    });
  } catch (err) {
    console.error('[BIN lookup error]', err.message);
    res.status(500).json({ error: 'Error interno', slug: 'default' });
  }
});

// ─── Healthcheck ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ─── Keep-alive (evita que Render duerma) ────────────────────────────────
const SELF_URL = process.env.RENDER_EXTERNAL_URL || process.env.RENDER_URL || `http://localhost:${PORT}`;
setInterval(() => {
  fetch(`${SELF_URL}/health`)
    .then(() => console.log('[keep-alive] ping OK'))
    .catch(() => {});
}, 840000); // cada 14 minutos

// ─── Iniciar ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`BIN proxy corriendo en puerto ${PORT}`);
  console.log(`Endpoint: GET /bin/:bin`);
});
