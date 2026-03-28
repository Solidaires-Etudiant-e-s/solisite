interface SyndicatCoordinates {
  latitude: number
  longitude: number
}

interface NominatimResult {
  lat: string
  lon: string
}

export async function geocodeSyndicatAddress(address: string, city?: string): Promise<SyndicatCoordinates | null> {
  const parts = [address.trim(), city?.trim(), 'France'].filter(Boolean)

  if (!address.trim() || !parts.length) {
    return null
  }

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', parts.join(', '))
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('limit', '1')

  try {
    const response = await fetch(url, {
      headers: {
        'accept-language': 'fr',
        'user-agent': 'solisite-cms/1.0'
      }
    })

    if (!response.ok) {
      return null
    }

    const results = await response.json() as NominatimResult[]
    const match = results[0]

    if (!match) {
      return null
    }

    const latitude = Number(match.lat)
    const longitude = Number(match.lon)

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null
    }

    return { latitude, longitude }
  } catch {
    return null
  }
}
