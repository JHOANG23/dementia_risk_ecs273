import pandas as pd
from pathlib import Path
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.dementia_risk
cities_collection = db.get_collection("cities_data")


\async def import_data_temp():
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


async def import_city_coords():
    city_coord_collection = DB.get_collection("city_coordinates")

    dataset_path = "data/500_Cities__Local_Data_for_Better_Health,_2019_release_20260504.csv"
    df = pd.read_csv(
        filepath_or_buffer=dataset_path,
        usecols=[
            "StateAbbr", 
            "StateDesc", 
            "CityName", 
            "GeographicLevel", 
            "GeoLocation", 
            "CityFIPS"
        ]
    )
    
    df = df[df["StateDesc"] != "United States"]
    df = df.drop_duplicates(subset=["CityFIPS"], keep="first", ignore_index=True)

    pattern = r"\(([+-]?\d*\.\d*),\s*([+-]?\d*\.\d*)\)"
    coord_cols = df['GeoLocation'].str.extract(pattern)

    df['GeoLocation'] = df['GeoLocation'].str.strip()
    df['Latitude'] = coord_cols[0].astype(float)
    df['Longitude'] = coord_cols[1].astype(float)

    df["location"] = df.apply(
        lambda row: {
            "type": "Point",
            "coordinates": [row["Longitude"], row["Latitude"]]
        },
        axis=1
    )

    df = df.drop(columns=["GeoLocation", "GeographicLevel", "CityFIPS", "Latitude", "Longitude"])
    df = df.rename(columns={
        "StateAbbr": "state_abbr",
        "StateDesc": "state_name",
        "CityName": "city_name"
    })

    records = df.to_dict(orient="records")

    await city_coord_collection.insert_many(records)
    

async def import_data():
    await import_city_coords()
    await import_data_temp()
