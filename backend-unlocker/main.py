"""
Paperless Gateway Middleware - FastAPI Backend
Standalone middleware web application for unlocking password-protected PDFs
and uploading them to Paperless-ngx with intelligent renaming.
"""

import io
import os
import re
from typing import Optional, List, Tuple
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import pikepdf
import pdfplumber
import requests

app = FastAPI(
    title="Paperless Gateway Middleware",
    description="Gateway middleware for unlocking password-protected PDFs and uploading to Paperless-ngx",
    version="2.0.0"
)

# CORS configuration - allow all origins for standalone app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration with defaults
PAPERLESS_URL = os.getenv("PAPERLESS_URL", "http://84.247.136.87:8000")
PAPERLESS_TOKEN = os.getenv("PAPERLESS_TOKEN", "bb02a22ccce82096e308469bde1fd85c8d675a66")
PASSWORDS_FILE = Path(__file__).parent / "passwords.txt"
STATIC_DIR = Path(__file__).parent / "static"

# Mount static files directory
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Pydantic models
class PasswordUpdate(BaseModel):
    passwords: List[str]

# Bank detection patterns
BANK_PATTERNS = {
    'HDFC': ['HDFC Bank', 'hdfc', 'HDFC BANK', 'HDFC BANK LIMITED'],
    'ICICI': ['ICICI Bank', 'icici', 'ICICI BANK', 'ICICI BANK LIMITED'],
    'SBI': ['State Bank of India', 'SBI', 'STATE BANK', 'STATE BANK OF INDIA'],
    'AXIS': ['AXIS Bank', 'axis', 'AXIS BANK', 'AXIS BANK LIMITED'],
    'KOTAK': ['Kotak Mahindra', 'kotak', 'KOTAK', 'KOTAK MAHINDRA BANK'],
    'PNB': ['Punjab National Bank', 'PNB', 'PUNJAB NATIONAL BANK'],
    'BOB': ['Bank of Baroda', 'BOB', 'BANK OF BARODA'],
    'CANARA': ['Canara Bank', 'canara', 'CANARA BANK'],
    'UNION': ['Union Bank', 'union', 'UNION BANK OF INDIA'],
    'IDBI': ['IDBI Bank', 'idbi', 'IDBI BANK'],
    'IDFC': ['IDFC Bank', 'idfc', 'IDFC FIRST BANK'],
    'YES': ['YES Bank', 'yes', 'YES BANK'],
    'RBL': ['RBL Bank', 'rbl', 'RBL BANK'],
    'INDUSIND': ['IndusInd Bank', 'indusind', 'INDUSIND BANK'],
}


def load_passwords() -> List[str]:
    """Load passwords from passwords.txt file"""
    if not PASSWORDS_FILE.exists():
        return []
    
    try:
        with open(PASSWORDS_FILE, "r", encoding="utf-8") as f:
            # Strip whitespace, filter empty lines and comments
            passwords = [line.strip() for line in f if line.strip() and not line.strip().startswith('#')]
        return passwords
    except Exception as e:
        print(f"Error loading passwords: {e}")
        return []


def save_passwords(passwords: List[str]) -> bool:
    """Save passwords to passwords.txt file"""
    try:
        with open(PASSWORDS_FILE, "w", encoding="utf-8") as f:
            f.write("# Bank Statement Password List\n")
            f.write("# Add one password per line\n\n")
            for password in passwords:
                if password.strip():  # Only save non-empty
                    f.write(f"{password.strip()}\n")
        return True
    except Exception as e:
        print(f"Error saving passwords: {e}")
        return False


def try_unlock_pdf(pdf_bytes: bytes, passwords: List[str]) -> Tuple[Optional[bytes], bool]:
    """
    Try to unlock a PDF using a list of passwords.
    Returns (unlocked_pdf_bytes, is_unlocked) tuple.
    If unlocked, returns (bytes, True). If not, returns (original_bytes, False).
    """
    pdf_stream = io.BytesIO(pdf_bytes)
    
    # First, check if PDF is already unlocked
    try:
        with pikepdf.open(pdf_stream) as pdf:
            # PDF is already unlocked, return as-is
            output = io.BytesIO()
            pdf.save(output)
            return output.getvalue(), True
    except pikepdf.PasswordError:
        pass  # PDF is locked, try passwords
    except Exception as e:
        # Invalid PDF, but return original bytes for metadata extraction attempt
        print(f"Warning: PDF validation error: {e}")
        return pdf_bytes, False
    
    # Try each password
    for password in passwords:
        try:
            pdf_stream.seek(0)  # Reset stream position
            with pikepdf.open(pdf_stream, password=password) as pdf:
                # Successfully unlocked! Create decrypted version
                output = io.BytesIO()
                pdf.save(output, encryption=False)  # Save without encryption
                return output.getvalue(), True
        except pikepdf.PasswordError:
            continue  # Wrong password, try next
        except Exception as e:
            # Some other error, log and continue
            print(f"Error trying password: {e}")
            continue
    
    # No password worked, return original bytes
    return pdf_bytes, False


def extract_metadata(pdf_bytes: bytes) -> dict:
    """
    Extract metadata from bank statement PDF
    Returns owner name, bank name, period, and account info
    """
    metadata = {
        'owner_name': 'Unknown',
        'bank_name': 'Unknown',
        'period': datetime.now().strftime('%Y-%m'),
        'account_last4': None
    }
    
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            if len(pdf.pages) == 0:
                return metadata
            
            # Extract text from first page (usually has all metadata)
            first_page_text = pdf.pages[0].extract_text() or ""
            
            if not first_page_text:
                return metadata
            
            # Detect bank name
            for bank_code, patterns in BANK_PATTERNS.items():
                for pattern in patterns:
                    if pattern.lower() in first_page_text.lower():
                        metadata['bank_name'] = bank_code
                        break
                if metadata['bank_name'] != 'Unknown':
                    break
            
            # Extract owner name (improved patterns)
            name_patterns = [
                r'Account\s*(?:Holder|Name)[:\s]+([A-Z][A-Za-z\s]+?)(?:\n|\r|$)',
                r'Name[:\s]+([A-Z][A-Za-z\s]+?)(?:\n|\r|$)',
                r'Customer\s*Name[:\s]+([A-Z][A-Za-z\s]+?)(?:\n|\r|$)',
                r'Mr\.?\s+([A-Z][A-Za-z\s]+?)(?:\n|\r|$)',
                r'Mrs\.?\s+([A-Z][A-Za-z\s]+?)(?:\n|\r|$)',
                r'Ms\.?\s+([A-Z][A-Za-z\s]+?)(?:\n|\r|$)',
                r'Account\s*of[:\s]+([A-Z][A-Za-z\s]+?)(?:\n|\r|$)',
            ]
            
            for pattern in name_patterns:
                match = re.search(pattern, first_page_text, re.MULTILINE | re.IGNORECASE)
                if match:
                    name = match.group(1).strip()
                    # Clean up name (remove extra spaces, titles, account numbers)
                    name = re.sub(r'\s+', ' ', name)
                    name = re.sub(r'\b(?:Account|No|Number|A/c)\b', '', name, flags=re.IGNORECASE)
                    name = name.strip()
                    if len(name) > 3 and len(name) < 50:  # Reasonable name length
                        metadata['owner_name'] = name.title()
                        break
            
            # Extract statement period (improved patterns)
            period_patterns = [
                r'Statement\s*Period[:\s]+\d{1,2}[/-]\d{1,2}[/-](\d{4})\s*to\s*\d{1,2}[/-](\d{1,2})[/-](\d{4})',
                r'For\s*the\s*period[:\s]+\d{1,2}[/-]\d{1,2}[/-](\d{4})\s*to\s*\d{1,2}[/-](\d{1,2})[/-](\d{4})',
                r'Period[:\s]+\d{1,2}[/-]\d{1,2}[/-](\d{4})\s*to\s*\d{1,2}[/-](\d{1,2})[/-](\d{4})',
                r'(January|February|March|April|May|June|July|August|September|October|November|December)[\s,]+(\d{4})',
                r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})\s*to\s*\d{1,2}[/-](\d{1,2})[/-](\d{4})',  # Extract end date
            ]
            
            for pattern in period_patterns:
                match = re.search(pattern, first_page_text, re.IGNORECASE)
                if match:
                    if len(match.groups()) >= 3:  # Date range format
                        year = match.group(3)
                        month = match.group(2).zfill(2)
                        metadata['period'] = f"{year}-{month}"
                        break
                    elif len(match.groups()) == 2:  # Month Year format
                        try:
                            month_name = match.group(1)
                            year = match.group(2)
                            month_num = datetime.strptime(month_name, '%B').month
                            metadata['period'] = f"{year}-{str(month_num).zfill(2)}"
                            break
                        except ValueError:
                            continue
            
            # Extract account number (last 4 digits)
            account_patterns = [
                r'Account\s*(?:Number|No\.?)[:\s]+\**\d*?(\d{4})',
                r'A/c[:\s]+\**\d*?(\d{4})',
                r'xxxx\s*(\d{4})',
                r'\*\*\*\*\s*(\d{4})',
            ]
            
            for pattern in account_patterns:
                match = re.search(pattern, first_page_text, re.IGNORECASE)
                if match:
                    metadata['account_last4'] = match.group(1)
                    break
    
    except Exception as e:
        print(f"Error extracting metadata: {e}")
        # Return default metadata on error
    
    return metadata


def sanitize_filename(name: str) -> str:
    """Sanitize a string to be used in a filename"""
    # Remove special characters, replace spaces with underscores
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '_', name)
    return name.strip('_')


def generate_filename(metadata: dict, original_filename: str) -> str:
    """
    Generate intelligent filename from metadata
    Format: {Owner}_{Bank}_{Month-Year}.pdf
    """
    owner = metadata.get('owner_name', 'Unknown')
    bank = metadata.get('bank_name', 'Unknown')
    period = metadata.get('period', datetime.now().strftime('%Y-%m'))
    
    # Sanitize components
    owner_clean = sanitize_filename(owner)
    bank_clean = sanitize_filename(bank)
    
    # If we couldn't extract meaningful data, use original filename
    if owner_clean == 'Unknown' and bank_clean == 'Unknown':
        # Try to preserve original filename but ensure .pdf extension
        base_name = Path(original_filename).stem
        return f"{sanitize_filename(base_name)}.pdf"
    
    filename = f"{owner_clean}_{bank_clean}_{period}.pdf"
    return filename


def upload_to_paperless(pdf_bytes: bytes, filename: str, title: Optional[str] = None):
    """
    Upload unlocked PDF to Paperless-ngx via API
    Returns the API response
    """
    endpoint = f"{PAPERLESS_URL}/api/documents/post_document/"
    headers = {
        "Authorization": f"Token {PAPERLESS_TOKEN}"
    }
    
    # Prepare file for upload
    files = {
        "document": (filename, io.BytesIO(pdf_bytes), "application/pdf")
    }
    
    # Add title if provided and API supports it
    data = {}
    if title:
        data["title"] = title
    
    try:
        response = requests.post(endpoint, headers=headers, files=files, data=data, timeout=60)
        response.raise_for_status()
        
        # Try to parse as JSON, but handle cases where response might be plain text
        try:
            json_response = response.json()
            # Ensure we always return a dict, even if JSON parsed to a string
            if isinstance(json_response, dict):
                return json_response
            else:
                return {"response": json_response, "status_code": response.status_code}
        except (ValueError, requests.exceptions.JSONDecodeError):
            # If response is not JSON, return the text content
            return {"response": response.text, "status_code": response.status_code}
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json()
                error_msg = f"{error_msg}: {error_detail}"
            except:
                error_msg = f"{error_msg}: {e.response.text}"
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload to Paperless: {error_msg}"
        )


# ========== Frontend Serving ==========

@app.get("/")
async def serve_frontend():
    """Serve the main HTML frontend"""
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"message": "Frontend not found. Please ensure static/index.html exists."}


# ========== API Endpoints ==========

@app.get("/health")
def health_check():
    """Health check endpoint"""
    passwords = load_passwords()
    
    return {
        "status": "healthy",
        "service": "Paperless Gateway Middleware",
        "checks": {
            "paperless_token_configured": bool(PAPERLESS_TOKEN),
            "paperless_url": PAPERLESS_URL,
            "passwords_file_exists": PASSWORDS_FILE.exists(),
            "passwords_count": len(passwords),
        }
    }


@app.get("/api/passwords")
def get_passwords():
    """Get all passwords from passwords.txt"""
    passwords = load_passwords()
    return {
        "passwords": passwords,
        "count": len(passwords)
    }


@app.put("/api/passwords")
def update_passwords(password_update: PasswordUpdate):
    """Update all passwords in passwords.txt"""
    if save_passwords(password_update.passwords):
        return {
            "success": True,
            "message": "Passwords updated successfully",
            "passwords": password_update.passwords,
            "count": len(password_update.passwords)
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to save passwords")


@app.post("/api/upload")
async def bulk_upload(files: List[UploadFile] = File(...)):
    """
    Bulk upload endpoint: Process multiple PDF files
    Unlocks, analyzes, renames, and uploads to Paperless-ngx
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    # Load passwords
    passwords = load_passwords()
    
    results = []
    
    # Process each file sequentially
    for file in files:
        result = {
            "filename": file.filename,
            "success": False,
            "message": "",
            "unlocked": False,
            "renamed_filename": None,
            "metadata": None,
            "error": None
        }
        
        try:
            # Validate file type
            if not file.filename or not file.filename.lower().endswith('.pdf'):
                result["message"] = "Only PDF files are supported"
                result["error"] = "Invalid file type"
                results.append(result)
                continue
            
            # Read file into memory
            try:
                pdf_bytes = await file.read()
            except Exception as e:
                result["message"] = f"Failed to read file: {str(e)}"
                result["error"] = str(e)
                results.append(result)
                continue
            
            if len(pdf_bytes) == 0:
                result["message"] = "Empty file uploaded"
                result["error"] = "Empty file"
                results.append(result)
                continue
            
            # Try to unlock PDF
            unlocked_pdf, is_unlocked = try_unlock_pdf(pdf_bytes, passwords)
            result["unlocked"] = is_unlocked
            
            if not is_unlocked:
                result["message"] = "PDF could not be unlocked with available passwords"
            
            # Extract metadata (even if unlock failed, try to extract from locked PDF)
            try:
                metadata = extract_metadata(unlocked_pdf)
                result["metadata"] = metadata
            except Exception as e:
                print(f"Error extracting metadata from {file.filename}: {e}")
                metadata = {
                    'owner_name': 'Unknown',
                    'bank_name': 'Unknown',
                    'period': datetime.now().strftime('%Y-%m')
                }
                result["metadata"] = metadata
            
            # Generate intelligent filename
            intelligent_filename = generate_filename(metadata, file.filename)
            result["renamed_filename"] = intelligent_filename
            
            # Upload to Paperless
            try:
                paperless_response = upload_to_paperless(
                    unlocked_pdf,
                    intelligent_filename,
                    title=intelligent_filename
                )
                result["success"] = True
                result["message"] = f"Successfully uploaded to Paperless as {intelligent_filename}"
                # Safely extract ID if response is a dict, otherwise use the response text
                if isinstance(paperless_response, dict):
                    result["paperless_id"] = paperless_response.get("id")
                    result["paperless_response"] = paperless_response
                else:
                    result["paperless_response"] = str(paperless_response)
            except HTTPException as e:
                result["message"] = f"Upload failed: {e.detail}"
                result["error"] = e.detail
            except Exception as e:
                result["message"] = f"Upload failed: {str(e)}"
                result["error"] = str(e)
        
        except Exception as e:
            result["message"] = f"Unexpected error: {str(e)}"
            result["error"] = str(e)
        
        results.append(result)
    
    return {
        "success": True,
        "processed": len(results),
        "results": results
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
