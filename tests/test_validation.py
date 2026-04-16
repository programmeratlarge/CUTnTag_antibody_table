import pytest
from cutntagtable.validation import validate_samples, validate_group


def test_validate_samples_clean():
    assert validate_samples(["S1", "S2", "S3"]) == []


def test_validate_samples_empty_list():
    errors = validate_samples([])
    assert any("No samples" in e for e in errors)


def test_validate_samples_duplicate():
    errors = validate_samples(["S1", "S2", "S1"])
    assert any("S1" in e for e in errors)


def test_validate_group_unique_name():
    assert validate_group("NewGroup", ["Existing1", "Existing2"]) == []


def test_validate_group_duplicate_name():
    errors = validate_group("Existing1", ["Existing1", "Existing2"])
    assert any("Existing1" in e for e in errors)


def test_validate_group_empty_name():
    errors = validate_group("", ["Existing1"])
    assert any("empty" in e.lower() for e in errors)


def test_validate_group_whitespace_only_name():
    errors = validate_group("   ", ["Existing1"])
    assert any("empty" in e.lower() for e in errors)
