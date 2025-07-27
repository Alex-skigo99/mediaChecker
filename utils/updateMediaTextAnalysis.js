import knex from "/opt/nodejs/db.js";
import DatabaseTableConstants from "/opt/nodejs/DatabaseTableConstants.js";

export async function updateMediaTextAnalysis(id, hasTooMuchText) {
    try {
        await knex(DatabaseTableConstants.GMB_MEDIA_TABLE)
            .where("id", id)
            .update({
                has_too_much_text: hasTooMuchText,
            });

    } catch (error) {
        throw error;
    }
}
