from pathlib import Path
import pytest
from cutntagtable.io import parse_samples, export_to_tsv
from cutntagtable.models import TableRow

FIXTURE = Path(__file__).parent / "fixtures" / "sample_list.txt"


def test_parse_samples_basic():
    content = FIXTURE.read_bytes()
    names = parse_samples(content)
    assert len(names) == 30


def test_parse_samples_strips_blank_lines():
    content = b"1\tSampleA\n\n2\tSampleB\n\n"
    assert parse_samples(content) == ["SampleA", "SampleB"]


def test_parse_samples_strips_whitespace():
    content = b"1\t  SampleA  \n2\t  SampleB  \n"
    assert parse_samples(content) == ["SampleA", "SampleB"]


def test_export_to_tsv_header():
    rows = [TableRow(sample_name="S1", species="hg38", type="assay", group="G1", background="")]
    tsv = export_to_tsv(rows)
    header = tsv.splitlines()[0]
    assert header == "sample_name\tspecies\ttype\tgroup\tbackground"


def test_export_to_tsv_tab_separated():
    rows = [TableRow(sample_name="S1", species="hg38", type="assay", group="G1", background="BG1")]
    tsv = export_to_tsv(rows)
    data_line = tsv.splitlines()[1]
    assert data_line == "S1\thg38\tassay\tG1\tBG1"


def test_export_to_tsv_empty_background():
    rows = [TableRow(sample_name="S1", species="mm10", type="background", group="G1", background="")]
    tsv = export_to_tsv(rows)
    data_line = tsv.splitlines()[1]
    fields = data_line.split("\t")
    assert fields[4] == ""
