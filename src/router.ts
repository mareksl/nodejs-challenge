import express from 'express'
import multer from 'multer'
import { upload } from './services/upload'

const router = express.Router()
const uploadMiddleware = multer({ dest: 'uploads/' })

router.post('/upload', uploadMiddleware.single('file'), upload.handleUpload)
router.post('/create/:TICODE/:EPISODENO', upload.createCollection)
router.put('/update/:TICODE/:EPISODENO', upload.updateCollection)
router.post('/validate', uploadMiddleware.single('file'), upload.validate)
router.get('/:TICODE/:EPISODENO', upload.getCollection)

export default router
