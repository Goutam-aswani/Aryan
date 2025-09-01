# Tax Visualizer with Gen AI (MVP)

## Overview
A single-page web app to calculate, visualize, and explain Indian income tax (old vs new regime) with a built-in AI assistant.

## Features
- Enter income and deductions
- Visualize tax liability (bar chart)
- Compare old vs new regime
- AI assistant for queries and explanations
- Download PDF report

## Setup Instructions

### Backend
1. `cd backend`
2. Create a virtual environment and activate it
3. `pip install -r requirements.txt`
4. Set your OpenAI API key in the environment: `set OPENAI_API_KEY=sk-...`
5. `uvicorn main:app --reload`

### Frontend
Open `frontend/index.html` in your browser. (For CORS, use Live Server or similar if needed.)

## Example Screenshots
![screenshot](screenshot.png)

## Demo PDF Report
See `sample_report.pdf` for an example output.
