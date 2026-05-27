import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from django.core.management.base import BaseCommand, CommandError

from apps.users.models import AllowedStaff

NAMESPACES = {
    "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
}


class Command(BaseCommand):
    help = "Import allowed staff from servidores.ods"

    def add_arguments(self, parser):
        parser.add_argument("ods_path")

    def handle(self, *args, **options):
        ods_path = options["ods_path"]
        ods_file = Path(ods_path)

        if not ods_file.is_file():
            repo_root = Path(__file__).resolve().parents[5]
            candidate = repo_root / ods_path
            if candidate.is_file():
                ods_file = candidate

        try:
            with zipfile.ZipFile(ods_file) as archive:
                content = archive.read("content.xml")
        except FileNotFoundError as exc:
            raise CommandError(f"Arquivo não encontrado: {ods_path}") from exc
        except KeyError as exc:
            raise CommandError("Arquivo ODS inválido: content.xml ausente.") from exc

        root = ET.fromstring(content)
        rows = []

        for table in root.findall(".//table:table", NAMESPACES):
            for row in table.findall("table:table-row", NAMESPACES):
                values = []
                for cell in row.findall("table:table-cell", NAMESPACES):
                    repeat = int(
                        cell.attrib.get(
                            "{urn:oasis:names:tc:opendocument:xmlns:table:1.0}number-columns-repeated",
                            "1",
                        )
                    )
                    text = "".join(cell.itertext()).strip()
                    if text:
                        values.extend([text] * repeat)

                if values:
                    rows.append(values)

        if not rows:
            raise CommandError("Nenhuma linha útil encontrada no ODS.")

        header = [value.strip().lower() for value in rows[0]]
        try:
            name_idx = header.index("servidor")
            reg_idx = header.index("matrícula")
        except ValueError as exc:
            raise CommandError("Cabeçalho esperado: Servidor, Matrícula.") from exc

        imported = 0
        for row in rows[1:]:
            if len(row) <= max(name_idx, reg_idx):
                continue

            name = row[name_idx].strip()
            registration_number = row[reg_idx].strip()
            if not name or not registration_number:
                continue

            AllowedStaff.objects.update_or_create(
                registration_number=registration_number,
                defaults={"name": name},
            )
            imported += 1

        self.stdout.write(self.style.SUCCESS(f"{imported} servidores importados."))
