from .models import TableRow


def validate_samples(names: list[str]) -> list[str]:
    errors: list[str] = []
    if not names:
        errors.append("No samples found in file.")
        return errors
    seen: set[str] = set()
    duplicates: list[str] = []
    for name in names:
        if name in seen:
            duplicates.append(name)
        seen.add(name)
    if duplicates:
        errors.append(f"Duplicate sample names found: {', '.join(duplicates)}")
    return errors


def validate_group(group_name: str, existing_group_names: list[str]) -> list[str]:
    errors: list[str] = []
    if not group_name.strip():
        errors.append("Group name cannot be empty.")
    elif group_name in existing_group_names:
        errors.append(f"Group name '{group_name}' is already in use.")
    return errors
