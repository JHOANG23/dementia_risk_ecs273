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
    OBESITY: float
    DIABETES: float
    BPHIGH: float
    CSMOKING: float
    LPA: float
    MHLTH: float

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



# Contains all relevant information
class CityData(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    city_id: int
    city_name: str
    state_abbr: str
    state_name: str
    coordinates: Coordinates
    factors: Factors
    outcome_value: Optional[float] = None

class CityDataList(BaseModel):
    items: list[CityData]



# Contains all city z-score info
class CityZScores(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    city_id: int
    z_scores: dict[str, float]

class CityZScoresList(BaseModel):
    items: list[CityZScores]



# Contains all city knn info
class CityKNN(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    city_id: int
    knn: list[int]

class CityKNNList(BaseModel):
    items: list[CityKNN]