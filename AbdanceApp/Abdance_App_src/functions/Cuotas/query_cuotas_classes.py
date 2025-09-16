from pydantic import BaseModel, ConfigDict, Field, StringConstraints, field_validator
from typing import Annotated, Optional
import re

class CuotasQuery(BaseModel):
    dia_recargo: int
    limite_query: int = 100
    dniAlumno: Optional[str]
    idDisciplina: Optional[str]
    cuota_id: Optional[str]
    
    @field_validator('dia_recargo', mode='before')
    @classmethod
    def validate_dia_recargo(cls, value: int):
        try:
            value_int = int(value)
        except ValueError:
            raise ValueError("El numero del dia de recargo no es un entero.")
        if not (1 <= value_int <= 31):
            raise ValueError('dia_recargo fuera de rango: 1-31.')
        
        return value_int
    
    @field_validator('limite_query', mode='before')
    @classmethod
    def validate_limite_query(cls, value: int):
        try:
            value_int = int(value)
        except ValueError:
            raise ValueError("El numero del limite no es un entero.")
        
        if not (1 <= value_int <= 320):
            raise ValueError('limite fuera de rango: 1-320.')
        return value_int
    
    @field_validator('dniAlumno', mode='after')
    @classmethod
    def validate_dni_alumno(cls, value: str):
        if value is not None:
            value_str = value.strip()

            if not (6 <= len(value_str) <= 9):
                raise ValueError('Cantidad de numeros de DNI incorrectos: solo en rango de 6-9.')
            if not re.fullmatch(r'^\d+$', value_str):
                raise ValueError('Formato de DNI incorrecto; debe contener solo numeros.')
            return value_str
        return value
    
    @field_validator('idDisciplina', mode='after')
    @classmethod
    def validate_id_disciplina(cls, value: str):
        if value is not None:
            value_str = value.strip()

            if not (5 <= len(value_str) <= 50) or not re.fullmatch(r'^[A-Za-z0-9_-]+$', value_str):
                raise ValueError('Formato de ID de disciplina incorrecto.')
            return value_str
        return value
    
    @field_validator('cuota_id', mode='after')
    @classmethod
    def validate_cuota_id(cls, value: str):
        if value is not None:
            value_str = value.strip()

            if not (5 <= len(value_str) <= 50) or not re.fullmatch(r'^[A-Za-z0-9_-]+$', value_str):
                raise ValueError('Formato de ID de cuota incorrecto.')
            return value_str
        return value
    

    model_config = ConfigDict(extra='forbid')