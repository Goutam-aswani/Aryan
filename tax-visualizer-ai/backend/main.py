from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from tax_logic import calculate_tax, simulate_tax
from ai_handler import ask_ai
from report_generator import generate_pdf_report
from fastapi.responses import FileResponse, JSONResponse
import uvicorn
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/calculate_tax")
async def calculate_tax_endpoint(data: dict):
    return calculate_tax(data)

@app.post("/simulate")
async def simulate_endpoint(data: dict):
    return simulate_tax(data)

@app.post("/ask_ai")
async def ask_ai_endpoint(data: dict):
    return ask_ai(data)

@app.post("/download_report")
async def download_report(data: dict):
    pdf_path = generate_pdf_report(data)
    return FileResponse(pdf_path, media_type='application/pdf', filename=os.path.basename(pdf_path))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
