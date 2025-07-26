import { iconikClient } from '../utils/iconik-client'
import { ICONIK_COLLECTION_ID } from '../config/env-vars'
import { UploadData } from './data'

interface IconikCollection {
  title: string
  external_id: string
  id: string
}

interface IconikCollectionResponse {
  id: string
  status: string
  ticode: string
  episodeNo: string
}

interface IconicMetadata {
  description: string
}

interface IconicMetadataResponse {
  metadata_values: {
    description: { field_values: [{ value: string }] }
  }
  object_id: string
}

export const iconik = {
  async createCollection(ticode: string, episodeNo: string, data: UploadData): Promise<IconikCollectionResponse> {
    console.log(`Creating collection for ${ticode}/${episodeNo}`)

    const brandCollection = await getBrandCollection(data.brandTiCode)

    const brandId = brandCollection
      ? brandCollection.id
      : (await createBrandCollection(data.brandTiCode, data.seriesName)).id

    const seasonCollection = await getSeasonCollection(brandId, ticode)

    const seasonId = seasonCollection
      ? seasonCollection.id
      : (await createSeasonCollection(brandId, ticode, data.seasonName)).id

    const iconikCollectionResponse = await iconikClient.post<IconikCollection>('/assets/v1/collections', {
      external_id: `${ticode}_${episodeNo}`,
      parent_id: seasonId,
      title: data.episodeNo
    })

    await updateMetadata(iconikCollectionResponse.data.id, {
      description: data.episodeName
    })

    return {
      id: iconikCollectionResponse.data.id,
      status: 'created',
      ticode,
      episodeNo
    }
  },

  async updateCollection(
    ticode: string,
    episodeNo: string,
    collectionId: string,
    data: UploadData
  ): Promise<IconikCollectionResponse> {
    console.log(`Updating collection for ${ticode}/${episodeNo}`)

    const response = await updateMetadata(collectionId, {
      description: data.episodeName
    })

    return {
      id: response.object_id,
      status: 'updated',
      ticode,
      episodeNo
    }
  },

  async collectionExists(ticode: string, episodeNo: string): Promise<boolean> {
    console.log(`Checking if collection exists for ${ticode}/${episodeNo}`)

    const collection = await getCollection(ticode, episodeNo)
    return !!collection
  },

  async getCollection(ticode: string, episodeNo: string): Promise<IconikCollection | null> {
    console.log(`Fetching collection for ${ticode}/${episodeNo}`)

    return getCollection(ticode, episodeNo)
  }
}

async function getCollection(ticode: string, episodeNo: string): Promise<IconikCollection | null> {
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

  return response.data.objects[0] || null
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

async function updateMetadata(collectionId: string, metadata: IconicMetadata): Promise<IconicMetadataResponse> {
  const response = await iconikClient.put<IconicMetadataResponse>(
    // TODO: Get actual view id from api
    `/metadata/v1/collections/${collectionId}/views/2561e1ae-009d-11ef-8396-16951a4d6970/`,
    {
      metadata_values: {
        description: { field_values: [{ value: metadata.description }] }
      }
    }
  )

  return response.data
}
