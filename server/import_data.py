import pandas as pd
import numpy as np
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB connection
client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.dementia_risk

city_coords_collection = db.get_collection("city_coordinates")
city_factors_collection = db.get_collection("city_factors")
city_outcomes_collection = db.get_collection("city_outcomes")
city_zscore_collection = db.get_collection("city_zscores")
city_knn_collection = db.get_collection("city_knn")

# obesity, diabetes, high blood pressure, smoking, physical inactivity, poor mental health
factors = ["OBESITY", "DIABETES", "BPHIGH", "CSMOKING", "LPA", "MHLTH"]
outcome = "COGNITION"  # cognitive disability

dataset_path = "data/dataset.csv"
TOP_N_CITIES = 500

async def import_city_coords(df_raw, top_ids):
    print("[1/5] Importing city coordinates...")
    df = df_raw[["LocationID", "LocationName", "StateAbbr", "StateDesc", "Geolocation"]].copy()
    df = df.drop_duplicates(subset="LocationID")
    df = df.dropna(subset=["LocationName", "Geolocation"])
    df = df[df["LocationID"].isin(top_ids)]

    df["Geolocation"] = df["Geolocation"].str.strip()
    coordinates = df["Geolocation"].str.removeprefix("POINT (").str.removesuffix(")").str.split()
    df["Longitude"] = coordinates.str[0].astype(float)
    df["Latitude"] = coordinates.str[1].astype(float)

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
    print(f"    -> Inserted {len(records)} city coordinate records.")


async def import_city_factors(df_raw, top_ids):
    print("[2/5] Importing city factors...")
    df_raw = df_raw[df_raw["MeasureId"].isin(factors)]
    df_raw = df_raw[df_raw["DataValueTypeID"] == "AgeAdjPrv"]
    df_raw = df_raw[df_raw["LocationID"].isin(top_ids)]

    df = df_raw[["LocationID", "MeasureId", "Data_Value"]].copy()
    df = df.pivot(index="LocationID", columns="MeasureId", values="Data_Value").reset_index()

    before = len(df)
    df = df.dropna(subset=factors)
    after = len(df)
    if before != after:
        print(f"    -> Dropped {before - after} cities with missing factor values.")

    records = [
        {
            "city_id": row["LocationID"],
            "factors": {
                "OBESITY": float(row["OBESITY"]),
                "DIABETES": float(row["DIABETES"]),
                "BPHIGH": float(row["BPHIGH"]),
                "CSMOKING": float(row["CSMOKING"]),
                "LPA": float(row["LPA"]),
                "MHLTH": float(row["MHLTH"])
            }
        }
        for _, row in df.iterrows()
    ]
    await city_factors_collection.drop()
    await city_factors_collection.insert_many(records)
    print(f"    -> Inserted {len(records)} city factor records.")


async def import_city_outcomes(df_raw, top_ids):
    print("[3/5] Importing city outcomes (COGNITION)...")
    df_raw = df_raw[df_raw["DataValueTypeID"] == "AgeAdjPrv"]
    df_raw = df_raw[df_raw["MeasureId"] == outcome]
    df_raw = df_raw[df_raw["LocationID"].isin(top_ids)]

    df = df_raw[["LocationID", "Data_Value"]].copy()
    df = df.dropna(subset=["Data_Value"])

    records = [
        {
            "city_id": row["LocationID"],
            "outcome_value": float(row["Data_Value"])
        }
        for _, row in df.iterrows()
    ]
    await city_outcomes_collection.drop()
    await city_outcomes_collection.insert_many(records)
    print(f"    -> Inserted {len(records)} city outcome records.")


async def compute_zscores():
    print("[4/5] Computing z-scores...")
    docs = await city_factors_collection.find().to_list(length=None)

    if not docs:
        raise RuntimeError("city_factors collection is empty — run import_city_factors first.")

    city_ids = [d["city_id"] for d in docs]
    matrix = np.array(
        [[d["factors"][f] for f in factors] for d in docs],
        dtype=float
    )

    means = np.nanmean(matrix, axis=0)
    stds = np.nanstd(matrix, axis=0)
    stds[stds == 0] = 1
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
    print(f"    -> Inserted {len(records)} z-score records.")


async def compute_knn_weights():
    print("[5/5] Computing KNN weights...")
    k = 5
    docs = await city_coords_collection.find().to_list(length=None)

    if not docs:
        raise RuntimeError("city_coordinates collection is empty — run import_city_coords first.")

    city_ids = [d["city_id"] for d in docs]
    coords = np.array(
        [[d["coordinates"]["latitude"], d["coordinates"]["longitude"]] for d in docs],
        dtype=float
    )

    n = len(city_ids)
    records = []
    for i in range(n):
        diff = coords - coords[i]
        distances = np.sqrt((diff ** 2).sum(axis=1))
        distances[i] = np.inf
        knn_indices = np.argsort(distances)[:k]
        neighbor_ids = [city_ids[j] for j in knn_indices]
        records.append({
            "city_id": city_ids[i],
            "knn": neighbor_ids
        })

    await city_knn_collection.drop()
    await city_knn_collection.insert_many(records)
    print(f"    -> Inserted {len(records)} KNN records.")


async def import_data():
    print("=== Dementia Risk: Data Import ===")
    try:
        print("Reading CSV...")
        df_raw = pd.read_csv(dataset_path)
        print(f"    -> Loaded {len(df_raw)} rows, {len(df_raw.columns)} columns.")

        # Get top N city IDs by population
        pop_df = df_raw[["LocationID", "TotalPopulation"]].drop_duplicates(subset="LocationID")
        pop_df["TotalPopulation"] = (
            pop_df["TotalPopulation"]
            .astype(str)
            .str.replace(",", "", regex=False)
        )

        pop_df["TotalPopulation"] = pd.to_numeric(
            pop_df["TotalPopulation"],
            errors="coerce"
        )
        pop_df = pop_df.dropna(subset=["TotalPopulation"])
        top_ids = set(pop_df.nlargest(TOP_N_CITIES, "TotalPopulation")["LocationID"])
        print(f"    -> Selected top {TOP_N_CITIES} cities by population.")

        await import_city_coords(df_raw, top_ids)
        await import_city_factors(df_raw, top_ids)
        await import_city_outcomes(df_raw, top_ids)
        await compute_zscores()
        await compute_knn_weights()

        print("Creating indexes...")
        await city_coords_collection.create_index("city_id")
        await city_factors_collection.create_index("city_id")
        await city_outcomes_collection.create_index("city_id")
        await city_zscore_collection.create_index("city_id")
        await city_knn_collection.create_index("city_id")
        print("    -> Indexes created.")

        print("\n=== Import complete! All collections populated. ===")
    except Exception as e:
        print(f"\n!!! Import FAILED: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(import_data())
    