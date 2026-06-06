# Dementia Risk Score Explorer
ECS 273, Team 05
Josh McGinnis, Joseph Hoang, Joe Morrison

## Description

The Dementia Risk Score Explorer is an interactive visual analytics tool that computes a composite dementia risk score for each of the 500 largest U.S. cities using CDC PLACES data. Users adjust the contribution of six modifiable risk factors through weighted sliders and a proportional symbol map and ranked city list update in real time.

A second coordinated view shows a LISA cluster map derived from Local Moran's I spatial autocorrelation analysis of cognitive disability prevalence, showing which cities form statistically significant geographic clusters. Both map views support synchronized zoom and pan.

Shift-clicking any city on the map or ranked list selects it. Shift-clicking a second city opens a comparison panel showing composite risk scores, COGNITION values, and a grouped bar chart comparing z-scores across all six risk factors for both cities side by side.

The backend uses Python, FastAPI, and MongoDB. The frontend uses React and D3.js. All composite scoring runs client-side so slider updates trigger immediate recompute without a server round trip. Spatial autocorrelation is computed server-side using a custom numpy implementation of Moran's I with precomputed KNN spatial weights.

## Installation

This step assumes Python, Node.js, npm, and MongoDB are installed on your system.

### Server

Install Python packages

    cd server
    pip install -r requirements.txt

Start MongoDB.

Mac

    brew services start mongodb-community

WSL

    sudo systemctl start mongod

Download the CDC PLACES city-level dataset using the following link and save it as dataset.csv

    https://data.cdc.gov/api/views/eav7-hnsx/rows.csv?accessType=DOWNLOAD

Create a data/ folder inside server/ and move dataset.csv into it

    mkdir server/data
    mv dataset.csv server/data/dataset.csv

Run the import script. This will take 2-3 minutes and progress is printed for each step

    cd server
    python import_data.py

Wait for === Import complete! All collections populated. === before proceeding.

### Client

Install npm packages

    cd client
    npm install

## Execution

Start the FastAPI backend

    cd server
    uvicorn main:app --reload --port 8000

In a new terminal, start the React frontend

    cd client
    npm run dev

Open http://localhost:5173 in your browser.

To use the tool, adjust the six sliders in the top bar to weight each risk factor from 0 to 10. The map and ranked list update immediately. Click any city to select it. Shift-click a second city to open the comparison panel. Toggle between the projected score map and the LISA cluster map using the buttons above the map.

## Notes

The MongoDB database is named dementia_risk. The following collections are created by import_data.py

- city_coordinates stores location and metadata per city
- city_factors stores age-adjusted prevalence for each of the six risk factors
- city_outcomes stores COGNITION prevalence per city
- city_zscores stores z-score normalized factor values
- city_knn stores precomputed KNN neighbor lists used for Moran's I

### Server Files

- data_scheme.py defines the Pydantic models for all MongoDB collections
- import_data.py parses the CDC PLACES CSV, filters to the 500 largest cities by population, computes z-scores, builds KNN neighbor lists, and loads all collections into MongoDB with indexes on city_id
- main.py is the FastAPI server with endpoints for city coordinates, factor values, outcome values, z-scores, KNN weights, and the Moran's I LISA computation
- evaluate.py is the evaluation suite covering 21 correctness tests, runtime measurement, Moran's I standalone verification, and the usability study protocol

### Client Files

- src/App.jsx is the root component managing city data, z-score map, weight state, and dual city selection logic
- src/services/api.js handles fetch calls to the FastAPI backend for city data and z-scores
- src/utils/scoring.js handles client-side weighted composite score computation from z-scores and weights
- src/utils/constants.js defines the FACTORS array and DEFAULT_WEIGHTS shared across components
- src/components/Map/Map.jsx is the D3.js proportional symbol map with synchronized zoom, proportional circle encoding, and shift-click selection
- src/components/Map/mapHelpers.js contains D3 helper functions for drawing states and city circles with dual selection color encoding
- src/components/LisaMap/LisaMap.jsx is the D3.js LISA cluster map fetching from the Moran's I endpoint with cluster color encoding and synchronized zoom
- src/components/MapPanel/MapPanel.jsx is the toggle container managing visibility and shared zoom state between the two map views
- src/components/RankedList/RankedList.jsx is the ranked city list with real-time score sorting and shift-click dual selection with A/B badge encoding
- src/components/SliderPanel/SliderPanel.jsx renders six weighted sliders with clickable editable value labels
- src/components/ComparePanel/ComparePanel.jsx is the slide-in comparison panel with a D3.js grouped bar chart of factor z-scores for two selected cities

### AI Usage

- data_scheme.py was revised with AI assistance for the base Pydantic model structure
- import_data.py had AI assistance for optimizing the data pipeline structure, NaN filtering logic, z-score computation, KNN neighbor list construction, MongoDB index creation, and verbose logging to improve processing speed of the tool
- main.py used AI assistance syntax of the Moran's I formula implementation without PySal
- src/App.jsx had Gen AI troubleshooting for dual city selection logic and coordinated state management across components with syntax issues
- src/components/Map/Map.jsx was based on previous homework where Gen AI was used to help with learning D3 and syntax
- src/components/LisaMap/LisaMap.jsx had Gen AI assistance for troubleshooting zoom synchronization and tooltip formatting
- src/components/MapPanel/MapPanel.jsx had Gen AI assistance for troublshooting for the shared zoom state pattern syntax
- src/components/ComparePanel/ComparePanel.jsx used Gen AI assistance for D3 syntax grouped bar chart construction and the setTimeout render delay fix
- src/utils/scoring.js used Gen AI for bug fixes with zero total weight
- General architecture, data flow between components, and cross-component selection state were developed by the team
- No parts of the project were copied from Gen AI without being copied by the team
- The Gen AI was primarily used for learning D3 and troubleshooting syntax
