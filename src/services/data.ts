import { uploads } from '../utils/mongo-client'

export interface UploadData {
  tiCode: string
  episodeNo: string
  episodeName: string
  seasonName: string
  seriesName: string
  brandTiCode: string
}

export function getUploadData(id: string, tiCode: string, episodeNo: string) {
  return uploads
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
            { $unwind: '$parsedData.Packages' },
            { $match: { 'parsedData.Packages.Phase': 'Parent Brand' } },
            {
              $project: {
                DisplayName: '$parsedData.Packages.DisplayName',
                BrandTiCode: '$parsedData.Packages.BrandTiCode'
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
          tiCode: '$parsedData.EpisodeData.TICODE',
          episodeNo: '$parsedData.EpisodeData.EPISODENO',
          episodeName: '$parsedData.EpisodeData.EPISODENAM',
          seasonName: {
            $arrayElemAt: ['$titleData.SeriesTitle', 0]
          },
          seriesName: {
            $arrayElemAt: ['$packageData.DisplayName', 0]
          },
          brandTiCode: {
            $arrayElemAt: ['$packageData.BrandTiCode', 0]
          }
        }
      }
    ])
    .toArray()
}
