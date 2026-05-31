from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from data_scheme import *

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.dementia_risk

app = FastAPI(
    title="Dementia Risk Explorer API",
)

# Enables CORS to allow frontend apps to make requests to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/all_cities_data", response_model=CityDataList)
async def get_all_cities_data():
    city_coord_collection = db.get_collection("city_coordinates")

    pipeline = [
        {
            "$lookup": {
                "from": "city_factors",
                "localField": "city_id",
                "foreignField": "city_id",
                "as": "factors_doc"
            }
        },
        {
            "$lookup": {
                "from": "city_outcomes",
                "localField": "city_id",
                "foreignField": "city_id",
                "as": "outcome_doc"
            }
        },
        {"$match": {
            "factors_doc": {"$ne": []}, # Filter out cities without factors
            }
        },
        {"$project": {
            "city_id": 1,
            "city_name": 1,
            "state_abbr": 1,
            "state_name": 1,
            "coordinates": 1,
            "factors": {"$arrayElemAt": ["$factors_doc.factors", 0]},
            "outcome_value": {"$arrayElemAt": ["$outcome_doc.outcome_value", 0]}
            }
        }
    ]
    results = await city_coord_collection.aggregate(pipeline).to_list(length=None)
    return CityDataList(items=results)


# Get coordinates for a single city
@app.get("/city_coordinates", response_model=CityCoordinateUnit)
async def get_city_coords(city_id: int):
    city_coord_collection = db.get_collection("city_coordinates")
    city_coords = await city_coord_collection.find_one({"city_id": city_id})

    if city_coords is None:
        raise HTTPException(status_code=404, detail=f"City {city_id} was not found")

    return city_coords


# Get coordinates for all cities
@app.get("/all_city_coordinates", response_model=CityCoordinateList)
async def get_all_city_coords():
    city_coord_collection = db.get_collection("city_coordinates")
    city_coords = await city_coord_collection.find().to_list(length=None)
    return CityCoordinateList(items=city_coords)


# Get factors for one city
@app.get("/city_factors", response_model=CityFactorUnit)
async def get_city_factors(city_id: int):
    city_factor_collection = db.get_collection("city_factors")
    city_factors = await city_factor_collection.find_one({"city_id": city_id})

    if city_factors is None:
        raise HTTPException(status_code=404, detail=f"City {city_id} was not found")

    return city_factors


# Get factors for all cities
@app.get("/all_cities_factors", response_model=CityFactorList)
async def get_all_cities_factors():
    city_factor_collection = db.get_collection("city_factors")
    city_factors = await city_factor_collection.find().to_list(length=None)
    return CityFactorList(items=city_factors)


# Get outcome for one city
@app.get("/city_outcomes", response_model=CityOutcomeUnit)
async def get_city_outcomes(city_id: int):
    city_outcome_collection = db.get_collection("city_outcomes")
    city_outcome = await city_outcome_collection.find_one({"city_id": city_id})

    if city_outcome is None:
        raise HTTPException(status_code=404, detail=f"City {city_id} was not found")

    return city_outcome


# Get outcomes for all cities
@app.get("/all_cities_outcomes", response_model=CityOutcomeList)
async def get_all_cities_outcomes():
    city_outcome_collection = db.get_collection("city_outcomes")
    city_outcomes = await city_outcome_collection.find().to_list(length=None)

    return CityOutcomeList(items=city_outcomes)

@app.get("/all_cities_zscores", response_model=CityZScoresList)
async def get_all_cities_zscores():
    city_zscore_collection = db.get_collection("city_zscores")
    city_zscores = await city_zscore_collection.find().to_list(length=None)
    return CityZScoresList(items=city_zscores)

@app.get("/all_cities_knn", response_model=CityKNNList)
async def get_all_cities_knn():
    city_knn_collection = db.get_collection("city_knn")
    city_knn = await city_knn_collection.find().to_list(length=None)
    return CityKNNList(items=city_knn)
