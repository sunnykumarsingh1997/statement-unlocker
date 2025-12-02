# Bank Statement Unlocker - Backend

FastAPI backend service that unlocks password-protected bank statement PDFs and automatically uploads them to Paperless-ngx.

## Features

- 🔓 Unlocks password-protected PDFs using configurable password list
- 📤 Automatically uploads to Paperless-ngx via API
- 💾 In-memory processing (no disk storage)
- 🐳 Docker support for easy deployment
- 🔒 Secure token-based authentication

## Quick Start

### Local Development

1. **Install dependencies**:
   ```bash
   cd backend-unlocker
   pip install -r requirements.txt
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and add your PAPERLESS_API_TOKEN
   ```

3. **Customize passwords**:
   Edit `passwords.txt` to add bank-specific passwords (one per line)

4. **Run the server**:
   ```bash
   export PAPERLESS_API_TOKEN="your-token-here"
   uvicorn main:app --reload --port 8001
   ```

5. **Test the API**:
   ```bash
   curl http://localhost:8001/health
   ```

### Docker Deployment

```bash
# Build the image
docker build -t bank-statement-unlocker .

# Run the container
docker run -p 8001:8001 \
  -e PAPERLESS_API_TOKEN="your-token-here" \
  bank-statement-unlocker
```

### Google Cloud Run Deployment

```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/bank-statement-unlocker

# Deploy to Cloud Run
gcloud run deploy bank-statement-unlocker \
  --image gcr.io/YOUR_PROJECT_ID/bank-statement-unlocker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars PAPERLESS_API_TOKEN="your-token-here"
```

## API Endpoints

### `POST /unlock`
Upload and unlock a password-protected PDF

**Request**:
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: `file` - PDF file to unlock

**Response**:
```json
{
  "success": true,
  "message": "Success: Uploaded to Paperless as statement.pdf",
  "filename": "statement.pdf",
  "paperless_response": {...}
}
```

### `GET /health`
Health check with configuration status

**Response**:
```json
{
  "status": "healthy",
  "checks": {
    "paperless_token_configured": true,
    "passwords_file_exists": true,
    "passwords_count": 15,
    "paperless_url": "http://84.247.136.87:8000"
  }
}
```

## Configuration

### Environment Variables

- `PAPERLESS_API_TOKEN` (required): API token for Paperless-ngx authentication
- `PORT` (optional): Server port, defaults to 8001

### Password Configuration

Edit `passwords.txt` to customize the password list. Common patterns:
- Date formats: `DDMMYYYY`, `YYYYMMDD`, `DDMMYY`
- PAN number combinations
- Custom bank-specific passwords

## Integration with React Frontend

The backend is configured with CORS to allow requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Create React App)

Update CORS origins in `main.py` if using different ports.

## Security Notes

- API token is stored as environment variable
- Files are processed in-memory only (not saved to disk)
- Non-root user in Docker container
- Consider adding rate limiting for production use

## Troubleshooting

**"PAPERLESS_API_TOKEN environment variable not set"**
- Make sure to export the environment variable before running
- Check that the variable is set correctly in your deployment environment

**"Failed to upload to Paperless"**
- Verify the Paperless-ngx URL is accessible
- Check that your API token has correct permissions
- Ensure Paperless-ngx API endpoint is `/api/documents/post_document/`

**"Password not found"**
- Add more passwords to `passwords.txt`
- Check if PDF uses a different password format
- Verify the PDF is actually password-protected

## Development

Runtests/checks:
```bash
# Check health
curl http://localhost:8001/health

# Test unlock endpoint with curl
curl -X POST http://localhost:8001/unlock \
  -F "file=@/path/to/locked.pdf"
```

## License

Part of the mockupgmailgenerator project.
