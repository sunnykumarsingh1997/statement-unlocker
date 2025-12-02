"""
Bank Statement Unlocker - FastAPI Backend
Unlocks password-protected PDFs and uploads them to Paperless-ngx
"""

import io
import os
import re
from typing import Optional
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import pikepdf
import pdfplumber
import requests

app = FastAPI(
    title="Bank Statement Unlocker",
    description="Unlock password-protected PDF files and upload to Paperless-ngx",
    version="1.0.0"
)

# CORS configuration for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite and CRA defaults
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
PAPERLESS_URL = "http://84.247.136.87:8000"
PAPERLESS_TOKEN = os.getenv("PAPERLESS_API_TOKEN")
PASSWORDS_FILE = Path(__file__).parent / "passwords.txt"

# Pydantic models
class Password(BaseModel):
    password: str

class PasswordUpdate(BaseModel):
    passwords: list[str]

# Bank detection patterns
BANK_PATTERNS = {
    'HDFC': ['HDFC Bank', 'hdfc', 'HDFC BANK'],
    'ICICI': ['ICICI Bank', 'icici', 'ICICI BANK'],
    'SBI': ['State Bank of India', 'SBI', 'STATE BANK'],
    'AXIS': ['AXIS Bank', 'axis', 'AXIS BANK'],
    'KOTAK': ['Kotak Mahindra', 'kotak', 'KOTAK'],
    'PNB': ['Punjab National Bank', 'PNB'],
    'BOB': ['Bank of Baroda', 'BOB'],
    'CANARA': ['Canara Bank', 'canara'],
    'UNION': ['Union Bank', 'union'],
    'IDBI': ['IDBI Bank', 'idbi'],
}


def load_passwords() -> list[str]:
    """Load passwords from passwords.txt file"""
    if not PASSWORDS_FILE.exists():
        return []
    
    with open(PASSWORDS_FILE, "r", encoding="utf-8") as f:
        # Strip whitespace, filter empty lines and comments
        passwords = [line.strip() for line in f if line.strip() and not line.strip().startswith('#')]
    
    return passwords


def save_passwords(passwords: list[str]) -> bool:
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


def try_unlock_pdf(pdf_bytes: bytes, passwords: list[str]) -> Optional[bytes]:
    """
    Try to unlock a PDF using a list of passwords.
    Returns the unlocked PDF bytes if successful, None otherwise.
    """
    pdf_stream = io.BytesIO(pdf_bytes)
    
    # First, check if PDF is already unlocked
    try:
        with pikepdf.open(pdf_stream) as pdf:
            # PDF is already unlocked, return as-is
            output = io.BytesIO()
            pdf.save(output)
            return output.getvalue()
    except pikepdf.PasswordError:
        pass  # PDF is locked, try passwords
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid PDF file: {str(e)}")
    
    # Try each password
    for password in passwords:
        try:
            pdf_stream.seek(0)  # Reset stream position
            with pikepdf.open(pdf_stream, password=password) as pdf:
                # Successfully unlocked! Create decrypted version
                output = io.BytesIO()
                pdf.save(output, encryption=False)  # Save without encryption
                return output.getvalue()
        except pikepdf.PasswordError:
            continue  # Wrong password, try next
        except Exception as e:
            # Some other error, log and continue
            print(f"Error trying password: {e}")
            continue
    
    # No password worked
    return None


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
            
            # Detect bank name
            for bank_code, patterns in BANK_PATTERNS.items():
                for pattern in patterns:
                    if pattern.lower() in first_page_text.lower():
                        metadata['bank_name'] = bank_code
                        break
                if metadata['bank_name'] != 'Unknown':
                    break
            
            # Extract owner name (usually after "Account Holder" or similar)
            name_patterns = [
                r'Account\s*Holder[:\s]+([A-Z][A-Z\s]+?)(?:\n|\r)',
                r'Name[:\s]+([A-Z][A-Z\s]+?)(?:\n|\r)',
                r'Customer\s*Name[:\s]+([A-Z][A-Z\s]+?)(?:\n|\r)',
                r'^([A-Z][A-Z\s]{10,40})(?:\n|\r)',  # Fallback: capitalized name at start
            ]
            
            for pattern in name_patterns:
                match = re.search(pattern, first_page_text, re.MULTILINE | re.IGNORECASE)
                if match:
                    name = match.group(1).strip()
                    # Clean up name (remove extra spaces, titles)
                    name = re.sub(r'\s+', ' ', name)
                    if len(name) > 5 and len(name) < 50:  # Reasonable name length
                        metadata['owner_name'] = name.title()
                        break
            
            # Extract statement period
            period_patterns = [
                r'Statement\s*Period[:\s]+\d{1,2}[/-]\d{1,2}[/-](\d{4})\s*to\s*\d{1,2}[/-](\d{1,2})[/-](\d{4})',
                r'For\s*the\s*period[:\s]+\d{1,2}[/-]\d{1,2}[/-](\d{4})\s*to\s*\d{1,2}[/-](\d{1,2})[/-](\d{4})',
                r'(January|February|March|April|May|June|July|August|September|October|November|December)[\s,]+(\d{4})',
            ]
            
            for pattern in period_patterns:
                match = re.search(pattern, first_page_text, re.IGNORECASE)
                if match:
                    if len(match.groups()) >= 3:  # Date range format
                        year = match.group(3)
                        month = match.group(2).zfill(2)
                        metadata['period'] = f"{year}-{month}"
                    elif len(match.groups()) == 2:  # Month Year format
                        month_name = match.group(1)
                        year = match.group(2)
                        month_num = datetime.strptime(month_name, '%B').month
                        metadata['period'] = f"{year}-{str(month_num).zfill(2)}"
                    break
            
            # Extract account number (last 4 digits)
            account_patterns = [
                r'Account\s*(?:Number|No\.?)[:\s]+\**\d*?(\d{4})',
                r'A/c[:\s]+\**\d*?(\d{4})',
                r'xxxx\s*(\d{4})',
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


def generate_filename(metadata: dict, original_filename: str) -> str:
    """
    Generate intelligent filename from metadata
    Format: BankName_OwnerName_Period.pdf
    """
    bank = metadata.get('bank_name', 'Unknown').replace(' ', '')
    owner = metadata.get('owner_name', 'Unknown').replace(' ', '')
    period = metadata.get('period', datetime.now().strftime('%Y-%m'))
    
    # If we couldn't extract meaningful data, use original filename
    if bank == 'Unknown' and owner == 'Unknown':
        return original_filename
    
    filename = f"{bank}_{owner}_{period}.pdf"
    return filename


def upload_to_paperless(pdf_bytes: bytes, filename: str) -> dict:
    """
    Upload unlocked PDF to Paperless-ngx via API
    Returns the API response
    """
    if not PAPERLESS_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="PAPERLESS_API_TOKEN environment variable not set"
        )
    
    endpoint = f"{PAPERLESS_URL}/api/documents/post_document/"
    headers = {
        "Authorization": f"Token {PAPERLESS_TOKEN}"
    }
    
    # Prepare file for upload
    files = {
        "document": (filename, io.BytesIO(pdf_bytes), "application/pdf")
    }
    
    try:
        response = requests.post(endpoint, headers=headers, files=files, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload to Paperless: {str(e)}"
        )


@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Bank Statement Unlocker",
        "paperless_configured": bool(PAPERLESS_TOKEN),
        "passwords_loaded": len(load_passwords())
    }


# ========== Password Management Endpoints ==========

@app.get("/passwords")
def get_passwords():
    """Get all passwords"""
    passwords = load_passwords()
    return {"passwords": passwords, "count": len(passwords)}


@app.post("/passwords")
def add_password(password_data: Password):
    """Add a new password"""
    passwords = load_passwords()
    
    # Check for duplicates
    if password_data.password in passwords:
        raise HTTPException(status_code=400, detail="Password already exists")
    
    passwords.append(password_data.password)
    
    if save_passwords(passwords):
        return {"success": True, "message": "Password added", "passwords": passwords}
    else:
        raise HTTPException(status_code=500, detail="Failed to save password")


@app.put("/passwords/{index}")
def update_password(index: int, password_data: Password):
    """Update password at specific index"""
    passwords = load_passwords()
    
    if index < 0 or index >= len(passwords):
        raise HTTPException(status_code=404, detail="Password index not found")
    
    passwords[index] = password_data.password
    
    if save_passwords(passwords):
        return {"success": True, "message": "Password updated", "passwords": passwords}
    else:
        raise HTTPException(status_code=500, detail="Failed to save password")


@app.delete("/passwords/{index}")
def delete_password(index: int):
    """Delete password at specific index"""
    passwords = load_passwords()
    
    if index < 0 or index >= len(passwords):
        raise HTTPException(status_code=404, detail="Password index not found")
    
    deleted = passwords.pop(index)
    
    if save_passwords(passwords):
        return {"success": True, "message": f"Password '{deleted}' deleted", "passwords": passwords}
    else:
        raise HTTPException(status_code=500, detail="Failed to save passwords")


@app.put("/passwords")
def update_all_passwords(password_update: PasswordUpdate):
    """Update all passwords at once"""
    if save_passwords(password_update.passwords):
        return {
            "success": True,
            "message": "All passwords updated",
            "passwords": password_update.passwords,
            "count": len(password_update.passwords)
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to save passwords")


# ========== PDF Unlock & Upload Endpoint ==========

@app.post("/unlock")
def unlock_and_upload(file: UploadFile = File(...)):
    """
    Main endpoint: Unlock PDF and upload to Paperless-ngx
    """
    # Validate file type
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Read file into memory
    try:
        pdf_bytes = file.file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
    
    if len(pdf_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file uploaded")
    
    # Load passwords
    passwords = load_passwords()
    
    # Try to unlock
    unlocked_pdf = try_unlock_pdf(pdf_bytes, passwords)
    
    if unlocked_pdf is None:
        return JSONResponse(
            status_code=200,
            content={
                "success": False,
                "message": "Failed: Password not found in password list",
                "filename": file.filename,
                "passwords_tried": len(passwords)
            }
        )
    
    # Extract metadata from unlocked PDF
    metadata = extract_metadata(unlocked_pdf)
    
    # Generate intelligent filename
    intelligent_filename = generate_filename(metadata, file.filename)
    
    # Upload to Paperless with intelligent filename
    try:
        paperless_response = upload_to_paperless(unlocked_pdf, intelligent_filename)
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": f"Success: Uploaded to Paperless as {intelligent_filename}",
                "filename": intelligent_filename,
                "original_filename": file.filename,
                "metadata": metadata,
                "paperless_response": paperless_response
            }
        )
    except HTTPException as e:
        return JSONResponse(
            status_code=200,
            content={
                "success": False,
                "message": f"PDF unlocked but upload failed: {e.detail}",
                "filename": file.filename,
                "metadata": metadata
            }
        )


@app.get("/health")
def health_check():
    """Detailed health check"""
    passwords = load_passwords()
    
    return {
        "status": "healthy",
        "checks": {
            "paperless_token_configured": bool(PAPERLESS_TOKEN),
            "passwords_file_exists": PASSWORDS_FILE.exists(),
            "passwords_count": len(passwords),
            "paperless_url": PAPERLESS_URL
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
