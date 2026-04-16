from .models import TableRow

HEADER = ["sample_name", "species", "type", "group", "background"]


def parse_samples(content: bytes) -> list[str]:
    text = content.decode("utf-8", errors="replace")
    names = [line.strip() for line in text.splitlines()]
    return [n for n in names if n]


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
