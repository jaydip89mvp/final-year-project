import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let resource_type = 'auto'; // Default to auto
        let public_id = undefined;

        // Force 'raw' for Documents (Word, Text) to ensure they are stored as files
        // PDF is removed from here to let it be handled as 'image' (auto) which is usually public and viewable
        const isRawDocument = file.mimetype.includes('msword') ||
            file.mimetype.includes('office') ||
            file.mimetype.includes('text');

        if (isRawDocument) {
            resource_type = 'raw';
            // For raw files, we MUST preserve the extension in the public_id
            const name = file.originalname.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
            const ext = file.originalname.split('.').pop();
            public_id = `${name}_${Date.now()}.${ext}`;
        } else if (file.mimetype === 'application/pdf') {
            resource_type = 'image'; // Explicitly treat PDF as image to ensure public access
            // No public_id set manually, let Cloudinary handle it or use original filename
        } else if (file.mimetype.startsWith('video/')) {

            resource_type = 'video';
        } else if (file.mimetype.startsWith('audio/')) {
            resource_type = 'video'; // Cloudinary treats audio as video resource type often, or 'auto' handles it
        } else if (file.mimetype.startsWith('image/')) {
            resource_type = 'image';
        }

        return {
            folder: 'classroom_uploads',
            resource_type: resource_type,
            public_id: public_id, // Only set if raw, otherwise let Cloudinary/Multer handle it
            // allowed_formats is not needed if we control resource_type manually, 
            // but we can keep it permissive if needed. 
            // However, with raw files, format is part of the filename.
        };
    },
});

export { cloudinary, storage };
