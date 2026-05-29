import pandas as pd
from pathlib import Path
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.dementia_risk
cities_collection = db.get_collection("cities_data")


async def import_data():
    dataset_path = Path('data/dataset.csv')

    # CDC Dataset
    df_data_raw = pd.read_csv(dataset_path)

    # obesity, diabetes, high blood pressure, smoking, physical inactivity, poor mental health
    factor_ids = ["OBESITY", "DIABETES", "BPHIGH", "CSMOKING", "LPA", "MHLTH"]
    outcome_id = "COGNITION" # cognitive disability
    ids_of_interest = factor_ids + [outcome_id]

    # Clean up data
    df_data_raw = df_data_raw[df_data_raw["MeasureId"].isin(ids_of_interest)]
    df_data_raw = df_data_raw[df_data_raw["DataValueTypeID"].isin(["AgeAdjPrv"])]

    df_data = df_data_raw[["StateAbbr",
                           "StateDesc",
                           "LocationName",
                           "LocationID",
                           "Geolocation",
                           "MeasureId",
                           "Data_Value",
                           "Low_Confidence_Limit",
                           "High_Confidence_Limit",
                           "TotalPopulation"]].copy()

    # A proxy for variability
    df_data["Confidence_Width"] = df_data["High_Confidence_Limit"] - df_data["Low_Confidence_Limit"]

    records = df_data.to_dict(orient="records")
    await cities_collection.insert_many(records)

    return

if __name__ == '__main__':
    asyncio.run(import_data())