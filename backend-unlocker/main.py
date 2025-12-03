"""
Paperless Gateway Middleware - FastAPI Backend
Standalone middleware web application for unlocking password-protected PDFs
and uploading them to Paperless-ngx with intelligent renaming and client management.
"""

import io
import os
import re
import json
import uuid
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
    version="3.0.0"
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
CLIENTS_FILE = Path(__file__).parent / "clients.json"
STATIC_DIR = Path(__file__).parent / "static"

# Mount static files directory
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Pydantic models
class PasswordUpdate(BaseModel):
    passwords: List[str]

class Client(BaseModel):
    id: Optional[str] = None
    name: str
    match_pattern: str  # Account number or other identifier
    color: str = "#3b82f6"  # Default blue color
    tag_id: Optional[int] = None  # Paperless tag ID after sync
    correspondent_id: Optional[int] = None  # Paperless correspondent ID after sync

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    match_pattern: Optional[str] = None
    color: Optional[str] = None


# ========== Client Management Functions ==========

def load_clients() -> List[dict]:
    """Load clients from clients.json file"""
    if not CLIENTS_FILE.exists():
        return []
    
    try:
        with open(CLIENTS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("clients", [])
    except Exception as e:
        print(f"Error loading clients: {e}")
        return []


def save_clients(clients: List[dict]) -> bool:
    """Save clients to clients.json file"""
    try:
        with open(CLIENTS_FILE, "w", encoding="utf-8") as f:
            json.dump({"clients": clients}, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving clients: {e}")
        return False


def find_client_by_pattern(text: str, clients: List[dict]) -> Optional[dict]:
    """Find a client whose match_pattern exists in the given text"""
    for client in clients:
        pattern = client.get("match_pattern", "")
        if pattern and pattern in text:
            print(f"[DEBUG] Client matched: {client['name']} (pattern: '{pattern}')")
            return client
    return None


# ========== Paperless API Functions ==========

def get_paperless_headers():
    """Get authorization headers for Paperless API"""
    return {"Authorization": f"Token {PAPERLESS_TOKEN}"}


def get_or_create_tag(tag_name: str, color: str = "#3b82f6", match_pattern: str = "") -> Optional[int]:
    """
    Get existing tag or create new one in Paperless.
    Returns the tag ID.
    """
    headers = get_paperless_headers()
    
    # First, search for existing tag
    try:
        response = requests.get(
            f"{PAPERLESS_URL}/api/tags/",
            headers=headers,
            params={"name__iexact": tag_name},
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        results = data.get("results", [])
        for tag in results:
            if tag.get("name", "").lower() == tag_name.lower():
                print(f"[DEBUG] Found existing tag: {tag_name} (ID: {tag['id']})")
                return tag["id"]
    except Exception as e:
        print(f"Error searching for tag: {e}")
    
    # Tag doesn't exist, create it
    try:
        # Convert hex color to Paperless color format (remove #)
        paperless_color = color.lstrip("#")
        
        tag_data = {
            "name": tag_name,
            "color": paperless_color,
            "is_inbox_tag": False
        }
        
        # Add match pattern if provided
        if match_pattern:
            tag_data["match"] = match_pattern
            tag_data["matching_algorithm"] = 1  # Any word
        
        response = requests.post(
            f"{PAPERLESS_URL}/api/tags/",
            headers=headers,
            json=tag_data,
            timeout=30
        )
        response.raise_for_status()
        new_tag = response.json()
        print(f"[DEBUG] Created new tag: {tag_name} (ID: {new_tag['id']})")
        return new_tag["id"]
    except Exception as e:
        print(f"Error creating tag: {e}")
        return None


def get_or_create_correspondent(name: str = "Bank") -> Optional[int]:
    """
    Get existing correspondent or create new one in Paperless.
    Returns the correspondent ID.
    """
    headers = get_paperless_headers()
    
    # First, search for existing correspondent
    try:
        response = requests.get(
            f"{PAPERLESS_URL}/api/correspondents/",
            headers=headers,
            params={"name__iexact": name},
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        results = data.get("results", [])
        for corr in results:
            if corr.get("name", "").lower() == name.lower():
                print(f"[DEBUG] Found existing correspondent: {name} (ID: {corr['id']})")
                return corr["id"]
    except Exception as e:
        print(f"Error searching for correspondent: {e}")
    
    # Correspondent doesn't exist, create it
    try:
        response = requests.post(
            f"{PAPERLESS_URL}/api/correspondents/",
            headers=headers,
            json={"name": name},
            timeout=30
        )
        response.raise_for_status()
        new_corr = response.json()
        print(f"[DEBUG] Created new correspondent: {name} (ID: {new_corr['id']})")
        return new_corr["id"]
    except Exception as e:
        print(f"Error creating correspondent: {e}")
        return None


# ========== Password Management Functions ==========

def load_passwords() -> List[str]:
    """Load passwords from passwords.txt file"""
    if not PASSWORDS_FILE.exists():
        return []
    
    try:
        with open(PASSWORDS_FILE, "r", encoding="utf-8") as f:
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
                if password.strip():
                    f.write(f"{password.strip()}\n")
        return True
    except Exception as e:
        print(f"Error saving passwords: {e}")
        return False


# ========== PDF Processing Functions ==========

def try_unlock_pdf(pdf_bytes: bytes, passwords: List[str]) -> Tuple[Optional[bytes], bool]:
    """
    Try to unlock a PDF using a list of passwords.
    Returns (unlocked_pdf_bytes, is_unlocked) tuple.
    """
    pdf_stream = io.BytesIO(pdf_bytes)
    
    # First, check if PDF is already unlocked
    try:
        with pikepdf.open(pdf_stream) as pdf:
            output = io.BytesIO()
            pdf.save(output)
            return output.getvalue(), True
    except pikepdf.PasswordError:
        pass
    except Exception as e:
        print(f"Warning: PDF validation error: {e}")
        return pdf_bytes, False
    
    # Try each password
    for password in passwords:
        try:
            pdf_stream.seek(0)
            with pikepdf.open(pdf_stream, password=password) as pdf:
                output = io.BytesIO()
                pdf.save(output, encryption=False)
                return output.getvalue(), True
        except pikepdf.PasswordError:
            continue
        except Exception as e:
            print(f"Error trying password: {e}")
            continue
    
    return pdf_bytes, False


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract all text from PDF for pattern matching"""
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            all_text = ""
            for page in pdf.pages[:3]:  # Check first 3 pages
                page_text = page.extract_text() or ""
                all_text += page_text + "\n"
            return all_text
    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""


def extract_metadata(pdf_bytes: bytes, clients: List[dict]) -> dict:
    """
    Extract metadata from bank statement PDF.
    Uses clients.json for owner detection, falls back to regex patterns.
    Returns owner name and period only.
    """
    metadata = {
        'owner_name': 'Unknown',
        'period': datetime.now().strftime('%Y-%m'),
        'matched_client': None,
        'raw_text_preview': ''
    }
    
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            if len(pdf.pages) == 0:
                return metadata
            
            # Extract text from first pages
            all_text = ""
            for page in pdf.pages[:3]:
                page_text = page.extract_text() or ""
                all_text += page_text + "\n"
            
            if not all_text:
                return metadata
            
            metadata['raw_text_preview'] = all_text[:500]
            
            # ========== CLIENT-BASED OWNER DETECTION ==========
            # Check if any client's match_pattern exists in the PDF
            matched_client = find_client_by_pattern(all_text, clients)
            if matched_client:
                metadata['owner_name'] = matched_client['name']
                metadata['matched_client'] = matched_client
                print(f"[DEBUG] Owner from client match: {matched_client['name']}")
            else:
                # Fallback to regex-based name extraction
                name_patterns = [
                    r'Account\s*(?:Holder|Name)[:\s]+([A-Z][A-Za-z\s\.]+?)(?:\n|\r|Account|$)',
                    r'Customer\s*Name[:\s]+([A-Z][A-Za-z\s\.]+?)(?:\n|\r|$)',
                    r'Name[:\s]+([A-Z][A-Za-z\s\.]+?)(?:\n|\r|Address|$)',
                    r'(?:Mr|Mrs|Ms|Miss|Dr)\.?\s+([A-Z][A-Za-z\s]+?)(?:\n|\r|$)',
                    r'Dear\s+([A-Z][A-Za-z\s]+?)(?:,|\n|\r|$)',
                ]
                
                for pattern in name_patterns:
                    match = re.search(pattern, all_text, re.MULTILINE)
                    if match:
                        name = match.group(1).strip()
                        name = re.sub(r'\s+', ' ', name)
                        name = re.sub(r'\b(?:Account|No|Number|A/c|Statement|Branch)\b', '', name, flags=re.IGNORECASE)
                        name = name.strip()
                        if 3 < len(name) < 50:
                            metadata['owner_name'] = name.title()
                            print(f"[DEBUG] Owner from regex: {name}")
                            break
            
            # ========== DATE/PERIOD EXTRACTION ==========
            month_names = ['january', 'february', 'march', 'april', 'may', 'june', 
                          'july', 'august', 'september', 'october', 'november', 'december']
            month_abbrev = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 
                           'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
            
            # Approach 1: Month names with year
            month_year_pattern = r'\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[,\s\-]+(\d{4})\b'
            matches = re.findall(month_year_pattern, all_text, re.IGNORECASE)
            if matches:
                month_str, year = matches[-1]
                try:
                    if month_str.lower() in month_names:
                        month_num = month_names.index(month_str.lower()) + 1
                    else:
                        month_num = month_abbrev.index(month_str.lower()[:3]) + 1
                    metadata['period'] = f"{year}-{str(month_num).zfill(2)}"
                    print(f"[DEBUG] Period detected: {metadata['period']}")
                except (ValueError, IndexError):
                    pass
            
            # Approach 2: Date ranges
            if metadata['period'] == datetime.now().strftime('%Y-%m'):
                date_range_pattern = r'(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})\s*(?:to|To|TO|-|–)\s*(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})'
                match = re.search(date_range_pattern, all_text)
                if match:
                    end_month, end_year = match.group(5), match.group(6)
                    metadata['period'] = f"{end_year}-{end_month.zfill(2)}"
            
            # Approach 3: Statement date
            if metadata['period'] == datetime.now().strftime('%Y-%m'):
                stmt_date_pattern = r'Statement\s*(?:Date|Period|For)[:\s]+(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})'
                match = re.search(stmt_date_pattern, all_text, re.IGNORECASE)
                if match:
                    month, year = match.group(2), match.group(3)
                    metadata['period'] = f"{year}-{month.zfill(2)}"
            
            # Approach 4: Any dates, use latest
            if metadata['period'] == datetime.now().strftime('%Y-%m'):
                all_dates = re.findall(r'(\d{1,2})[/\-](\d{1,2})[/\-](20\d{2})', all_text)
                if all_dates:
                    valid_dates = []
                    for day, month, year in all_dates:
                        try:
                            if 1 <= int(month) <= 12 and 1 <= int(day) <= 31:
                                valid_dates.append((year, month, day))
                        except ValueError:
                            continue
                    if valid_dates:
                        valid_dates.sort(reverse=True)
                        year, month, day = valid_dates[0]
                        metadata['period'] = f"{year}-{month.zfill(2)}"
    
    except Exception as e:
        print(f"Error extracting metadata: {e}")
        import traceback
        traceback.print_exc()
    
    return metadata


def sanitize_filename(name: str) -> str:
    """Sanitize a string to be used in a filename"""
    name = re.sub(r'[^\w\s-]', '', name)
    name = re.sub(r'[-\s]+', '_', name)
    return name.strip('_')


def generate_filename(metadata: dict, original_filename: str) -> str:
    """
    Generate intelligent filename from metadata.
    Format: {Owner}_{Period}.pdf (simplified - no bank name)
    """
    owner = metadata.get('owner_name', 'Unknown')
    period = metadata.get('period', datetime.now().strftime('%Y-%m'))
    
    owner_clean = sanitize_filename(owner)
    
    if owner_clean == 'Unknown':
        base_name = Path(original_filename).stem
        return f"{sanitize_filename(base_name)}.pdf"
    
    filename = f"{owner_clean}_{period}.pdf"
    return filename


def upload_to_paperless(pdf_bytes: bytes, filename: str, title: Optional[str] = None, 
                        tag_id: Optional[int] = None, correspondent_id: Optional[int] = None):
    """
    Upload unlocked PDF to Paperless-ngx via API.
    Attaches tag and correspondent IDs if provided.
    """
    endpoint = f"{PAPERLESS_URL}/api/documents/post_document/"
    headers = get_paperless_headers()
    
    files = {
        "document": (filename, io.BytesIO(pdf_bytes), "application/pdf")
    }
    
    data = {}
    if title:
        data["title"] = title
    if tag_id:
        data["tags"] = tag_id
    if correspondent_id:
        data["correspondent"] = correspondent_id
    
    try:
        response = requests.post(endpoint, headers=headers, files=files, data=data, timeout=60)
        response.raise_for_status()
        
        try:
            json_response = response.json()
            if isinstance(json_response, dict):
                return json_response
            else:
                return {"response": json_response, "status_code": response.status_code}
        except (ValueError, requests.exceptions.JSONDecodeError):
            return {"response": response.text, "status_code": response.status_code}
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json()
                error_msg = f"{error_msg}: {error_detail}"
            except:
                error_msg = f"{error_msg}: {e.response.text}"
        raise HTTPException(status_code=500, detail=f"Failed to upload to Paperless: {error_msg}")


# ========== Frontend Serving ==========

@app.get("/")
async def serve_frontend():
    """Serve the main HTML frontend"""
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return {"message": "Frontend not found. Please ensure static/index.html exists."}


# ========== Health Check ==========

@app.get("/health")
def health_check():
    """Health check endpoint"""
    passwords = load_passwords()
    clients = load_clients()
    
    return {
        "status": "healthy",
        "service": "Paperless Gateway Middleware",
        "version": "3.0.0",
        "checks": {
            "paperless_token_configured": bool(PAPERLESS_TOKEN),
            "paperless_url": PAPERLESS_URL,
            "passwords_count": len(passwords),
            "clients_count": len(clients),
        }
    }


# ========== Password Endpoints ==========

@app.get("/api/passwords")
def get_passwords():
    """Get all passwords from passwords.txt"""
    passwords = load_passwords()
    return {"passwords": passwords, "count": len(passwords)}


@app.put("/api/passwords")
def update_passwords(password_update: PasswordUpdate):
    """Update all passwords in passwords.txt"""
    if save_passwords(password_update.passwords):
        return {
            "success": True,
            "message": "Passwords updated successfully",
            "count": len(password_update.passwords)
        }
    raise HTTPException(status_code=500, detail="Failed to save passwords")


# ========== Client Management Endpoints ==========

@app.get("/api/clients")
def get_clients():
    """Get all clients from clients.json"""
    clients = load_clients()
    return {"clients": clients, "count": len(clients)}


@app.post("/api/clients")
def add_client(client: Client):
    """Add a new client"""
    clients = load_clients()
    
    # Generate ID if not provided
    new_client = client.dict()
    if not new_client.get("id"):
        new_client["id"] = str(uuid.uuid4())
    
    # Check for duplicate match patterns
    for existing in clients:
        if existing["match_pattern"] == new_client["match_pattern"]:
            raise HTTPException(status_code=400, detail="A client with this match pattern already exists")
    
    clients.append(new_client)
    
    if save_clients(clients):
        return {"success": True, "client": new_client}
    raise HTTPException(status_code=500, detail="Failed to save client")


@app.put("/api/clients/{client_id}")
def update_client(client_id: str, client_update: ClientUpdate):
    """Update an existing client"""
    clients = load_clients()
    
    for i, client in enumerate(clients):
        if client["id"] == client_id:
            if client_update.name is not None:
                clients[i]["name"] = client_update.name
            if client_update.match_pattern is not None:
                clients[i]["match_pattern"] = client_update.match_pattern
            if client_update.color is not None:
                clients[i]["color"] = client_update.color
            
            if save_clients(clients):
                return {"success": True, "client": clients[i]}
            raise HTTPException(status_code=500, detail="Failed to save client")
    
    raise HTTPException(status_code=404, detail="Client not found")


@app.delete("/api/clients/{client_id}")
def delete_client(client_id: str):
    """Delete a client"""
    clients = load_clients()
    
    for i, client in enumerate(clients):
        if client["id"] == client_id:
            deleted = clients.pop(i)
            if save_clients(clients):
                return {"success": True, "deleted": deleted}
            raise HTTPException(status_code=500, detail="Failed to save clients")
    
    raise HTTPException(status_code=404, detail="Client not found")


# ========== Paperless Sync Endpoint ==========

@app.post("/api/sync-paperless")
def sync_to_paperless():
    """
    Sync all clients to Paperless-ngx.
    Creates/updates tags for each client and ensures 'Bank' correspondent exists.
    """
    clients = load_clients()
    results = []
    
    # Ensure "Bank" correspondent exists
    bank_correspondent_id = get_or_create_correspondent("Bank")
    
    for client in clients:
        result = {
            "client_name": client["name"],
            "tag_created": False,
            "tag_id": None,
            "error": None
        }
        
        try:
            # Create tag named "Client: {Name}"
            tag_name = f"Client: {client['name']}"
            tag_id = get_or_create_tag(
                tag_name=tag_name,
                color=client.get("color", "#3b82f6"),
                match_pattern=client.get("match_pattern", "")
            )
            
            if tag_id:
                result["tag_created"] = True
                result["tag_id"] = tag_id
                
                # Update client with tag_id
                client["tag_id"] = tag_id
                client["correspondent_id"] = bank_correspondent_id
            else:
                result["error"] = "Failed to create tag"
        except Exception as e:
            result["error"] = str(e)
        
        results.append(result)
    
    # Save updated clients with tag_ids
    save_clients(clients)
    
    return {
        "success": True,
        "bank_correspondent_id": bank_correspondent_id,
        "results": results
    }


# ========== File Upload Endpoint ==========

@app.post("/api/upload")
async def bulk_upload(files: List[UploadFile] = File(...)):
    """
    Bulk upload endpoint: Process multiple PDF files.
    Unlocks, analyzes (using clients.json), renames, and uploads to Paperless-ngx
    with attached tag and correspondent IDs.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    passwords = load_passwords()
    clients = load_clients()
    
    # Ensure "Bank" correspondent exists
    bank_correspondent_id = get_or_create_correspondent("Bank")
    
    results = []
    
    for file in files:
        result = {
            "filename": file.filename,
            "success": False,
            "message": "",
            "unlocked": False,
            "renamed_filename": None,
            "metadata": None,
            "tag_id": None,
            "correspondent_id": None,
            "error": None
        }
        
        try:
            if not file.filename or not file.filename.lower().endswith('.pdf'):
                result["message"] = "Only PDF files are supported"
                result["error"] = "Invalid file type"
                results.append(result)
                continue
            
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
            
            # Unlock PDF
            unlocked_pdf, is_unlocked = try_unlock_pdf(pdf_bytes, passwords)
            result["unlocked"] = is_unlocked
            
            if not is_unlocked:
                result["message"] = "PDF could not be unlocked with available passwords"
            
            # Extract metadata using clients.json
            try:
                metadata = extract_metadata(unlocked_pdf, clients)
                result["metadata"] = {
                    "owner_name": metadata.get("owner_name"),
                    "period": metadata.get("period"),
                    "matched_client": metadata.get("matched_client", {}).get("name") if metadata.get("matched_client") else None
                }
            except Exception as e:
                print(f"Error extracting metadata from {file.filename}: {e}")
                metadata = {'owner_name': 'Unknown', 'period': datetime.now().strftime('%Y-%m')}
                result["metadata"] = metadata
            
            # Generate filename: {Owner}_{Period}.pdf
            intelligent_filename = generate_filename(metadata, file.filename)
            result["renamed_filename"] = intelligent_filename
            
            # Get tag and correspondent IDs
            tag_id = None
            matched_client = metadata.get("matched_client")
            if matched_client:
                # Use the client's tag_id if available, otherwise create it
                tag_id = matched_client.get("tag_id")
                if not tag_id:
                    tag_name = f"Client: {matched_client['name']}"
                    tag_id = get_or_create_tag(
                        tag_name=tag_name,
                        color=matched_client.get("color", "#3b82f6"),
                        match_pattern=matched_client.get("match_pattern", "")
                    )
            
            result["tag_id"] = tag_id
            result["correspondent_id"] = bank_correspondent_id
            
            # Upload to Paperless with tag and correspondent
            try:
                paperless_response = upload_to_paperless(
                    unlocked_pdf,
                    intelligent_filename,
                    title=intelligent_filename,
                    tag_id=tag_id,
                    correspondent_id=bank_correspondent_id
                )
                result["success"] = True
                result["message"] = f"Successfully uploaded as {intelligent_filename}"
                if isinstance(paperless_response, dict):
                    result["paperless_id"] = paperless_response.get("id")
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
