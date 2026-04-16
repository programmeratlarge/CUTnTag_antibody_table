from pathlib import Path
import yaml
from pydantic import BaseModel

CONFIG_PATH = Path(__file__).parent.parent.parent / "config.yaml"


class Species(BaseModel):
    alias: str
    reference: str


def load_species(path: Path = CONFIG_PATH) -> list[Species]:
    with open(path, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    return [Species(**s) for s in data["species"]]
