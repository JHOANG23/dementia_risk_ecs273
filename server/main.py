from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import numpy as np
from typing import List
from pydantic import BaseModel

from data_scheme import *

client = AsyncIOMotorClient("mongodb://localhost:27017")
db = client.dementia_risk

app = FastAPI(title="Dementia Risk Explorer API")

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
        {"$lookup": {"from": "city_factors", "localField": "city_id", "foreignField": "city_id", "as": "factors_doc"}},
        {"$lookup": {"from": "city_outcomes", "localField": "city_id", "foreignField": "city_id", "as": "outcome_doc"}},
        {"$match": {"factors_doc": {"$ne": []}}},
        {"$project": {
            "city_id": 1, "city_name": 1, "state_abbr": 1, "state_name": 1, "coordinates": 1,
            "factors": {"$arrayElemAt": ["$factors_doc.factors", 0]},
            "outcome_value": {"$arrayElemAt": ["$outcome_doc.outcome_value", 0]}
        }}
    ]
    results = await city_coord_collection.aggregate(pipeline).to_list(length=None)
    return CityDataList(items=results)


@app.get("/city_coordinates", response_model=CityCoordinateUnit)
async def get_city_coords(city_id: int):
    city_coord_collection = db.get_collection("city_coordinates")
    city_coords = await city_coord_collection.find_one({"city_id": city_id})
    if city_coords is None:
        raise HTTPException(status_code=404, detail=f"City {city_id} was not found")
    return city_coords


@app.get("/all_city_coordinates", response_model=CityCoordinateList)
async def get_all_city_coords():
    city_coord_collection = db.get_collection("city_coordinates")
    city_coords = await city_coord_collection.find().to_list(length=None)
    return CityCoordinateList(items=city_coords)


@app.get("/city_factors", response_model=CityFactorUnit)
async def get_city_factors(city_id: int):
    city_factor_collection = db.get_collection("city_factors")
    city_factors = await city_factor_collection.find_one({"city_id": city_id})
    if city_factors is None:
        raise HTTPException(status_code=404, detail=f"City {city_id} was not found")
    return city_factors


@app.get("/all_cities_factors", response_model=CityFactorList)
async def get_all_cities_factors():
    city_factor_collection = db.get_collection("city_factors")
    city_factors = await city_factor_collection.find().to_list(length=None)
    return CityFactorList(items=city_factors)


@app.get("/city_outcomes", response_model=CityOutcomeUnit)
async def get_city_outcomes(city_id: int):
    city_outcome_collection = db.get_collection("city_outcomes")
    city_outcome = await city_outcome_collection.find_one({"city_id": city_id})
    if city_outcome is None:
        raise HTTPException(status_code=404, detail=f"City {city_id} was not found")
    return city_outcome


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


# --- Pydantic models for LISA response ---
class LISACity(BaseModel):
    city_id: int
    city_name: str
    state_abbr: str
    latitude: float
    longitude: float
    cognition: float
    lisa_cluster: str   # "HH", "LL", "HL", "LH", "NS"
    local_i: float
    p_value: float

class LISAResponse(BaseModel):
    global_moran_i: float
    global_p_value: float
    global_z_score: float
    cities: List[LISACity]


@app.get("/moran_lisa", response_model=LISAResponse)
async def get_moran_lisa():
    # Load outcomes, coordinates, and KNN from MongoDB
    outcome_col = db.get_collection("city_outcomes")
    coord_col = db.get_collection("city_coordinates")
    knn_col = db.get_collection("city_knn")

    outcomes = await outcome_col.find().to_list(length=None)
    coords = await coord_col.find().to_list(length=None)
    knn_docs = await knn_col.find().to_list(length=None)

    # Build lookup dicts
    outcome_map = {d["city_id"]: d["outcome_value"] for d in outcomes}
    coord_map = {d["city_id"]: d["coordinates"] for d in coords}
    knn_map = {d["city_id"]: d["knn"] for d in knn_docs}

    # Only keep cities that have all three
    city_ids = [
        cid for cid in outcome_map
        if cid in coord_map and cid in knn_map
    ]

    if len(city_ids) < 4:
        raise HTTPException(status_code=400, detail="Not enough cities for Moran's I computation")

    n = len(city_ids)
    id_to_idx = {cid: i for i, cid in enumerate(city_ids)}

    # Build row-standardized spatial weights matrix
    W = np.zeros((n, n))
    for cid in city_ids:
        i = id_to_idx[cid]
        neighbors = [nb for nb in knn_map[cid] if nb in id_to_idx]
        if neighbors:
            w = 1.0 / len(neighbors)
            for nb in neighbors:
                j = id_to_idx[nb]
                W[i, j] = w

    # Extract COGNITION values
    y = np.array([outcome_map[cid] for cid in city_ids])
    y_mean = np.mean(y)
    z = y - y_mean  # deviations from mean

    # --- Global Moran's I ---
    S0 = W.sum()
    numerator = n * float(z @ W @ z)
    denominator = S0 * float(z @ z)
    global_i = numerator / denominator if denominator != 0 else 0.0

    # Permutation test for global p-value (999 iterations)
    n_perm = 999
    perm_i = []
    for _ in range(n_perm):
        z_perm = np.random.permutation(z)
        num_p = n * float(z_perm @ W @ z_perm)
        den_p = S0 * float(z_perm @ z_perm)
        perm_i.append(num_p / den_p if den_p != 0 else 0.0)

    perm_arr = np.array(perm_i)
    global_p = float(np.mean(np.abs(perm_arr) >= abs(global_i)))
    global_z = float((global_i - np.mean(perm_arr)) / np.std(perm_arr)) if np.std(perm_arr) != 0 else 0.0

    # --- Local Moran's I (LISA) ---
    # local_i[i] = z[i] * sum_j(w_ij * z[j])
    Wz = W @ z
    local_i_vals = z * Wz / (float(z @ z) / n)

    # Permutation test for local p-values
    n_perm_local = 499
    local_perm_counts = np.zeros(n)
    for _ in range(n_perm_local):
        z_perm = np.random.permutation(z)
        Wz_perm = W @ z_perm
        local_perm = z * Wz_perm / (float(z_perm @ z_perm) / n)
        local_perm_counts += (np.abs(local_perm) >= np.abs(local_i_vals)).astype(float)

    local_p_vals = local_perm_counts / n_perm_local

    # Assign LISA cluster labels
    sig_threshold = 0.1
    lisa_labels = []
    for i in range(n):
        if local_p_vals[i] >= sig_threshold:
            lisa_labels.append("NS")
        else:
            if z[i] > 0 and Wz[i] > 0:
                lisa_labels.append("HH")
            elif z[i] < 0 and Wz[i] < 0:
                lisa_labels.append("LL")
            elif z[i] > 0 and Wz[i] < 0:
                lisa_labels.append("HL")
            else:
                lisa_labels.append("LH")

    cities_out = []
    for i, cid in enumerate(city_ids):
        c = coord_map[cid]
        cities_out.append(LISACity(
            city_id=cid,
            city_name=coords[0]["city_name"] if False else next(
                d["city_name"] for d in coords if d["city_id"] == cid
            ),
            state_abbr=next(d["state_abbr"] for d in coords if d["city_id"] == cid),
            latitude=c["latitude"],
            longitude=c["longitude"],
            cognition=float(outcome_map[cid]),
            lisa_cluster=lisa_labels[i],
            local_i=float(local_i_vals[i]),
            p_value=float(local_p_vals[i]),
        ))

    return LISAResponse(
        global_moran_i=round(global_i, 4),
        global_p_value=round(global_p, 4),
        global_z_score=round(global_z, 4),
        cities=cities_out,
    )
