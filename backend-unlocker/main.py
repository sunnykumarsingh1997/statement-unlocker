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
import time
from typing import Optional, List, Tuple, Dict, Any
from pathlib import Path
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
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
PAPERLESS_URL = os.getenv("PAPERLESS_URL", "http://localhost:8000")
PAPERLESS_TOKEN = os.getenv("PAPERLESS_TOKEN", "824eb3b9d252494f9ab9c1c31f8641fe96f0b2f9")
PASSWORDS_FILE = Path(__file__).parent / "passwords.txt"
CLIENTS_FILE = Path(__file__).parent / "clients.json"
BANKS_FILE = Path(__file__).parent / "banks.json"
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
    passwords: List[str] = []  # Client-specific passwords that worked before

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    match_pattern: Optional[str] = None
    color: Optional[str] = None

class Bank(BaseModel):
    id: Optional[str] = None
    name: str
    patterns: List[str] = []

class BankUpdate(BaseModel):
    name: Optional[str] = None
    patterns: Optional[List[str]] = None


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


def add_password_to_client(client_id: str, password: str) -> bool:
    """
    Add a working password to a client's saved passwords.
    Used when manual password entry succeeds.
    """
    clients = load_clients()
    for client in clients:
        if client["id"] == client_id:
            # Initialize passwords array if not exists
            if "passwords" not in client:
                client["passwords"] = []
            # Add password if not already saved
            if password not in client["passwords"]:
                client["passwords"].append(password)
                print(f"[DEBUG] Saved password to client: {client['name']}")
                return save_clients(clients)
            return True  # Password already exists
    return False


def get_client_passwords(client_id: str) -> List[str]:
    """Get saved passwords for a specific client"""
    clients = load_clients()
    for client in clients:
        if client["id"] == client_id:
            return client.get("passwords", [])
    return []


# ========== Bank Management Functions ==========

def load_banks() -> List[dict]:
    """Load banks from banks.json file"""
    if not BANKS_FILE.exists():
        return []
    try:
        with open(BANKS_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data.get("banks", [])
    except Exception as e:
        print(f"Error loading banks: {e}")
        return []


def save_banks(banks: List[dict]) -> bool:
    """Save banks to banks.json file"""
    try:
        with open(BANKS_FILE, "w", encoding="utf-8") as f:
            json.dump({"banks": banks}, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving banks: {e}")
        return False


def detect_bank_from_text(text: str, banks: List[dict]) -> Optional[dict]:
    """Simple bank detection - just check if any pattern exists in text"""
    if not text:
        return None
    text_upper = text.upper()
    for bank in banks:
        for pattern in bank.get("patterns", []):
            if pattern.upper() in text_upper:
                return bank
    return None


def detect_bank_from_filename(filename: str, banks: List[dict]) -> Optional[dict]:
    """Detect bank from filename"""
    if not filename:
        return None
    filename_upper = filename.upper()
    for bank in banks:
        for pattern in bank.get("patterns", []):
            if pattern.upper() in filename_upper:
                return bank
    return None


def find_client_by_pattern(text: str, clients: List[dict]) -> Optional[dict]:
    """Simple client detection - check if match_pattern exists in text"""
    if not text:
        return None
    for client in clients:
        pattern = client.get("match_pattern", "")
        if pattern and pattern in text:
            return client
    return None


def find_client_by_filename(filename: str, clients: List[dict]) -> Optional[dict]:
    """Find client from filename"""
    if not filename:
        return None
    filename_lower = filename.lower()
    for client in clients:
        name = client.get("name", "").lower()
        if name and name in filename_lower:
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


def get_or_create_document_type(name: str) -> Optional[int]:
    """
    Get existing document type or create new one in Paperless.
    Returns the document type ID.
    """
    headers = get_paperless_headers()

    # Search for existing document type
    try:
        response = requests.get(
            f"{PAPERLESS_URL}/api/document_types/",
            headers=headers,
            params={"name__iexact": name},
            timeout=30
        )
        response.raise_for_status()
        data = response.json()

        results = data.get("results", [])
        for doc_type in results:
            if doc_type.get("name", "").lower() == name.lower():
                print(f"[DEBUG] Found existing document type: {name} (ID: {doc_type['id']})")
                return doc_type["id"]
    except Exception as e:
        print(f"Error searching for document type: {e}")

    # Create new document type
    try:
        response = requests.post(
            f"{PAPERLESS_URL}/api/document_types/",
            headers=headers,
            json={"name": name},
            timeout=30
        )
        response.raise_for_status()
        new_doc_type = response.json()
        print(f"[DEBUG] Created new document type: {name} (ID: {new_doc_type['id']})")
        return new_doc_type["id"]
    except Exception as e:
        print(f"Error creating document type: {e}")
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

def try_unlock_pdf(pdf_bytes: bytes, passwords: List[str], timeout: float = 30.0,
                   client_passwords: List[str] = None) -> Dict[str, Any]:
    """
    Try to unlock a PDF using a list of passwords with timeout support.

    Args:
        pdf_bytes: The PDF file bytes
        passwords: Global password list
        timeout: Maximum time in seconds to try passwords (default 30)
        client_passwords: Client-specific passwords to try first

    Returns dict with:
        - unlocked: bool - whether PDF was unlocked
        - pdf_bytes: bytes - unlocked PDF bytes (or original if failed)
        - password: str|None - the working password
        - timeout: bool - whether timeout was reached
        - attempts: int - number of passwords tried
        - already_unlocked: bool - if PDF wasn't password protected
    """
    result = {
        "unlocked": False,
        "pdf_bytes": pdf_bytes,
        "password": None,
        "timeout": False,
        "attempts": 0,
        "already_unlocked": False
    }

    pdf_stream = io.BytesIO(pdf_bytes)
    start_time = time.time()

    # First, check if PDF is already unlocked
    try:
        with pikepdf.open(pdf_stream) as pdf:
            output = io.BytesIO()
            pdf.save(output)
            result["unlocked"] = True
            result["pdf_bytes"] = output.getvalue()
            result["already_unlocked"] = True
            return result
    except pikepdf.PasswordError:
        pass
    except Exception as e:
        print(f"Warning: PDF validation error: {e}")
        return result

    # Build password list: client-specific first, then global
    all_passwords = []
    if client_passwords:
        all_passwords.extend(client_passwords)
    all_passwords.extend([p for p in passwords if p not in (client_passwords or [])])

    # Try each password with timeout check
    for password in all_passwords:
        # Check timeout
        elapsed = time.time() - start_time
        if elapsed >= timeout:
            result["timeout"] = True
            print(f"[DEBUG] Password timeout reached after {elapsed:.1f}s, {result['attempts']} attempts")
            return result

        result["attempts"] += 1
        try:
            pdf_stream.seek(0)
            with pikepdf.open(pdf_stream, password=password) as pdf:
                output = io.BytesIO()
                pdf.save(output, encryption=False)
                result["unlocked"] = True
                result["pdf_bytes"] = output.getvalue()
                result["password"] = password
                print(f"[DEBUG] PDF unlocked with password (attempt {result['attempts']})")
                return result
        except pikepdf.PasswordError:
            continue
        except Exception as e:
            print(f"Error trying password: {e}")
            continue

    return result


def try_single_password(pdf_bytes: bytes, password: str) -> Dict[str, Any]:
    """
    Try a single password to unlock a PDF.
    Used for manual password entry.

    Returns dict with:
        - unlocked: bool
        - pdf_bytes: bytes
        - password: str|None
    """
    result = {
        "unlocked": False,
        "pdf_bytes": pdf_bytes,
        "password": None
    }

    pdf_stream = io.BytesIO(pdf_bytes)

    try:
        with pikepdf.open(pdf_stream, password=password) as pdf:
            output = io.BytesIO()
            pdf.save(output, encryption=False)
            result["unlocked"] = True
            result["pdf_bytes"] = output.getvalue()
            result["password"] = password
    except pikepdf.PasswordError:
        pass
    except Exception as e:
        print(f"Error with manual password: {e}")

    return result


def extract_text_from_pdf(pdf_bytes: bytes, max_pages: int = 3) -> str:
    """Extract text from first few pages of PDF"""
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            all_text = ""
            for page in pdf.pages[:max_pages]:
                page_text = page.extract_text() or ""
                all_text += page_text + "\n"
            return all_text
    except Exception as e:
        print(f"Error extracting text: {e}")
        return ""


def extract_period_from_filename(filename: str) -> Optional[str]:
    """
    Extract period (YYYY-MM) from filename.
    Looks for patterns like: 2024-01, 202401, Jan2024, January_2024, etc.
    """
    if not filename:
        return None

    # Pattern: YYYY-MM or YYYY_MM
    match = re.search(r'(20\d{2})[-_](\d{2})', filename)
    if match:
        return f"{match.group(1)}-{match.group(2)}"

    # Pattern: YYYYMM (6 digits starting with 20)
    match = re.search(r'(20\d{2})(\d{2})', filename)
    if match:
        month = int(match.group(2))
        if 1 <= month <= 12:
            return f"{match.group(1)}-{match.group(2)}"

    # Pattern: Month name + Year (Jan2024, January_2024, etc.)
    month_names = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    filename_lower = filename.lower()
    for i, month in enumerate(month_names):
        match = re.search(rf'{month}\w*[-_\s]*(20\d{{2}})', filename_lower)
        if match:
            return f"{match.group(1)}-{str(i+1).zfill(2)}"
        match = re.search(rf'(20\d{{2}})[-_\s]*{month}', filename_lower)
        if match:
            return f"{match.group(1)}-{str(i+1).zfill(2)}"

    return None


def extract_metadata_from_filename(filename: str, clients: List[dict], banks: List[dict]) -> dict:
    """
    Simple metadata extraction from filename.
    This is the primary method - simple and reliable.
    """
    metadata = {
        'owner_name': None,
        'period': None,
        'bank_name': None,
        'client': None,
        'bank': None
    }

    if not filename:
        return metadata

    # Try to find client name in filename
    client = find_client_by_filename(filename, clients)
    if client:
        metadata['owner_name'] = client['name']
        metadata['client'] = client

    # Try to find bank in filename
    bank = detect_bank_from_filename(filename, banks)
    if bank:
        metadata['bank_name'] = bank['name']
        metadata['bank'] = bank

    # Try to find period in filename
    period = extract_period_from_filename(filename)
    if period:
        metadata['period'] = period

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
                        tags: Optional[List[int]] = None, correspondent_id: Optional[int] = None,
                        document_type_id: Optional[int] = None):
    """
    Upload unlocked PDF to Paperless-ngx via API.
    Attaches tags, correspondent, and document type IDs if provided.
    """
    endpoint = f"{PAPERLESS_URL}/api/documents/post_document/"
    headers = get_paperless_headers()

    files = {
        "document": (filename, io.BytesIO(pdf_bytes), "application/pdf")
    }

    data = {}
    if title:
        data["title"] = title
    if tags:
        # Paperless accepts multiple tags as comma-separated string
        data["tags"] = ",".join(str(t) for t in tags)
    if correspondent_id:
        data["correspondent"] = correspondent_id
    if document_type_id:
        data["document_type"] = document_type_id
    
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


# ========== Bank Management Endpoints ==========

@app.get("/api/banks")
def get_banks():
    """Get all banks from banks.json"""
    banks = load_banks()
    return {"banks": banks, "count": len(banks)}


@app.post("/api/banks")
def add_bank(bank: Bank):
    """Add a new bank"""
    banks = load_banks()
    new_bank = bank.dict()
    if not new_bank.get("id"):
        new_bank["id"] = sanitize_filename(bank.name).lower()

    # Check for duplicate
    for existing in banks:
        if existing["id"] == new_bank["id"]:
            raise HTTPException(status_code=400, detail="A bank with this ID already exists")

    banks.append(new_bank)
    if save_banks(banks):
        return {"success": True, "bank": new_bank}
    raise HTTPException(status_code=500, detail="Failed to save bank")


@app.put("/api/banks/{bank_id}")
def update_bank(bank_id: str, bank_update: BankUpdate):
    """Update an existing bank"""
    banks = load_banks()
    for i, bank in enumerate(banks):
        if bank["id"] == bank_id:
            if bank_update.name is not None:
                banks[i]["name"] = bank_update.name
            if bank_update.patterns is not None:
                banks[i]["patterns"] = bank_update.patterns
            if save_banks(banks):
                return {"success": True, "bank": banks[i]}
            raise HTTPException(status_code=500, detail="Failed to save bank")
    raise HTTPException(status_code=404, detail="Bank not found")


@app.delete("/api/banks/{bank_id}")
def delete_bank(bank_id: str):
    """Delete a bank"""
    banks = load_banks()
    for i, bank in enumerate(banks):
        if bank["id"] == bank_id:
            deleted = banks.pop(i)
            if save_banks(banks):
                return {"success": True, "deleted": deleted}
            raise HTTPException(status_code=500, detail="Failed to save banks")
    raise HTTPException(status_code=404, detail="Bank not found")


# ========== Paperless Sync Endpoint ==========

@app.post("/api/sync-paperless")
def sync_to_paperless():
    """
    Sync all clients to Paperless-ngx.
    Creates correspondent for each client (client name as correspondent).
    Creates tags for each client.
    """
    clients = load_clients()
    results = []

    for client in clients:
        result = {
            "client_name": client["name"],
            "tag_created": False,
            "correspondent_created": False,
            "tag_id": None,
            "correspondent_id": None,
            "error": None
        }

        try:
            # Create correspondent for this client (client name as correspondent)
            correspondent_id = get_or_create_correspondent(client["name"])
            if correspondent_id:
                result["correspondent_created"] = True
                result["correspondent_id"] = correspondent_id
                client["correspondent_id"] = correspondent_id

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
                client["tag_id"] = tag_id
            else:
                result["error"] = "Failed to create tag"
        except Exception as e:
            result["error"] = str(e)

        results.append(result)

    # Save updated clients with tag_ids and correspondent_ids
    save_clients(clients)

    return {
        "success": True,
        "results": results
    }


# ========== PDF Analysis Endpoint ==========

@app.post("/api/analyze")
async def analyze_pdf(file: UploadFile = File(...)):
    """
    Analyze a PDF and return auto-detected metadata from filename.
    Used for pre-filling the metadata form before upload.
    """
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        pdf_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    passwords = load_passwords()
    clients = load_clients()
    banks = load_banks()

    # Try to unlock
    unlock_result = try_unlock_pdf(pdf_bytes, passwords)
    is_unlocked = unlock_result["unlocked"]

    # Extract metadata from filename (simple approach)
    metadata = extract_metadata_from_filename(file.filename, clients, banks)

    period = metadata.get('period', '')
    period_month = None
    period_year = None
    if period and '-' in period:
        parts = period.split('-')
        if len(parts) == 2:
            try:
                period_year = int(parts[0])
                period_month = int(parts[1])
            except ValueError:
                pass

    return {
        "success": True,
        "unlocked": is_unlocked,
        "timeout": unlock_result.get("timeout", False),
        "attempts": unlock_result.get("attempts", 0),
        "detected": {
            "client_id": metadata['client'].get("id") if metadata.get('client') else None,
            "client_name": metadata.get('owner_name'),
            "bank_id": metadata['bank'].get("id") if metadata.get('bank') else None,
            "bank_name": metadata.get('bank_name'),
            "period_month": period_month,
            "period_year": period_year,
            "owner_name": metadata.get("owner_name")
        }
    }


# ========== Manual Password Unlock Endpoint ==========

@app.post("/api/unlock-manual")
async def unlock_pdf_manual(
    file: UploadFile = File(...),
    password: str = Form(...),
    client_id: Optional[str] = Form(None),
    save_password: bool = Form(True)
):
    """
    Try to unlock a PDF with a manually entered password.
    If successful and client_id is provided, saves the password to the client.

    Returns the unlocked PDF and detected metadata on success.
    """
    if not file.filename or not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    try:
        pdf_bytes = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")

    # Try the single password
    result = try_single_password(pdf_bytes, password)

    if not result["unlocked"]:
        return {
            "success": False,
            "unlocked": False,
            "message": "Password incorrect"
        }

    # Password worked! Save it to client if requested
    if save_password and client_id:
        add_password_to_client(client_id, password)

    # Also add to global password list if not already there
    if save_password:
        passwords = load_passwords()
        if password not in passwords:
            passwords.append(password)
            save_passwords(passwords)
            print(f"[DEBUG] Added new password to global list")

    # Extract metadata from filename (simple approach)
    clients = load_clients()
    banks = load_banks()

    metadata = extract_metadata_from_filename(file.filename, clients, banks)

    period = metadata.get('period', '')
    period_month = None
    period_year = None
    if period and '-' in period:
        parts = period.split('-')
        if len(parts) == 2:
            try:
                period_year = int(parts[0])
                period_month = int(parts[1])
            except ValueError:
                pass

    return {
        "success": True,
        "unlocked": True,
        "message": "PDF unlocked successfully",
        "password_saved": save_password,
        "detected": {
            "client_id": metadata['client'].get("id") if metadata.get('client') else None,
            "client_name": metadata.get('owner_name'),
            "bank_id": metadata['bank'].get("id") if metadata.get('bank') else None,
            "bank_name": metadata.get('bank_name'),
            "period_month": period_month,
            "period_year": period_year,
            "owner_name": metadata.get("owner_name")
        }
    }


# ========== File Upload Endpoint ==========

@app.post("/api/upload")
async def bulk_upload(
    files: List[UploadFile] = File(...),
    client_id: Optional[str] = Form(None),
    bank_name: Optional[str] = Form(None),
    statement_type: Optional[str] = Form(None),
    period_month: Optional[int] = Form(None),
    period_year: Optional[int] = Form(None)
):
    """
    Bulk upload endpoint: Process multiple PDF files.
    Unlocks, analyzes, renames, and uploads to Paperless-ngx
    with client-based correspondents, document types, and tags.

    Metadata can be pre-selected or auto-detected from PDF content.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    passwords = load_passwords()
    clients = load_clients()
    banks = load_banks()

    # Get pre-selected client if provided
    selected_client = None
    if client_id:
        for c in clients:
            if c["id"] == client_id:
                selected_client = c
                break

    # Get document type ID if statement_type is provided
    document_type_id = None
    if statement_type:
        document_type_id = get_or_create_document_type(statement_type)

    results = []

    for file in files:
        result = {
            "filename": file.filename,
            "success": False,
            "message": "",
            "unlocked": False,
            "renamed_filename": None,
            "metadata": None,
            "tags": [],
            "correspondent_id": None,
            "document_type_id": None,
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

            # Get client-specific passwords if client is pre-selected
            client_passwords = []
            if selected_client:
                client_passwords = selected_client.get("passwords", [])

            # Unlock PDF with timeout and client passwords first
            unlock_result = try_unlock_pdf(
                pdf_bytes, passwords,
                timeout=30.0,
                client_passwords=client_passwords
            )
            is_unlocked = unlock_result["unlocked"]
            unlocked_pdf = unlock_result["pdf_bytes"]
            result["unlocked"] = is_unlocked
            result["timeout"] = unlock_result.get("timeout", False)
            result["attempts"] = unlock_result.get("attempts", 0)

            if unlock_result.get("timeout"):
                result["message"] = "Password timeout - manual entry required"
                result["needs_password"] = True
            elif not is_unlocked:
                result["message"] = "PDF could not be unlocked with available passwords"
                result["needs_password"] = True

            # If password was found, save it to client for future use
            if is_unlocked and unlock_result.get("password") and selected_client:
                working_password = unlock_result["password"]
                if working_password not in selected_client.get("passwords", []):
                    add_password_to_client(selected_client["id"], working_password)

            # Extract metadata from filename (simple approach)
            filename_metadata = extract_metadata_from_filename(file.filename, clients, banks)

            # Determine client (pre-selected > filename-detected)
            final_client = selected_client
            if not final_client and filename_metadata.get('client'):
                final_client = filename_metadata['client']

            # Determine bank (pre-selected > filename-detected)
            final_bank_name = bank_name
            if not final_bank_name and filename_metadata.get('bank_name'):
                final_bank_name = filename_metadata['bank_name']

            # Determine period (pre-selected > filename-detected > current date)
            final_period = None
            if period_month and period_year:
                final_period = f"{period_year}-{str(period_month).zfill(2)}"
            elif filename_metadata.get('period'):
                final_period = filename_metadata['period']
            else:
                final_period = datetime.now().strftime('%Y-%m')

            # Build metadata for response
            result["metadata"] = {
                "client_name": final_client.get("name") if final_client else "Unknown",
                "bank_name": final_bank_name or "Unknown",
                "period": final_period,
                "statement_type": statement_type
            }

            # Generate filename: {Client}_{Bank}_{Period}.pdf
            client_name = sanitize_filename(final_client.get("name", "Unknown")) if final_client else "Unknown"
            bank_clean = sanitize_filename(final_bank_name) if final_bank_name else ""

            if bank_clean:
                intelligent_filename = f"{client_name}_{bank_clean}_{final_period}.pdf"
            else:
                intelligent_filename = f"{client_name}_{final_period}.pdf"
            result["renamed_filename"] = intelligent_filename

            # Create correspondent for client (not hardcoded "Bank")
            correspondent_id = None
            if final_client:
                # Check if client already has correspondent_id cached
                correspondent_id = final_client.get("correspondent_id")
                if not correspondent_id:
                    correspondent_id = get_or_create_correspondent(final_client.get("name"))
            result["correspondent_id"] = correspondent_id

            # Create tags: client tag + bank tag + period tag
            tag_ids = []

            # Client tag
            if final_client:
                client_tag_id = final_client.get("tag_id")
                if not client_tag_id:
                    tag_name = f"Client: {final_client['name']}"
                    client_tag_id = get_or_create_tag(
                        tag_name=tag_name,
                        color=final_client.get("color", "#3b82f6")
                    )
                if client_tag_id:
                    tag_ids.append(client_tag_id)

            # Bank tag
            if final_bank_name:
                bank_tag_id = get_or_create_tag(final_bank_name, color="#10b981")
                if bank_tag_id:
                    tag_ids.append(bank_tag_id)

            # Period tag (Month-Year format)
            if final_period:
                month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                try:
                    year, month = final_period.split('-')
                    month_idx = int(month) - 1
                    if 0 <= month_idx < 12:
                        period_tag_name = f"{month_names[month_idx]}-{year}"
                        period_tag_id = get_or_create_tag(period_tag_name, color="#8b5cf6")
                        if period_tag_id:
                            tag_ids.append(period_tag_id)
                except (ValueError, IndexError):
                    pass

            result["tags"] = tag_ids
            result["document_type_id"] = document_type_id

            # Upload to Paperless with all metadata
            try:
                paperless_response = upload_to_paperless(
                    unlocked_pdf,
                    intelligent_filename,
                    title=intelligent_filename,
                    tags=tag_ids if tag_ids else None,
                    correspondent_id=correspondent_id,
                    document_type_id=document_type_id
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
