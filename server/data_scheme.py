from bson import ObjectId
from pydantic import BaseModel
from pydantic.functional_validators import BeforeValidator
from typing import Optional, List, Annotated

PyObjectId = Annotated[str, BeforeValidator(str)]

class CityCoordinateUnit(BaseModel):
    _id: PyObjectId
    city_name: str
    state_abbr: str
    state_name: str
    location: dict

class CityCoordinateList(BaseModel):
    items: list[CityCoordinateUnit]

