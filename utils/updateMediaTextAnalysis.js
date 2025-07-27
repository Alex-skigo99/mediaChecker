import knex from "/opt/nodejs/db";
import DatabaseTableConstants from "/opt/nodejs/DatabaseTableConstants";

export async function updateMediaTextAnalysis(mediaId, hasTooMuchText) {
    try {
        await knex(DatabaseTableConstants.GMB_MEDIA_TABLE)
            .where('id', mediaId)
            .update({
                has_too_much_text: hasTooMuchText,
                updated_at: knex.fn.now()
            });
        
        console.log(`Updated media ${mediaId} with has_too_much_text = ${hasTooMuchText}`);
    } catch (error) {
        console.error(`Error updating media ${mediaId}:`, error);
        throw error;
    }
}
