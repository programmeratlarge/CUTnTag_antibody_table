from pydantic import BaseModel
from typing import Literal


class TableRow(BaseModel):
    sample_name: str
    species: str       # reference genome string e.g. "hg38"
    type: Literal["assay", "background"]
    group: str
    background: str    # empty string if none


class ExportRequest(BaseModel):
    rows: list[TableRow]
    project_id: str    # empty string if not provided
