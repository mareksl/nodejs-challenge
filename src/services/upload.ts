import fs from 'fs'
import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { iconik } from './iconik'
import { validation } from './validation'
import { iconikCollections, uploads } from '../utils/mongo-client'
import { UploadEntry } from '../schema/upload'
import { getUploadData } from './data'

export const upload = {
  async handleUpload(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          message: 'Please provide a file to upload'
        })
      }

      const fileBuffer = fs.readFileSync(req.file.path)

      const { parsedData, properties } = await validation.validateFile(req.file, fileBuffer)

      // Save to database
      const uploadEntry: UploadEntry = {
        id: uuidv4(),
        filename: req.file.originalname,
        uploadDate: new Date(),
        fileProperties: properties,
        parsedData,
        status: 'uploaded'
      }

      await uploads.insertOne(uploadEntry)

      // Clean up uploaded file
      fs.unlinkSync(req.file.path)

      return res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          id: uploadEntry.id,
          filename: uploadEntry.filename,
          uploadDate: uploadEntry.uploadDate
        }
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Upload failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },

  async createCollection(req: Request, res: Response): Promise<Response> {
    try {
      const { TICODE: tiCode, EPISODENO: episodeNo } = req.params
      const { databaseId } = req.body

      if (!databaseId) {
        return res.status(400).json({
          error: 'Missing database ID',
          message: 'Please provide databaseId in request body'
        })
      }

      // Get upload data
      const uploadData = (await getUploadData(databaseId, tiCode, episodeNo))[0]

      if (!uploadData) {
        return res.status(404).json({
          error: 'Upload not found',
          message: `No upload found for ID: ${databaseId}, TICODE: ${tiCode}, EPISODENO: ${episodeNo}`
        })
      }

      if (!uploadData.tiCode || !uploadData.episodeNo) {
        return res.status(400).json({
          error: 'Invalid upload data',
          message: `Upload data for ID: ${databaseId} is missing TICODE or EPISODENO`
        })
      }

      if (!uploadData.seasonName) {
        return res.status(400).json({
          error: 'Invalid upload data',
          message: `Upload data for ID: ${databaseId} is missing SeasonName. Please upload titledata first.`
        })
      }

      if (!uploadData.seriesName || !uploadData.brandTiCode) {
        return res.status(400).json({
          error: 'Invalid upload data',
          message: `Upload data for ID: ${databaseId} is missing SeriesName or BrandTiCode. Please upload packages first.`
        })
      }

      // Check if collection exists
      const exists = await iconik.collectionExists(tiCode, episodeNo)
      if (exists) {
        return res.status(400).json({
          error: 'Collection already exists',
          message: `Collection for ${tiCode}/${episodeNo} already exists`
        })
      }

      // Create collection
      const iconikResult = await iconik.createCollection(tiCode, episodeNo, uploadData)
      const date = new Date()

      iconikCollections.updateOne(
        {
          tiCode,
          episodeNo
        },
        {
          $set: {
            id: uuidv4(),
            iconikId: iconikResult.id,
            createdDate: date,
            tiCode,
            episodeNo,
            episodeName: uploadData.episodeName,
            seasonName: uploadData.seasonName,
            seriesName: uploadData.seriesName,
            brandTiCode: uploadData.brandTiCode
          }
        },
        {
          upsert: true
        }
      )

      return res.status(201).json({
        success: true,
        message: 'Collection created successfully',
        data: {
          tiCode,
          episodeNo,
          databaseId,
          iconikId: iconikResult.id
        }
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Collection creation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },

  async updateCollection(req: Request, res: Response): Promise<Response> {
    try {
      const { TICODE: tiCode, EPISODENO: episodeNo } = req.params
      const { databaseId } = req.body

      if (!databaseId) {
        return res.status(400).json({
          error: 'Missing database ID',
          message: 'Please provide databaseId in request body'
        })
      }

      // Get upload data
      const uploadData = (await getUploadData(databaseId, tiCode, episodeNo))[0]

      if (!uploadData) {
        return res.status(404).json({
          error: 'Upload not found',
          message: `No upload found for ID: ${databaseId}, TICODE: ${tiCode}, EPISODENO: ${episodeNo}`
        })
      }

      if (!uploadData.tiCode || !uploadData.episodeNo) {
        return res.status(400).json({
          error: 'Invalid upload data',
          message: `Upload data for ID: ${databaseId} is missing TICODE or EPISODENO`
        })
      }

      if (!uploadData.seasonName) {
        return res.status(400).json({
          error: 'Invalid upload data',
          message: `Upload data for ID: ${databaseId} is missing SeasonName. Please upload titledata first.`
        })
      }

      if (!uploadData.seriesName || !uploadData.brandTiCode) {
        return res.status(400).json({
          error: 'Invalid upload data',
          message: `Upload data for ID: ${databaseId} is missing SeriesName or BrandTiCode. Please upload packages first.`
        })
      }

      const collection = await iconik.getCollection(tiCode, episodeNo)
      if (!collection) {
        return res.status(400).json({
          error: 'Collection does not exist',
          message: `Collection for ${tiCode}/${episodeNo} not found. Use /create first.`
        })
      }

      // Update collection
      const iconikResult = await iconik.updateCollection(tiCode, episodeNo, collection.id, uploadData)

      const date = new Date()

      iconikCollections.updateOne(
        { tiCode, episodeNo },
        {
          $set: {
            iconikId: iconikResult.id,
            episodeName: uploadData.episodeName,
            seasonName: uploadData.seasonName,
            seriesName: uploadData.seriesName,
            brandTiCode: uploadData.brandTiCode,
            lastUpdated: date
          }
        }
      )

      return res.status(200).json({
        success: true,
        message: 'Collection updated successfully',
        data: {
          tiCode,
          episodeNo,
          databaseId,
          iconikId: iconikResult.id
        }
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Collection update failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },

  async validate(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file provided',
          message: 'Please provide a file to validate'
        })
      }

      const fileBuffer = fs.readFileSync(req.file.path)

      // Validate file
      const { properties } = await validation.validateFile(req.file, fileBuffer)

      // Clean up
      fs.unlinkSync(req.file.path)

      return res.status(200).json({
        success: true,
        message: 'File validation completed',
        data: {
          isValid: properties.isValid,
          properties,
          validatedAt: new Date()
        }
      })
    } catch (error) {
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path)
        } catch {
          // File cleanup failed, but continue
        }
      }

      return res.status(400).json({
        error: 'Validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  },

  async getCollection(req: Request, res: Response): Promise<Response> {
    const { TICODE: tiCode, EPISODENO: episodeNo } = req.params

    try {
      const collection = await iconik.getCollection(tiCode, episodeNo)

      if (!collection) {
        return res.status(404).json({
          error: 'Collection not found',
          message: `No collection found for TICODE: ${tiCode}, EPISODENO: ${episodeNo}`
        })
      }

      return res.status(200).json({
        success: true,
        data: collection
      })
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to fetch collection',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
