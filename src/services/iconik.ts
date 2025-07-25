import { iconikClient } from '../utils/iconik-client'
import { ICONIK_COLLECTION_ID } from '../config/env-vars'
import { UploadData } from './data'

interface IconikCollection {
  title: string
  external_id: string
  id: string
}

export const iconik = {
  async createCollection(ticode: string, episodeNo: string, data: UploadData): Promise<any> {
    console.log(`Creating collection for ${ticode}/${episodeNo}`)

    const brandCollection = await getBrandCollection(data.BrandTiCode)

    const brandId = brandCollection
      ? brandCollection.id
      : (await createBrandCollection(data.BrandTiCode, data.SeriesName)).id

    const seasonCollection = await getSeasonCollection(brandId, ticode)

    const seasonId = seasonCollection
      ? seasonCollection.id
      : (await createSeasonCollection(brandId, ticode, data.SeasonName)).id

    const response = await iconikClient.post<IconikCollection>('/assets/v1/collections', {
      external_id: `${ticode}_${episodeNo}`,
      parent_id: seasonId,
      title: data.EPISODENO
    })

    return {
      id: response.data.id,
      status: 'created',
      ticode,
      episodeNo
    }
  },

  async updateCollection(ticode: string, episodeNo: string, data: any): Promise<any> {
    // TODO: Implement actual iconik API call
    // Example: const response = await iconikClient.put(`/collections/${collectionId}`, { ... })
    console.log(`Updating collection for ${ticode}/${episodeNo}`)
    return {
      id: `iconik_collection_${Date.now()}`,
      status: 'updated',
      ticode,
      episodeNo
    }
  },

  async collectionExists(ticode: string, episodeNo: string): Promise<boolean> {
    console.log(`Checking if collection exists for ${ticode}/${episodeNo}`)

    const searchQuery = `${ticode}_${episodeNo}`
    const requestBody = {
      doc_types: ['collections'],
      query: searchQuery,
      search_fields: ['external_id'],
      filter: {
        operator: 'AND',
        terms: [
          {
            name: 'ancestor_collections',
            value_in: [ICONIK_COLLECTION_ID]
          },
          { name: 'status', value: 'ACTIVE' }
        ]
      }
    }

    const response = await iconikClient.post<{
      total: number
      objects: IconikCollection[]
    }>(`search/v1/search`, requestBody)

    return response.data.total > 0
  }
}

async function getBrandCollection(brandTiCode: string): Promise<IconikCollection | null> {
  const requestBody = {
    doc_types: ['collections'],
    query: brandTiCode,
    search_fields: ['external_id'],
    filter: {
      operator: 'AND',
      terms: [
        {
          name: 'parent_id',
          value: ICONIK_COLLECTION_ID
        },
        { name: 'status', value: 'ACTIVE' }
      ]
    }
  }

  const response = await iconikClient.post<{
    total: number
    objects: IconikCollection[]
  }>(`search/v1/search`, requestBody)

  return response.data.objects[0] || null
}

async function createBrandCollection(brandTiCode: string, seriesName: string): Promise<IconikCollection> {
  const response = await iconikClient.post<IconikCollection>('/assets/v1/collections', {
    external_id: brandTiCode,
    parent_id: ICONIK_COLLECTION_ID,
    title: seriesName
  })

  return response.data
}

async function getSeasonCollection(brandTiCode: string, ticode: string): Promise<IconikCollection | null> {
  const requestBody = {
    doc_types: ['collections'],
    query: ticode,
    search_fields: ['external_id'],
    filter: {
      operator: 'AND',
      terms: [
        {
          name: 'parent_id',
          value: brandTiCode
        },
        { name: 'status', value: 'ACTIVE' }
      ]
    }
  }

  const response = await iconikClient.post<{
    total: number
    objects: IconikCollection[]
  }>(`search/v1/search`, requestBody)

  return response.data.objects[0] || null
}

async function createSeasonCollection(brandId: string, ticode: string, seasonName: string): Promise<IconikCollection> {
  const response = await iconikClient.post<IconikCollection>('/assets/v1/collections', {
    external_id: ticode,
    parent_id: brandId,
    title: seasonName
  })

  return response.data
}
