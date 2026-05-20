import re
from django.core.exceptions import ValidationError
from django.db.models.fields import return_None

def is_valid_cnh(value: str) -> bool:
    
    if not value:
        return False 
    
    if not re.fullmatch(r"\d{11}", value):
        return False
    
    if len(set(value)) == 1:
        return False
    
    return True
    
    
def validate_cnh(value: str):
    if not is_valid_cnh(value):
        raise ValidationError("CNH inválida")
    return value