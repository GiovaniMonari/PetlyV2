// Cache em memória para acesso instantâneo durante a sessão
let citiesCache: { nome: string; estado: string; normalized: string }[] | null = null;
// Promise para evitar múltiplas requisições paralelas idênticas
let fetchPromise: Promise<{ nome: string; estado: string; normalized: string }[]> | null = null;

const CACHE_KEY = 'petly_cities_cache';
const CACHE_EXPIRATION = 1000 * 60 * 60 * 24 * 7; // 7 dias

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Busca todos os municípios do Brasil com cache em LocalStorage e Memória
 */
async function getCities(): Promise<{ nome: string; estado: string; normalized: string }[]> {
  // 1. Retorna do cache em memória se disponível (mais rápido)
  if (citiesCache) return citiesCache;

  // 2. Se já houver uma requisição em andamento, aguarda ela
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      // 3. Tenta recuperar do LocalStorage para evitar download em produção
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          // Verifica se o cache ainda é válido
          if (Date.now() - timestamp < CACHE_EXPIRATION) {
            citiesCache = data;
            return data;
          }
        }
      }

      // 4. Se não houver cache válido, busca da API do IBGE
      const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
      if (!res.ok) throw new Error('Falha ao buscar cidades do IBGE');
      
      const data = await res.json();
      
      const processedData = data.map((m: any) => ({
        nome: m.nome,
        estado: m.microrregiao?.mesorregiao?.UF?.sigla || '??',
        normalized: normalizeString(m.nome)
      }));

      // 5. Salva no LocalStorage para futuras visitas
      if (typeof window !== 'undefined') {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: processedData,
          timestamp: Date.now()
        }));
      }

      citiesCache = processedData;
      return processedData;
    } catch (error) {
      console.error('Erro ao carregar lista de cidades:', error);
      return [];
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

export async function searchLocation(query: string): Promise<string[]> {
  if (query.length < 3) return [];

  const normalizedQuery = normalizeString(query);
  const cities = await getCities();

  if (!cities.length) return [];

  // Busca ultra-rápida em memória
  const results = cities
    .filter(city => city.normalized.includes(normalizedQuery))
    .sort((a, b) => {
      const startsA = a.normalized.startsWith(normalizedQuery);
      const startsB = b.normalized.startsWith(normalizedQuery);
      
      if (startsA && !startsB) return -1;
      if (!startsA && startsB) return 1;
      return a.nome.length - b.nome.length;
    })
    .slice(0, 5)
    .map(city => `${city.nome} - ${city.estado}`);

  return Array.from(new Set(results));
}
