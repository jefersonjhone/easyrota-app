from django.db import models
import pytest


# Create your models here.
@pytest.mark.django_db
def test_basic():
    assert 1 + 1 == 2