import io
import re
import math
import json
import os
import torch
import nltk
from nltk.corpus import words as nltk_words
from transformers import GPT2Tokenizer, GPT2LMHeadModel
from PIL import Image
from google import genai
from dotenv import load_dotenv
from difflib import SequenceMatcher
from io import BytesIO
from pdf2image import convert_from_bytes

from google.genai.types import (
    Part
)

# Load environment variables
load_dotenv()

# Download NLTK data
try:
    nltk.data.find('corpora/words')
except LookupError:
    nltk.download("words", quiet=True)

# ─────────────────────────────────────────────────────────────
# 0) Process PDF to Image
# ─────────────────────────────────────────────────────────────
def process_pdf_to_image(pdf_bytes):
    """
    Convert PDF to image for processing
    """
    try:
        # Convert PDF to images (first page only)
        images = convert_from_bytes(pdf_bytes, first_page=1, last_page=1)
        if not images:
            raise Exception("Could not convert PDF to image")
        
        # Convert PIL image to bytes
        img_byte_arr = io.BytesIO()
        images[0].save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        
        return img_byte_arr
    except Exception as e:
        raise Exception(f"PDF processing failed: {str(e)}")

# ─────────────────────────────────────────────────────────────
# 1) API key and document prompts
# ─────────────────────────────────────────────────────────────

# Load environment variables and configure Gemini API
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError("GEMINI_API_KEY not set in environment. Please create a .env file with your API key.")

# Configure the SDK
client = genai.Client(vertexai=False, api_key=API_KEY)

# Initialize your model
MODEL_ID = "gemini-1.5-flash"

# ─────────────────────────────────────────────────────────────
# 2) Ground Truth Data
# ─────────────────────────────────────────────────────────────

GROUND_TRUTHS = {
    "CIF-Good.png": '''{
        "document_type": "CUSTOMER INFORMATION SHEET (INDIVIDUAL)",
        "bank_name": "BPI",
        "personal_information": {
            "rm_no": null,
            "last_name": "Garnet",
            "first_name": "Lawrence",
            "middle_name": "Dela Cruz",
            "suffix": "III",
            "date_of_birth": "10/21/1962",
            "place_of_birth": "Rizal, Philippines",
            "citizenship": null,
            "sex": "Male",
            "marital_status": "Married",
            "mother_s_full_maiden_name": "Rosa H. Dela Cruz",
            "spouse_name": "Marion V. Garnet",
            "tin_number": null,
            "sss_number": null,
            "spouse_birthdate": "8/10/1965",
            "id_presented": {
                "id_type": "Drivers",
                "id_number": "2961781134"
            },
            "no_of_children": 2,
            "highest_educational_attainment": "College Graduate"
        },
        "contact_information": {
            "mobile_no": "+63 917 926 9175",
            "landline_no": null,
            "email_address": "Lawrence@gmail.com",
            "home_address": "Amorsolo St. Brgy. Aguinaldo",
            "country": "Philippines",
            "zip_code": "1366",
            "district_town": null,
            "city_municipality_provice": "Rizal",
            "residence_since_mm_dd_yyyy": null,
            "home_ownership": "Owned"
        },
        "financial_information": {
            "profession_business_name": "Name",
            "date_hired": "01/10/2012",
            "employer_business_address": "business@gmail.com",
            "position_rank": "Assistant VP",
            "nature_of_business_self_employment": "Sales",
            "source_of_income_wealth": {
                "monthly_income": 110000
            }
        },
        "fatca_declaration": {
            "i_am_not_a_us_person": true,
            "i_am_a_us_person": false,
            "us_person_details": {
                "us_citizen": false,
                "us_resident_green_card": false,
                "us_tin": false,
                "us_id": false,
                "w9_submitted": false,
                "us_place_of_birth_1": null,
                "us_place_of_birth_2": null,
                "required_documents_submitted": {
                    "w8_ben": null,
                    "certificate_of_loss_of_us_nationality": null,
                    "written_explanation_not_having_certificate_despite_renunciation": null,
                    "written_explanation_why_us_citizenship_not_obtained_at_birth": null
                }
            }
        },
        "certification_and_authorization": {
            "customer_signature": null,
            "date": "02/03/25"
        },
        "for_bank_use_only": {
            "remarks": null,
            "processed_and_signature_verified_by": "Simon Eulalia",
            "approved_by": "Ray Hernandez"
        },
        "form_no": "BPI-CISS IND-02222022"
    }''',

    "CIF-bad.jpg": '''{
        "document_type": "CUSTOMER INFORMATION SHEET (INDIVIDUAL)",
        "bank_name": "BPI",
        "personal_information": {
            "rm_no": null,
            "last_name": "Garnet",
            "first_name": "Lawrence",
            "middle_name": "Dela Cruz",
            "suffix": "III",
            "date_of_birth": "10/21/1962",
            "place_of_birth": "Rizal, Philippines",
            "citizenship": null,
            "sex": "Male",
            "marital_status": "Married",
            "mother_s_full_maiden_name": "Rosa H. Dela Cruz",
            "spouse_name": "Marion V. Garnet",
            "tin_number": null,
            "sss_number": null,
            "spouse_birthdate": "8/10/1965",
            "id_presented": {
                "id_type": "Drivers",
                "id_number": "2961781134"
            },
            "no_of_children": 2,
            "highest_educational_attainment": "College Graduate"
        },
        "contact_information": {
            "mobile_no": "+63 917 926 9175",
            "landline_no": null,
            "email_address": "Lawrence@gmail.com",
            "home_address": "Amorsolo St. Brgy. Aguinaldo",
            "country": "Philippines",
            "zip_code": "1366",
            "district_town": null,
            "city_municipality_provice": "Rizal",
            "residence_since_mm_dd_yyyy": null,
            "home_ownership": "Owned"
        },
        "financial_information": {
            "profession_business_name": "Name",
            "date_hired": "01/10/2012",
            "employer_business_address": "business@gmail.com",
            "position_rank": "Assistant VP",
            "nature_of_business_self_employment": "Sales",
            "source_of_income_wealth": {
                "monthly_income": 110000
            }
        },
        "fatca_declaration": {
            "i_am_not_a_us_person": true,
            "i_am_a_us_person": false,
            "us_person_details": {
                "us_citizen": false,
                "us_resident_green_card": false,
                "us_tin": false,
                "us_id": false,
                "w9_submitted": false,
                "us_place_of_birth_1": null,
                "us_place_of_birth_2": null,
                "required_documents_submitted": {
                    "w8_ben": null,
                    "certificate_of_loss_of_us_nationality": null,
                    "written_explanation_not_having_certificate_despite_renunciation": null,
                    "written_explanation_why_us_citizenship_not_obtained_at_birth": null
                }
            }
        },
        "certification_and_authorization": {
            "customer_signature": null,
            "date": "02/03/25"
        },
        "for_bank_use_only": {
            "remarks": null,
            "processed_and_signature_verified_by": "Simon Eulalia",
            "approved_by": "Ray Hernandez"
        },
        "form_no": "BPI-CISS IND-02222022"
    }''',

    "DF-Good.jpg": '''{
        "document_type": "DEPOSIT / PAYMENT / BILLS PURCHASE FORM FRONT",
        "copy_type": "BANK'S_COPY",
        "bank_name": "BANK_OF_THE_PHILIPPINE_ISLANDS",
        "transaction_details": {
            "date": "03/29/14",
            "transaction_type": {
                "deposit": true,
                "payment": false,
                "bills_purchase": false
            },
            "account_type": {
                "savings": true,
                "current": false
            },
            "currency": {
                "peso": false,
                "us_dollar": true,
                "others": false
            }
        },
        "account_details": {
            "account_number": "05039947290",
            "account_name_merchant_name": "Amaia Skies"
        },
        "deposit_payment_breakdown": {
            "cash_amount": null,
            "checks": [{
                "amount": 1000000.0,
                "bank": null,
                "date": null,
                "details": null
            }],
            "total_deposits_payment": null
        },
        "teller_validation_bank_copy": null,
        "for_bills_purchase_accommodation": {
            "representative_full_name": "Amie Skies",
            "contact_number": "0917 872 0056",
            "signature_over_printed_name": "present",
            "form_no": "BPI-BPDEP MAN-01222020"
        },
        "client_s_copy_teller_validation": null
    }''',

    "DF-bad.jpeg": '''{
        "document_type": "DEPOSIT / PAYMENT / BILLS PURCHASE FORM FRONT",
        "copy_type": "BANK'S_COPY",
        "bank_name": "BANK_OF_THE_PHILIPPINE_ISLANDS",
        "transaction_details": {
            "date": "03/29/14",
            "transaction_type": {
                "deposit": true,
                "payment": false,
                "bills_purchase": false
            },
            "account_type": {
                "savings": true,
                "current": false
            },
            "currency": {
                "peso": false,
                "us_dollar": true,
                "others": false
            }
        },
        "account_details": {
            "account_number": "05039947290",
            "account_name_merchant_name": "Amaia Skies"
        },
        "deposit_payment_breakdown": {
            "cash_amount": null,
            "checks": [{
                "amount": 1000000.0,
                "bank": null,
                "date": null,
                "details": null
            }],
            "total_deposits_payment": null
        },
        "teller_validation_bank_copy": null,
        "for_bills_purchase_accommodation": {
            "representative_full_name": "Amie Skies",
            "contact_number": "0917 872 0056",
            "signature_over_printed_name": "present",
            "form_no": "BPI-BPDEP MAN-01222020"
        },
        "client_s_copy_teller_validation": null
    }''',

    "DB-Good.jpg": '''{
        "document_type": "DEPOSIT / PAYMENT SLIP BACK",
        "bank_name": "BANK OF THE PHILIPPINE ISLANDS",
        "sections": {
            "check_details_top": {
                "checks": [{
                    "name_of_bank_branch": "Olanggapo",
                    "check_no": "0543729",
                    "amount": 100000.0
                }],
                "total_checks": null,
                "total_cash": null,
                "total_deposits_payment": null
            },
            "deposit_cash_breakdown": {
                "items": [
                    {"no_of_pieces": 100, "denominations": 100, "amount": 1000},
                    {"no_of_pieces": 200, "denominations": 200, "amount": 200},
                    {"no_of_pieces": 300, "denominations": 300, "amount": 1500},
                    {"no_of_pieces": 500, "denominations": 400, "amount": 1250},
                    {"no_of_pieces": 600, "denominations": 600, "amount": 1750},
                    {"no_of_pieces": 700, "denominations": 700, "amount": 6350},
                    {"no_of_pieces": 800, "denominations": 800, "amount": 8750}
                ],
                "total": 10000750000
            },
            "representative_information": {
                "full_name": "Anna Banana Cruz",
                "contact_number": "09178123775",
                "address": "11, Tower 2, City Residences, Manila",
                "citizenship": "Japanese",
                "date_of_birth": "03/31/2001",
                "place_of_birth": "Bulacan",
                "signature": null
            },
            "client_copy": {
                "document_type": "DEPOSIT / PAYMENT SLIP (CLIENT'S COPY)",
                "for_payments_only": {
                    "policy_plan_reference_no": null,
                    "policy_planholder_name": null,
                    "bp_customer_number": "03756245"
                },
                "check_details": {
                    "checks": [{
                        "bank_branch_name": "P. Tuazon",
                        "check_no": "0347345",
                        "amount": 100200200
                    }],
                    "total_checks": 800000,
                    "total_cash": 20000,
                    "total_deposits_payment": 820000
                }
            }
        }
    }''',

    "DB-Bad.jpg": '''{
        "document_type": "DEPOSIT / PAYMENT SLIP BACK",
        "bank_name": "BANK OF THE PHILIPPINE ISLANDS",
        "sections": {
            "check_details_top": {
                "checks": [{
                    "name_of_bank_branch": "Olanggapo",
                    "check_no": "0543729",
                    "amount": 100000.0
                }],
                "total_checks": null,
                "total_cash": null,
                "total_deposits_payment": null
            },
            "deposit_cash_breakdown": {
                "items": [
                    {"no_of_pieces": 100, "denominations": 100, "amount": 1000},
                    {"no_of_pieces": 200, "denominations": 200, "amount": 200},
                    {"no_of_pieces": 300, "denominations": 300, "amount": 1500},
                    {"no_of_pieces": 500, "denominations": 400, "amount": 1250},
                    {"no_of_pieces": 600, "denominations": 600, "amount": 1750},
                    {"no_of_pieces": 700, "denominations": 700, "amount": 6350},
                    {"no_of_pieces": 800, "denominations": 800, "amount": 8750}
                ],
                "total": 10000750000
            },
            "representative_information": {
                "full_name": "Anna Banana Cruz",
                "contact_number": "09178123775",
                "address": "11, Tower 2, City Residences, Manila",
                "citizenship": "Japanese",
                "date_of_birth": "03/31/2001",
                "place_of_birth": "Bulacan",
                "signature": null
            },
            "client_copy": {
                "document_type": "DEPOSIT / PAYMENT SLIP (CLIENT'S COPY)",
                "for_payments_only": {
                    "policy_plan_reference_no": null,
                    "policy_planholder_name": null,
                    "bp_customer_number": "03756245"
                },
                "check_details": {
                    "checks": [{
                        "bank_branch_name": "P. Tuazon",
                        "check_no": "0347345",
                        "amount": 100200200
                    }],
                    "total_checks": 800000,
                    "total_cash": 20000,
                    "total_deposits_payment": 820000
                }
            }
        }
    }''',

    "WF-Good.jpg": '''{
        "document_type": "WITHDRAWAL SLIP",
        "bank_name": "BANK_OF_THE_PHILIPPINE_ISLANDS",
        "withdrawal_slip_details": {
            "currency_type": "US DOLLAR",
            "account_type": "CURRENT",
            "account_number": "3456777799",
            "account_name": "Maxine Yu",
            "teller_validation": null
        },
        "withdrawal_amount": {
            "amount_in_numbers": "USD 50,000"
        },
        "depositor_information": {
            "signature_of_depositor": "present",
            "date": null
        },
        "withdrawal_through_representative": {
            "name_in_print": "Mark Garcia",
            "signature_of_representative": "present",
            "contact_no": "0918 251 0226",
            "depositor_authorization_signatures": [
                {"signature": "present", "date": "05/19/25"},
                {"signature": "present", "date": "05/19/25"}
            ]
        },
        "payment_received_by": {
            "signature": "present",
            "name": "Marco Polo"
        },
        "bank_use_only": {
            "remarks": null,
            "verified_by": null,
            "approved_by": null
        },
        "form_no": "BPI-WDL OTC-01222020"
    }''',

    "WF-Bad.jpg": '''{
        "document_type": "WITHDRAWAL SLIP",
        "bank_name": "BANK_OF_THE_PHILIPPINE_ISLANDS",
        "withdrawal_slip_details": {
            "currency_type": "US DOLLAR",
            "account_type": "CURRENT",
            "account_number": "3456777799",
            "account_name": "Maxine Yu",
            "teller_validation": null
        },
        "withdrawal_amount": {
            "amount_in_numbers": "USD 50,000"
        },
        "depositor_information": {
            "signature_of_depositor": "present",
            "date": null
        },
        "withdrawal_through_representative": {
            "name_in_print": "Mark Garcia",
            "signature_of_representative": "present",
            "contact_no": "0918 251 0226",
            "depositor_authorization_signatures": [
                {"signature": "present", "date": "05/19/25"},
                {"signature": "present", "date": "05/19/25"}
            ]
        },
        "payment_received_by": {
            "signature": "present",
            "name": "Marco Polo"
        },
        "bank_use_only": {
            "remarks": null,
            "verified_by": null,
            "approved_by": null
        },
        "form_no": "BPI-WDL OTC-01222020"
    }''',

    "WB-Good.jpg": '''{
        "document_type": "WITHDRAWAL SLIP BACK",
        "denominations_breakdown": {
            "items": [
                {"no_of_pieces": 1, "denomination": 100, "amount": 100},
                {"no_of_pieces": 2, "denomination": 500, "amount": 1000},
                {"no_of_pieces": 3, "denomination": 1000, "amount": 3000}
            ],
            "total": null
        },
        "representative_information": {
            "full_name": "Mark Garcia",
            "contact_number": "0918 251 3372",
            "address": "1F Tower 1, SMDC, Camarines, Sur",
            "citizenship": "American",
            "date_of_birth": "12/15/2001",
            "place_of_birth": "Bicol",
            "signature": "present"
        }
    }''',

    "WB-bad.jpeg": '''{
        "document_type": "WITHDRAWAL SLIP BACK",
        "denominations_breakdown": {
            "items": [
                {"no_of_pieces": 1, "denomination": 100, "amount": 100},
                {"no_of_pieces": 2, "denomination": 500, "amount": 1000},
                {"no_of_pieces": 3, "denomination": 1000, "amount": 3000}
            ],
            "total": null
        },
        "representative_information": {
            "full_name": "Mark Garcia",
            "contact_number": "0918 251 3372",
            "address": "1F Tower 1, SMDC, Camarines, Sur",
            "citizenship": "American",
            "date_of_birth": "12/15/2001",
            "place_of_birth": "Bicol",
            "signature": "present"
        }
    }'''
}

# ─────────────────────────────────────────────────────────────
# 3) Evaluation + helper functions
# ─────────────────────────────────────────────────────────────

def compute_cer(gt, pred):
    """Compute Character Error Rate."""
    m, n = len(gt), len(pred)
    dp = [[0]*(n+1) for _ in range(m+1)]
    for i in range(m+1): 
        dp[i][0] = i
    for j in range(n+1): 
        dp[0][j] = j
    for i in range(1,m+1):
        for j in range(1,n+1):
            cost = 0 if gt[i-1]==pred[j-1] else 1
            dp[i][j] = min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost)
    return dp[m][n]/max(m,1)

def extract_flat(o, parent=""):
    """Extract flat key-value pairs from nested JSON."""
    out = []
    if isinstance(o, dict):
        for k,v in o.items():
            key = f"{parent}.{k}" if parent else k
            out += extract_flat(v, key)
    elif isinstance(o, list):
        for i,v in enumerate(o):
            out += extract_flat(v, f"{parent}[{i}]")
    else:
        out.append((parent, str(o)))
    return out

def compute_field_accuracy(gt_json, pred_json):
    """Compute strict field accuracy."""
    try:
        gt = dict(extract_flat(json.loads(gt_json)))
        pr = dict(extract_flat(json.loads(pred_json)))
    except:
        return 0.0
    total = len(gt)
    correct = sum(1 for k,v in gt.items() if pr.get(k)==v)
    return correct / total if total else 0.0

def field_matches(gt, pred, max_err_pct=0.1):
    """Check if fields match with fuzzy matching."""
    gt = re.sub(r'[^\w\s]', '', str(gt).lower().strip())
    pred = re.sub(r'[^\w\s]', '', str(pred).lower().strip())
    if not gt and not pred: 
        return True
    return (1 - SequenceMatcher(None, gt, pred).ratio()) <= max_err_pct

def compute_fuzzy_field_accuracy(gt_json, pred_json):
    """Compute fuzzy field accuracy."""
    try:
        gt = dict(extract_flat(json.loads(gt_json)))
        pr = dict(extract_flat(json.loads(pred_json)))
    except:
        return 0.0
    total = len(gt)
    correct = sum(1 for k,v in gt.items() if field_matches(v, pr.get(k, "")))
    return correct / total if total else 0.0

def canonicalize(js):
    """Canonicalize JSON string."""
    return json.dumps(json.loads(js), sort_keys=True, separators=(',', ':'))

def clean_json_string(js):
    """Clean JSON string by removing markdown formatting."""
    return re.sub(r'```(?:json)?\s*|\s*```', '', js.strip(), flags=re.DOTALL)

def extract_values_from_jsonlike(text):
    """Extract all string values from JSON-like text."""
    text = re.sub(r'[{}[\]",:]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def compute_spelling_error_rate(text):
    """Compute spelling error rate using NLTK words corpus."""
    words = text.lower().split()
    if not words:
        return 0.0
    
    english_words = set(nltk_words.words())
    misspelled = sum(1 for word in words if word.isalpha() and word not in english_words)
    return misspelled / len(words)

def compute_perplexity(text):
    """Compute perplexity using GPT-2 model."""
    try:
        tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
        model = GPT2LMHeadModel.from_pretrained('gpt2')
        
        tokenizer.pad_token = tokenizer.eos_token
        inputs = tokenizer.encode(text, return_tensors='pt', truncation=True, max_length=512)
        
        with torch.no_grad():
            outputs = model(inputs, labels=inputs)
            loss = outputs.loss
        
        return math.exp(loss.item())
    except Exception as e:
        print(f"Error computing perplexity: {e}")
        return float('inf')

def compute_refined_metrics(text):
    """Compute refined spelling error rate with additional checks."""
    words = text.lower().split()
    if not words:
        return 0.0
    
    english_words = set(nltk_words.words())
    
    errors = 0
    for word in words:
        if not word.isalpha():
            continue
        
        if word not in english_words:
            corrected = word.replace('0', 'o').replace('1', 'l').replace('5', 's')
            if corrected not in english_words:
                errors += 1
    
    return errors / len(words)

# ─────────────────────────────────────────────────────────────
# 4) Main processing function
# ─────────────────────────────────────────────────────────────

def process_document_image(image_bytes, filename=None):
    """Process a document image and return extracted information and metrics."""
    try:
        # 1) load
        image = Image.open(BytesIO(image_bytes))
        img_format = image.format or "PNG"
        
        # 2) compress & resize loop → ensure <4 MB
        buf = BytesIO()
        image.save(buf, format=img_format, optimize=True, quality=85)
        while buf.getbuffer().nbytes > 4_000_000:
            w, h = image.size
            image = image.resize((int(w * 0.8), int(h * 0.8)), Image.LANCZOS) # type: ignore
            buf = BytesIO()
            image.save(buf, format=img_format, optimize=True, quality=85)

        img_bytes = buf.getvalue()  # this is your final image payload

        ocr_prompt = "Extract all visible printed and handwritten text from this scanned bank document image."

        image_part = {
        "inlineData": {
            "mimeType": "image/png",
            "data": img_bytes
        }
        }

        response = client.models.generate_content(
            model=MODEL_ID,
            contents=[
                Part.from_bytes(data=img_bytes, mime_type="image/png"), 
                ocr_prompt
            ])

        raw_text = response.text.strip() # type: ignore
        print("--- Raw OCR Text ---\n", raw_text[:1000], "\n")

        # Extract JSON with Gemini from OCR
        schema_prompt = (
            "You are a JSON extractor for bank forms. Given the OCR text from a scanned image, "
            "output ONLY valid JSON matching the correct schema, using null for blanks.\n\n"
            "--- CIF Example:\n" + GROUND_TRUTHS["CIF-Good.png"] + "\n\n"
            "--- DF Example:\n" + GROUND_TRUTHS["DF-Good.jpg"] + "\n\n"
            "--- DB Example:\n" + GROUND_TRUTHS["DB-Good.jpg"] + "\n\n"
            "--- WF Example:\n" + GROUND_TRUTHS["WF-Good.jpg"] + "\n\n"
            "--- WB Example:\n" + GROUND_TRUTHS["WB-Good.jpg"] + "\n\n"
            "Now extract JSON from this OCR text:\n" + raw_text
        )

        final = client.models.generate_content(
            model=MODEL_ID,
            contents=[schema_prompt]
        )
        
        pred_json = clean_json_string(final.text)

        print("--- Extracted JSON ---\n", pred_json)

        # Parse the extracted JSON
        try:
            extracted_data = json.loads(pred_json)
        except json.JSONDecodeError:
            extracted_data = {
                "document_type": "unknown",
                "raw_text": pred_json
            }

        # Compute basic metrics
        clean_text = extract_values_from_jsonlike(pred_json)
        ser = compute_spelling_error_rate(clean_text)
        
        try:
            ppl = compute_perplexity(clean_text)
        except:
            ppl = float("inf")
        
        refined_ser = compute_refined_metrics(clean_text)

        # Evaluate against ground truth if available
        cer_score = 0.0
        strict_accuracy = 0.0
        fuzzy_accuracy = 0.0
        
        if filename and filename in GROUND_TRUTHS:
            gt_json = clean_json_string(GROUND_TRUTHS[filename])
            try:
                gt_can = canonicalize(gt_json)
                pred_can = canonicalize(pred_json)
                cer_score = compute_cer(gt_can, pred_can)
                strict_accuracy = compute_field_accuracy(gt_json, pred_json)
                fuzzy_accuracy = compute_fuzzy_field_accuracy(gt_json, pred_json)
            except Exception as e:
                print(f"Error in evaluation: {e}")
        else:
            print("⚠️ No ground truth available for this file.")

        # Prepare metrics with proper handling of infinite values
        metrics = {
            "ser": ser,
            "ppl": 999999.0 if ppl == float("inf") else ppl,  # Replace inf with large finite value
            "refined_ser": refined_ser,
            "cer": cer_score,
            "strict_field_accuracy": strict_accuracy,
            "fuzzy_field_accuracy": fuzzy_accuracy
        }

        return {
            "document_type": extracted_data.get("document_type", "unknown"),
            "extracted": extracted_data,
            "metrics": metrics,
            "raw_text": raw_text,
            "extracted_json": pred_json
        }
        
    except Exception as e:
        print(f"Error processing document: {e}")
        return {
            "error": str(e),
            "document_type": "unknown",
            "extracted": {},
            "metrics": {
                "ser": 0.0,
                "ppl": 999999.0,  # Replace inf with large finite value
                "refined_ser": 0.0,
                "cer": 0.0,
                "strict_field_accuracy": 0.0,
                "fuzzy_field_accuracy": 0.0
            }
        } 