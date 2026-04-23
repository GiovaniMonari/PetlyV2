export async function searchLocation(query: string): Promise<string[]> {
  if (query.length < 3) return [];

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&addressdetails=1&countrycodes=br&limit=5`
    );
    const data = await res.json();

    const newSuggestions = data
      .filter(
        (item: any) =>
          item.address &&
          (item.address.city ||
            item.address.town ||
            item.address.village ||
            item.address.municipality)
      )
      .map((item: any) => {
        const city =
          item.address.city ||
          item.address.town ||
          item.address.village ||
          item.address.municipality;
        let stateAbbr = item.address['ISO3166-2-lvl4']
          ? item.address['ISO3166-2-lvl4'].split('-')[1]
          : item.address.state;
        return `${city} - ${stateAbbr}`;
      });

    return Array.from(new Set(newSuggestions)) as string[];
  } catch (err) {
    console.error('Erro ao buscar localização:', err);
    return [];
  }
}
