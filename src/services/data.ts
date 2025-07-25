import { uploadCollection } from '../utils/mongo-client'

export interface UploadData {
  TICODE: string
  EPISODENO: string
  SeasonName: string
  SeriesName: string
  BrandTiCode: string
}

export function getUploadData(id: string, tiCode: string, episodeNo: string) {
  return uploadCollection
    .aggregate<UploadData>([
      {
        $match: {
          id
        }
      },
      {
        $lookup: {
          from: 'uploads',
          localField: 'parsedData.EpisodeData.TICODE',
          foreignField: 'parsedData.Title.TICODE',
          pipeline: [
            {
              $project: {
                SeriesTitle: {
                  $arrayElemAt: ['$parsedData.Title.SeriesTitle', 0]
                }
              }
            }
          ],
          as: 'titleData'
        }
      },
      {
        $lookup: {
          from: 'uploads',
          localField: 'parsedData.EpisodeData.TICODE',
          foreignField: 'parsedData.Packages.TiCode',
          pipeline: [
            { $match: { 'parsedData.Packages.Phase': 'Parent Brand' } },
            {
              $project: {
                DisplayName: {
                  $arrayElemAt: ['$parsedData.Packages.DisplayName', 0]
                },
                BrandTiCode: {
                  $arrayElemAt: ['$parsedData.Packages.BrandTiCode', 0]
                }
              }
            }
          ],
          as: 'packageData'
        }
      },
      {
        $unwind: {
          path: '$parsedData.EpisodeData'
        }
      },
      {
        $match: {
          'parsedData.EpisodeData.EPISODENO': episodeNo,
          'parsedData.EpisodeData.TICODE': tiCode
        }
      },
      {
        $project: {
          TICODE: '$parsedData.EpisodeData.TICODE',
          EPISODENO: '$parsedData.EpisodeData.EPISODENO',
          SeasonName: {
            $arrayElemAt: ['$titleData.SeriesTitle', 0]
          },
          SeriesName: {
            $arrayElemAt: ['$packageData.DisplayName', 0]
          },
          BrandTiCode: {
            $arrayElemAt: ['$packageData.BrandTiCode', 0]
          }
        }
      }
    ])
    .toArray()
}
