// Cloudflare Pages Function: proxy para CIMA AEMPS (evita CORS)
// Se despliega automáticamente como /api/cima

export async function onRequestGet(context: { request: Request }) {
  const url = new URL(context.request.url)
  const nombre = url.searchParams.get('nombre') || ''
  const estado = url.searchParams.get('estado') || '1'
  const pagina = url.searchParams.get('pagina') || '1'

  if (!nombre || nombre.length < 3) {
    return new Response(JSON.stringify({ resultados: [] }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }

  const cimaUrl = `https://cima.aemps.es/cima/rest/medicamentos?nombre=${encodeURIComponent(nombre)}&estado=${estado}&pagina=${pagina}`

  try {
    const resp = await fetch(cimaUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DiarioDigestivo/1.0)',
        'Accept': 'application/json',
      }
    })

    if (!resp.ok) {
      return new Response(JSON.stringify({ resultados: [], error: `CIMA ${resp.status}` }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      })
    }

    const data = await resp.json()
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600', // cachea 1h
      }
    })
  } catch (e) {
    return new Response(JSON.stringify({ resultados: [], error: String(e) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    })
  }
}
