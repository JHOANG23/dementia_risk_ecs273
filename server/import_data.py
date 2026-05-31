import pandas as pd
import numpy as np
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.dementia_risk

city_coords_collection = db.get_collection("city_coordinates") # link the city id to the name/coordinates
city_factors_collection = db.get_collection("city_factors") # link the city id to each of the six factors
city_outcomes_collection = db.get_collection("city_outcomes") # link the city id to the outcome (cognition)
city_zscore_collection = db.get_collection("city_zscores")
city_knn_collection = db.get_collection("city_knn")

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
    df = df.dropna(subset=["LocationName", "Geolocation"]) # nan entries cause crashes on our frontend

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
    await city_coords_collection.drop()
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
                "OBESITY": row["OBESITY"],
                "DIABETES": row["DIABETES"],
                "BPHIGH": row["BPHIGH"],
                "CSMOKING": row["CSMOKING"],
                "LPA": row["LPA"],
                "MHLTH": row["MHLTH"]
            }
        }
        for _, row in df.iterrows()
    ]
    await city_factors_collection.drop()
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
    await city_outcomes_collection.drop()
    await city_outcomes_collection.insert_many(records)
    return




async def compute_zscores():
    docs = await city_factors_collection.find().to_list(length=None)

    # Matrix: rows = counties, columns = factors
    city_ids = [d["city_id"] for d in docs]
    matrix = np.array([
        [d["factors"][f] for f in factors]
        for d in docs
    ], dtype=float)

    # We will z-score normalize each factor (across all counties)
    means = np.nanmean(matrix, axis=0) # skips nan entries
    stds = np.nanstd(matrix, axis=0)
    stds[stds == 0] = 1 # bug fix; avoids division by zero
    z_scores = (matrix - means) / stds

    records = [
        {
            "city_id": city_ids[i],
            "z_scores": {
                factors[j]: float(z_scores[i, j])
                for j in range(len(factors))
            }
        }
        for i in range(len(city_ids))
    ]
    await city_zscore_collection.drop()
    await city_zscore_collection.insert_many(records)


async def compute_knn_weights():
    k = 5 # number of nearest neighbors to consider
    docs = await city_coords_collection.find().to_list(length=None)

    # We will be using Euclidean distance to compute the k-nearest neighbors
    city_ids = [d["city_id"] for d in docs]
    coords = np.array([
        [d["coordinates"]["latitude"], d["coordinates"]["longitude"]]
        for d in docs
    ], dtype=float)

    n = len(city_ids)
    records = []

    # find k-nearest neighbors for each county (using Euclidean distance on latitude/longitude)
    for i in range(n):
        diff = coords - coords[i]
        distances = np.sqrt((diff ** 2).sum(axis=1))
        distances[i] = np.inf
        knn_indices = np.argsort(distances)[:k]
        neighbor_ids = [city_ids[j] for j in knn_indices]
        records.append({
            "city_id": city_ids[i],
            "knn": neighbor_ids # k nearest neighbors (city_ids)
        })
    await city_knn_collection.drop()
    await city_knn_collection.insert_many(records)



async def import_data():
    df_raw = pd.read_csv(dataset_path)
    await import_city_coords(df_raw)
    await import_city_factors(df_raw)
    await import_city_outcomes(df_raw)
    await compute_zscores() # relies upon import_city_factors
    await compute_knn_weights()






if __name__ == "__main__":
    asyncio.run(import_data())