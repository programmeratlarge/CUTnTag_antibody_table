from .models import TableRow

HEADER = ["sample_name", "species", "type", "group", "background"]


def parse_samples(content: bytes) -> list[str]:
    text = content.decode("utf-8", errors="replace")
    names = []
    for line in text.splitlines():
        parts = line.split("\t")
        if len(parts) >= 2:
            name = parts[1].strip()
            if name:
                names.append(name)
    return names


def export_to_tsv(rows: list[TableRow]) -> str:
    lines = ["\t".join(HEADER)]
    for row in rows:
        lines.append("\t".join([
            row.sample_name,
            row.species,
            row.type,
            row.group,
            row.background,
        ]))
    return "\n".join(lines) + "\n"
