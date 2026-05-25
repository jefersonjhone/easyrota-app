from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0007_alter_driverprofile_cnh"),
    ]

    operations = [
        migrations.CreateModel(
            name="AllowedStaff",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                (
                    "registration_number",
                    models.CharField(max_length=32, unique=True),
                ),
            ],
            options={
                "db_table": "users_allowed_staff",
                "ordering": ["name"],
            },
        ),
    ]
