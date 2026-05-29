from typing import List
from fastapi import FastAPI
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic.functional_validators import BeforeValidator

from data_scheme import CityCoordinateUnit, CityCoordinateList

CLIENT = AsyncIOMotorClient("mongodb://localhost:27017")
DB = CLIENT.dementia_risk

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

@app.get("/city_coordinates")
async def get_city_coord():
    city_coord_collection = DB.get_collection("city_coordinates")
    city_points = await city_coord_collection.find().to_list(length=None)
    return {
        "items": [
            CityCoordinateUnit(**city)
            for city in city_points
        ]
    }