import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: "us-east-2" });
const s3BucketName = "renew-local-gmb-location-media";

export async function downloadFileFromS3(s3Key) {
    try {
        const command = new GetObjectCommand({
            Bucket: s3BucketName,
            Key: s3Key,
        });
        
        const response = await s3Client.send(command);
        
        const chunks = [];
        for await (const chunk of response.Body) {
            chunks.push(chunk);
        }
        
        return Buffer.concat(chunks);
    } catch (error) {
        throw new Error(`Failed to download file from S3: ${error.message}`);
    }
}
