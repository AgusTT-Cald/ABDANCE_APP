from pydantic import BaseModel, ConfigDict, Field, StringConstraints
from typing import Annotated, Optional

class CuotasQuery(BaseModel):
    dia_recargo: Annotated[int, Field(ge=1, le=31)]
    limite_query: Annotated[int, Field(ge=1, le=500)] = 100
    dniAlumno: Optional[Annotated[str, StringConstraints(strip_whitespace=True, 
                                                         min_length=5, 
                                                         max_length=9, 
                                                         pattern=r'^\d+$')]] = None
    idDisciplina: Optional[Annotated[str, StringConstraints(strip_whitespace=True,
                                                            min_length=5,
                                                            max_length=50,
                                                            pattern=r'^[A-Za-z0-9_-]+$')]] = None
    cuota_id: Optional[Annotated[str, StringConstraints(strip_whitespace=True,
                                                            min_length=5,
                                                            max_length=50,
                                                            pattern=r'^[A-Za-z0-9_-]+$')]] = None

    model_config = ConfigDict(extra='forbid')