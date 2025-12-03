# Paperless Gateway Middleware

A standalone middleware web application that serves as a gateway to Paperless-ngx. This application accepts multiple password-protected PDF bank statements, unlocks them, intelligently renames them based on extracted metadata, and automatically uploads them to your Paperless-ngx instance.

## Features

- 🔓 **Bulk PDF Unlocking**: Process multiple password-protected PDFs at once
- 🧠 **Intelligent Renaming**: Automatically extracts bank name, owner name, and statement period to generate meaningful filenames
- 📤 **Direct Upload**: Seamlessly uploads unlocked PDFs to Paperless-ngx
- 🔑 **Password Management**: Web-based interface to manage your password list
- 🎨 **Modern UI**: Clean, responsive drag-and-drop interface
- 🐳 **Docker Ready**: Production-ready Dockerfile included
- ⚡ **In-Memory Processing**: All processing happens in memory - no temporary files

## Architecture

- **Backend**: FastAPI (Python) with pikepdf for decryption and pdfplumber for text extraction
- **Frontend**: Vanilla HTML/CSS/JavaScript with drag-and-drop file upload
- **Integration**: Direct API integration with Paperless-ngx

## Quick Start

### Prerequisites

- Python 3.11+ (for local development)
- Docker (for containerized deployment)
- Access to a Paperless-ngx instance

### Local Development

1. **Clone and navigate to the directory**:
   ```bash
   cd backend-unlocker
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables** (optional - defaults are provided):
   ```bash
   export PAPERLESS_URL="http://84.247.136.87:8000"
   export PAPERLESS_TOKEN="bb02a22ccce82096e308469bde1fd85c8d675a66"
   ```

4. **Set up passwords**:
   Edit `passwords.txt` and add your bank statement passwords (one per line)

5. **Run the server**:
   ```bash
   python main.py
   # Or with uvicorn directly:
   uvicorn main:app --reload --port 8001
   ```

6. **Access the application**:
   Open your browser and navigate to `http://localhost:8001`

### Docker Deployment

1. **Build the Docker image**:
   ```bash
   docker build -t paperless-gateway .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     -p 8001:8001 \
     -e PAPERLESS_URL="http://84.247.136.87:8000" \
     -e PAPERLESS_TOKEN="bb02a22ccce82096e308469bde1fd85c8d675a66" \
     -v $(pwd)/passwords.txt:/app/passwords.txt \
     --name paperless-gateway \
     paperless-gateway
   ```

3. **Access the application**:
   Open your browser and navigate to `http://localhost:8001`

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PAPERLESS_URL` | `http://84.247.136.87:8000` | URL of your Paperless-ngx instance |
| `PAPERLESS_TOKEN` | `bb02a22ccce82096e308469bde1fd85c8d675a66` | API token for Paperless-ngx authentication |
| `PORT` | `8001` | Port on which the application runs |

### Password Management

Passwords are stored in `passwords.txt` (one password per line). You can:
- Edit the file directly
- Use the web interface to load, edit, and save passwords
- Comments (lines starting with `#`) are ignored

## How It Works

### Processing Flow

For each uploaded PDF file:

1. **Unlock**: The application iterates through your password list to unlock the PDF in memory using `pikepdf`
2. **Analyze**: Extracts text from the first page using `pdfplumber` and parses for:
   - **Bank Name**: Detects common bank keywords (HDFC, ICICI, SBI, AXIS, etc.)
   - **Owner Name**: Looks for patterns like "Account Name:", "Account Holder:", "Mr/Mrs", etc.
   - **Statement Period**: Extracts dates and converts to Month-Year format
3. **Rename**: Generates filename in format: `{Owner}_{Bank}_{Month-Year}.pdf`
   - Example: `JohnDoe_HDFC_2024-03.pdf`
   - Falls back to original filename if extraction fails
4. **Upload**: POSTs the unlocked PDF to Paperless-ngx API with the generated filename

### Filename Format

The application generates filenames using the pattern:
```
{Owner}_{Bank}_{Month-Year}.pdf
```

Where:
- **Owner**: Extracted account holder name (sanitized)
- **Bank**: Detected bank code (HDFC, ICICI, etc.)
- **Month-Year**: Statement period in YYYY-MM format

If metadata extraction fails, the original filename is preserved.

## API Endpoints

### Frontend
- `GET /` - Serves the main HTML interface

### API
- `GET /health` - Health check endpoint
- `GET /api/passwords` - Retrieve current password list
- `PUT /api/passwords` - Update password list
- `POST /api/upload` - Bulk upload endpoint (accepts multiple PDF files)

### Example API Usage

**Upload files**:
```bash
curl -X POST http://localhost:8001/api/upload \
  -F "files=@statement1.pdf" \
  -F "files=@statement2.pdf"
```

**Get passwords**:
```bash
curl http://localhost:8001/api/passwords
```

**Update passwords**:
```bash
curl -X PUT http://localhost:8001/api/passwords \
  -H "Content-Type: application/json" \
  -d '{"passwords": ["password1", "password2"]}'
```

## Paperless-ngx Integration

The application integrates with Paperless-ngx using the standard API:

- **Endpoint**: `{PAPERLESS_URL}/api/documents/post_document/`
- **Method**: POST (multipart/form-data)
- **Field**: `document` (the PDF file)
- **Authentication**: Token-based via `Authorization: Token {PAPERLESS_TOKEN}` header
- **Metadata**: Filename is passed as the document title

## Error Handling

The application handles errors gracefully:

- **Unlock Failure**: If a PDF cannot be unlocked, the application still attempts to extract metadata and upload with intelligent renaming
- **Extraction Failure**: Falls back to original filename if metadata extraction fails
- **Upload Failure**: Returns detailed error messages for troubleshooting
- **Bulk Processing**: Continues processing other files if one fails

## Supported Banks

The application includes detection patterns for:
- HDFC Bank
- ICICI Bank
- State Bank of India (SBI)
- AXIS Bank
- Kotak Mahindra Bank
- Punjab National Bank (PNB)
- Bank of Baroda (BOB)
- Canara Bank
- Union Bank of India
- IDBI Bank
- IDFC First Bank
- YES Bank
- RBL Bank
- IndusInd Bank

Additional banks can be added by updating the `BANK_PATTERNS` dictionary in `main.py`.

## Troubleshooting

### "Failed to upload to Paperless"
- Verify your `PAPERLESS_URL` is correct and accessible
- Check that your `PAPERLESS_TOKEN` is valid and has proper permissions
- Ensure Paperless-ngx API endpoint is `/api/documents/post_document/`

### "PDF could not be unlocked"
- Add more passwords to `passwords.txt`
- Verify the PDF is actually password-protected
- Check if the PDF uses a different password format

### "Metadata extraction failed"
- The application will fall back to the original filename
- Some PDFs may have non-standard formats
- Check if the PDF is image-based (OCR may be needed)

### Frontend not loading
- Ensure the `static/` directory exists with `index.html`, `style.css`, and `app.js`
- Check browser console for JavaScript errors
- Verify the server is running on the correct port

## Security Considerations

- **Environment Variables**: Store sensitive tokens in environment variables, not in code
- **Password Storage**: `passwords.txt` contains sensitive data - ensure proper file permissions
- **Network**: Consider using HTTPS in production
- **Rate Limiting**: Add rate limiting for production deployments
- **Input Validation**: All file uploads are validated for PDF format

## Development

### Project Structure
```
backend-unlocker/
├── main.py              # FastAPI backend
├── requirements.txt     # Python dependencies
├── Dockerfile          # Docker configuration
├── passwords.txt       # Password list (user-editable)
├── README.md           # This file
└── static/             # Frontend files
    ├── index.html      # Main UI
    ├── style.css       # Styling
    └── app.js          # Frontend logic
```

### Adding New Bank Patterns

Edit `BANK_PATTERNS` in `main.py`:
```python
BANK_PATTERNS = {
    'NEW_BANK': ['New Bank', 'newbank', 'NEW BANK LIMITED'],
    # ... existing patterns
}
```

### Testing

Test the application with:
- Locked and unlocked PDFs
- Various bank statement formats
- Bulk uploads (5-10 files)
- Password management
- Error scenarios (invalid PDFs, network failures)

## License

Part of the mstools project.

## Support

For issues and questions, please check:
- Application logs for detailed error messages
- Paperless-ngx API documentation
- Browser console for frontend errors
