import pandas as pd
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.dementia_risk

city_coords_collection = db.get_collection("city_coordinates") # link the city id to the name/coordinates
city_factors_collection = db.get_collection("city_factors") # link the city id to each of the six factors
city_outcomes_collection = db.get_collection("city_outcomes") # link the city id to the outcome (cognition)

# obesity, diabetes, high blood pressure, smoking, physical inactivity, poor mental health
factors = ["OBESITY", "DIABETES", "BPHIGH", "CSMOKING", "LPA", "MHLTH"]
outcome = "COGNITION" # cognitive disability

dataset_path = "data/dataset.csv"


async def import_city_coords(df_raw):
    df = df_raw[["LocationID",
                 "LocationName",
                 "StateAbbr",
                 "StateDesc",
                 "Geolocation"]].copy()

    df = df.drop_duplicates(subset="LocationID") # Note: This is county-level data, not city-level

    # We get the coordinates (latitude/longitude) for every county
    df["Geolocation"] = df["Geolocation"].str.strip()
    coordinates = df["Geolocation"].str.removeprefix("POINT (").str.removesuffix(")").str.split()
    df["Longitude"] = coordinates.str[0].astype(float)
    df["Latitude"] = coordinates.str[1].astype(float)

    # Same format as specified in data_scheme.py
    records = [
        {
            "city_id": row["LocationID"],
            "city_name": row["LocationName"],
            "state_abbr": row["StateAbbr"],
            "state_name": row["StateDesc"],
            "coordinates": {
                "longitude": row["Longitude"],
                "latitude": row["Latitude"]
            }
        }
        for _, row in df.iterrows()
    ]
    await city_coords_collection.insert_many(records)
    return


async def import_city_factors(df_raw):

    # Clean up data
    df_raw = df_raw[df_raw["MeasureId"].isin(factors)]
    df_raw = df_raw[df_raw["DataValueTypeID"].isin(["AgeAdjPrv"])]

    df = df_raw[["LocationID",
                 "MeasureId",
                 "Data_Value"]].copy()

    # make each row one county, each factor as a column
    df = df.pivot(index="LocationID", columns="MeasureId", values="Data_Value").reset_index()

    # Same format as specified in data_scheme.py
    records = [
        {
            "city_id": row["LocationID"],
            "factors": {
                "obesity": row["OBESITY"],
                "diabetes": row["DIABETES"],
                "bphigh": row["BPHIGH"],
                "csmoking": row["CSMOKING"],
                "lpa": row["LPA"],
                "mhlth": row["MHLTH"]
            }
        }
        for _, row in df.iterrows()
    ]
    await city_factors_collection.insert_many(records)
    return



async def import_city_outcomes(df_raw):

    # Clean up data
    df_raw = df_raw[df_raw["DataValueTypeID"].isin(["AgeAdjPrv"])]
    df_raw = df_raw[df_raw["MeasureId"].isin([outcome])]

    df = df_raw[["LocationID",
                 "MeasureId",
                 "Data_Value"]].copy()

    # Same format as specified in data_scheme.py
    records = [
        {
            "city_id": row["LocationID"],
            "outcome_value": row["Data_Value"]
        }
        for _, row in df.iterrows()
    ]
    await city_outcomes_collection.insert_many(records)
    return



async def import_data():
    df_raw = pd.read_csv(dataset_path)
    await import_city_coords(df_raw)
    await import_city_factors(df_raw)
    await import_city_outcomes(df_raw)

if __name__ == "__main__":
    asyncio.run(import_data())