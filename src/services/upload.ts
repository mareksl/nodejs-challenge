import fs from 'fs'
import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { iconik } from './iconik'
import { validation } from './validation'
import { uploadCollection } from '../utils/mongo-client'
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
        status: 'uploaded',
        iconikCollection: []
      }

      await uploadCollection.insertOne(uploadEntry)

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
      const { TICODE, EPISODENO } = req.params
      const { databaseId } = req.body

      if (!databaseId) {
        return res.status(400).json({
          error: 'Missing database ID',
          message: 'Please provide databaseId in request body'
        })
      }

      // Get upload data
      const uploadData = (await getUploadData(databaseId, TICODE, EPISODENO))[0]

      if (!uploadData) {
        return res.status(404).json({
          error: 'Upload not found',
          message: `No upload found for ID: ${databaseId}, TICODE: ${TICODE}, EPISODENO: ${EPISODENO}`
        })
      }

      if (!uploadData.TICODE || !uploadData.EPISODENO) {
        return res.status(400).json({
          error: 'Invalid upload data',
          message: `Upload data for ID: ${databaseId} is missing TICODE or EPISODENO`
        })
      }

      if (!uploadData.SeasonName) {
        return res.status(400).json({
          error: 'Invalid upload data',
          message: `Upload data for ID: ${databaseId} is missing SeasonName. Please upload titledata first.`
        })
      }

      if (!uploadData.SeriesName || !uploadData.BrandTiCode) {
        return res.status(400).json({
          error: 'Invalid upload data',
          message: `Upload data for ID: ${databaseId} is missing SeriesName or BrandTiCode. Please upload packages first.`
        })
      }

      // Check if collection exists
      const exists = await iconik.collectionExists(TICODE, EPISODENO)
      if (exists) {
        return res.status(400).json({
          error: 'Collection already exists',
          message: `Collection for ${TICODE}/${EPISODENO} already exists`
        })
      }

      // Create collection
      const iconikResult = await iconik.createCollection(TICODE, EPISODENO, uploadData)

      // Update database

      const date = new Date()

      const { modifiedCount } = await uploadCollection.updateOne(
        { id: databaseId },
        {
          $set: {
            'iconikCollection.$[entry].iconikId': iconikResult.id,
            'iconikCollection.$[entry].createdDate': date
          }
        },
        { arrayFilters: [{ 'entry.episodeNo': EPISODENO }] }
      )

      if (modifiedCount === 0) {
        await uploadCollection.updateOne(
          { id: databaseId },
          {
            $push: {
              iconikCollection: {
                ticode: TICODE,
                episodeNo: EPISODENO,
                iconikId: iconikResult.id,
                createdDate: date
              }
            },
            $set: {
              lastUpdated: date
            }
          }
        )
      } else {
        await uploadCollection.updateOne(
          { id: databaseId },
          {
            $set: {
              lastUpdated: date
            }
          }
        )
      }

      return res.status(201).json({
        success: true,
        message: 'Collection created successfully',
        data: {
          ticode: TICODE,
          episodeNo: EPISODENO,
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
      const { TICODE, EPISODENO } = req.params
      const { databaseId } = req.body

      if (!databaseId) {
        return res.status(400).json({
          error: 'Missing database ID',
          message: 'Please provide databaseId in request body'
        })
      }

      // Get upload data
      const uploadData = (await uploadCollection.findOne({ id: databaseId })) as any | null
      if (!uploadData) {
        return res.status(404).json({
          error: 'Upload not found',
          message: `No upload found for ID: ${databaseId}`
        })
      }

      // Check if collection exists
      const exists = await iconik.collectionExists(TICODE, EPISODENO)
      if (!exists) {
        return res.status(400).json({
          error: 'Collection does not exist',
          message: `Collection for ${TICODE}/${EPISODENO} not found. Use /create first.`
        })
      }

      // Update collection
      const iconikResult = await iconik.updateCollection(TICODE, EPISODENO, uploadData)

      // Update database
      await uploadCollection.updateOne(
        { id: databaseId },
        {
          $set: {
            'iconikCollection.lastUpdated': new Date(),
            lastUpdated: new Date()
          }
        }
      )

      return res.status(200).json({
        success: true,
        message: 'Collection updated successfully',
        data: {
          ticode: TICODE,
          episodeNo: EPISODENO,
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
  }
}
