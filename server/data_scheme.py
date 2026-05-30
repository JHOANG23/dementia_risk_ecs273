from pydantic import BaseModel, Field
from pydantic.functional_validators import BeforeValidator
from typing import Optional, List, Annotated

PyObjectId = Annotated[str, BeforeValidator(str)]


# Contains information about cities, linked to their id (in other objects they are identified via id)
class Coordinates(BaseModel):
    latitude: float
    longitude: float

class CityCoordinateUnit(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    city_id: int
    city_name: str
    state_abbr: str
    state_name: str
    coordinates: Coordinates

class CityCoordinateList(BaseModel):
    items: list[CityCoordinateUnit]





# Contains information about our six factors, associated with each city id
class Factors(BaseModel):
    obesity: float
    diabetes: float
    bphigh: float
    csmoking: float
    lpa: float
    mhlth: float

class CityFactorUnit(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    city_id: int
    factors: Factors

class CityFactorList(BaseModel):
    items: list[CityFactorUnit]





# Contains information about our outcome (COGNITION)
class CityOutcomeUnit(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    city_id: int
    outcome_value: float

class CityOutcomeList(BaseModel):
    items: list[CityOutcomeUnit]
