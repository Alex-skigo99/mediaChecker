import knex from "/opt/nodejs/db.js";
import DatabaseTableConstants from "/opt/nodejs/DatabaseTableConstants.js";
import { downloadFileFromS3 } from "./utils/s3Utils.js";
import { photoChecker } from "./utils/photoChecker.js";
import { updateMediaTextAnalysis } from "./utils/updateMediaTextAnalysis.js";

const BATCH_SIZE = 10;

export const handler = async (event) => {
    try {
        console.log('Event received:', JSON.stringify(event, null, 2));
        
        if (event.Records && event.Records.length > 0) {
            return await handleSQSEvent(event);
        }
        
        const limit = event.limit || BATCH_SIZE;
        const offset = event.offset || 0;
        
        return await handleScheduledCheck(limit, offset);
        
    } catch (error) {
        console.error('Error in handler:', error);
        throw error;
    }
};

async function handleSQSEvent(event) {
    const mediaData = event.Records.map((r) => JSON.parse(r.body));
    console.log("Media data:", JSON.stringify(mediaData, null, 2));

    for (const media of mediaData) {
        const { id, gmb_id, name, media_format } = media;

        try {
            if (media_format !== "PHOTO") {
                console.log(`Skipping non-photo media: ${name} (${id})`);
                await updateMediaTextAnalysis(id, false); // Not a photo, so no text analysis
                continue;
            }
            console.log(`Processing media item: ${name} (${id})`);

            await processMediaItem(id, gmb_id, name);

        } catch (error) {
            console.error(`Error processing ${name} record:`, error);
        }
    }
}

async function handleScheduledCheck(limit, offset) {
    try {
        const mediaData = await knex(DatabaseTableConstants.GMB_MEDIA_TABLE)
            .select('id', 'gmb_id', 'name', 'media_format')
            .whereNull('has_too_much_text')
            .andWhere({ media_format: "PHOTO" })
            .limit(limit)
            .offset(offset);

        console.log(`Found ${mediaData.length} media items to process`);

        if (mediaData.length === 0) return;
        
        for (let i = 0; i < mediaData.length; i += BATCH_SIZE) {
            const batch = mediaData.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(item => processMediaItem(item.id, item.gmb_id, item.name)));

            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(mediaData.length / BATCH_SIZE)}`);
        }
                
    } catch (error) {
        console.error('Error in scheduled check:', error);
        throw error;
    }
}

async function processMediaItem(id, gmbId, name) {
    try {
        console.log(`Processing media item: ${name} (${id})`);

        const s3Key = `${gmbId}/${id}`;
        let imageBuffer;
        let photoContentType;

        try {
            const { buffer, contentType } = await downloadFileFromS3(s3Key);
            imageBuffer = buffer;
            photoContentType = contentType;

            console.log(`Downloaded image from S3 with content type: ${contentType}`);
        } catch (s3Error) {
            console.error(`Failed to download image from S3 for media ${name} (${id}):`, s3Error);
            return;
        }
        const hasTooMuchText = await photoChecker(imageBuffer, photoContentType);

        await updateMediaTextAnalysis(id, hasTooMuchText);

        console.log(`Media ${name} (${id}) analysis complete: hasTooMuchText = ${hasTooMuchText}`);
        
    } catch (error) {
        console.error(`Error processing media item ${name} (${id}):`, error);
        throw error;
    }
}
