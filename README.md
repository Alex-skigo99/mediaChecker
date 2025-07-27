# Media Checker Lambda Function

This AWS Lambda function checks Google My Business (GMB) media images for text content that might violate Google's content policies.

## Features

- **SQS Integration**: Processes individual media items from SQS messages
- **Scheduled Processing**: Batch processes media items on a schedule
- **Text Analysis**: Uses OpenAI Vision API to detect promotional text and banners
- **Database Updates**: Updates the `has_too_much_text` field in the GMB_MEDIA_TABLE

## Usage Scenarios

### 1. SQS Event Processing

When triggered by SQS, the function expects messages with the following format:

```json
{
  "mediaId": "uuid-of-media-item"
}
```

### 2. Scheduled/Direct Invocation

For scheduled processing or direct invocation, you can optionally pass:

```json
{
  "limit": 50,
  "offset": 0
}
```

If not provided, defaults are:
- `limit`: 10 (batch size)
- `offset`: 0

## Database Schema

The function requires a `has_too_much_text` column in the GMB_MEDIA_TABLE:

```sql
ALTER TABLE gmb_media_table ADD COLUMN has_too_much_text BOOLEAN;
ALTER TABLE gmb_media_table ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
```

## Environment Variables

Required environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key for vision analysis

## S3 Structure

Images are expected to be stored in S3 with the key format:
```
{gmb_id}/{media_id}
```

## Analysis Criteria

The function checks for:
1. Promotional banners or text overlays
2. Excessive text that makes images look like advertisements
3. Contact information, URLs, or promotional messages
4. Marketing slogans or promotional text

Images should show actual business content (interior, exterior, products, services) rather than promotional graphics.

## Response Format

### SQS Processing Response
```json
{
  "statusCode": 200,
  "body": {
    "message": "SQS processing completed",
    "results": [...],
    "processedCount": 5
  }
}
```

### Scheduled Processing Response
```json
{
  "statusCode": 200,
  "body": {
    "message": "Scheduled processing completed",
    "results": [...],
    "processedCount": 10,
    "totalFound": 25
  }
}
```

## Error Handling

- Failed S3 downloads are marked as `has_too_much_text: false`
- Processing errors are logged and the item is marked as processed to avoid reprocessing
- Non-image media formats are skipped and marked as `has_too_much_text: false`

## Deployment

1. Install dependencies: `npm install`
2. Package for Lambda deployment
3. Set up appropriate IAM roles for S3, SQS, and RDS access
4. Configure environment variables
5. Set up SQS triggers or CloudWatch Events for scheduling