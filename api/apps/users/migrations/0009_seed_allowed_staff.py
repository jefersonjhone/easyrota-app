from django.db import migrations


def seed_allowed_staff(apps, schema_editor):
    AllowedStaff = apps.get_model("users", "AllowedStaff")
    AllowedStaff.objects.get_or_create(
        registration_number="87654321",
        defaults={"name": "PROFESSOR DA SILVA SANTOS"},
    )


class Migration(migrations.Migration):
    dependencies = [
        ("users", "0008_allowedstaff"),
    ]

    operations = [
        migrations.RunPython(seed_allowed_staff, migrations.RunPython.noop),
    ]
