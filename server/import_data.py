import asyncio
import pandas as pd
from motor.motor_asyncio import AsyncIOMotorClient

CLIENT = AsyncIOMotorClient("mongodb://localhost:27017")
DB = CLIENT.dementia_risk

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

if __name__ == '__main__':
    asyncio.run(import_data())