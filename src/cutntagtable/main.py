from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, UploadFile, File
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles

from .config import load_species
from .io import parse_samples, export_to_tsv
from .models import ExportRequest
from .validation import validate_samples

APP_VERSION = "0.2.0"
STATIC_DIR = Path(__file__).parent.parent.parent / "static"

app = FastAPI(title="CUTnTag Antibody Table", version=APP_VERSION)


@app.get("/config")
def get_config():
    species = load_species()
    return {
        "version": APP_VERSION,
        "species": [s.model_dump() for s in species],
    }


@app.post("/parse")
async def parse_file(file: UploadFile = File(...)):
    content = await file.read()
    names = parse_samples(content)
    errors = validate_samples(names)
    return {"samples": names, "errors": errors}


@app.post("/export")
def export_file(request: ExportRequest):
    tsv_content = export_to_tsv(request.rows)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    if request.project_id.strip():
        filename = f"{request.project_id.strip()}_sample_metadata_{timestamp}.tsv"
    else:
        filename = f"sample_metadata_{timestamp}.tsv"
    return Response(
        content=tsv_content.encode("utf-8"),
        media_type="text/tab-separated-values",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")
