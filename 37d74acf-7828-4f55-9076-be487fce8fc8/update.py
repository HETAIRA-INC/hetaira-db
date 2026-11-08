
import json
import shutil
from pathlib import Path

# Your JSON file
file_path = Path(r"D:\HETAIRA\hetaira-data\37d74acf-7828-4f55-9076-be487fce8fc8\data.json")

# Keep a backup of the original
backup_path = file_path.with_suffix(".json.bak")
shutil.copy2(file_path, backup_path)

# Load records
with file_path.open("r", encoding="utf-8-sig") as f:
    data = json.load(f)

# Support either a root array or a single record
if isinstance(data, list):
    records = data
elif isinstance(data, dict) and "id" in data:
    records = [data]
else:
    raise ValueError("Please specify the array containing your records.")

# Renumber IDs without changing other fields
for number, record in enumerate(records, start=1):
    if isinstance(record, dict) and "id" in record:
        record["id"] = f"EHMI-MC-{number:04d}"

# Save the updated JSON
with file_path.open("w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")

print(f"Renumbered {len(records)} records.")
print(f"Original backup: {backup_path}")
