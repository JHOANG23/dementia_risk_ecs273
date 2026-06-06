# ECS273 Project README

This project contains two main directories: `client/` and `server/`. To successfully start up the application, follow the setup instructions below. 

## Server

### Step 1: Install Python Packages
1. This step assumes that you have Python installed within your system. 
    ```
    cd server
    pip install -r requirements.txt
    ```
### Step 2: Start up MongoDB Instance
1. This step assumes that you have MongoDB installed within your system.

    Mac:
    ```
    brew services start mongodb-community
    ```
    WSL:
    ```bash
    sudo systemctl start mongod
    ```
### Step 3: Downloading the Dataset
1. Before we can import our data as collections into MongoDB, we will first need to download the raw dataset. 
    - First navigate to the following link: https://data.cdc.gov/500-Cities-Places/PLACES-Local-Data-for-Better-Health-County-Data-20/swc5-untb/about_data
    - Near the **TOP RIGHT** of the page, you will see an `Export` button. Click this button. 
    - A screen will pop up, and should by default display `Download file` with an **Export format** set to **CSV**.
    - Click `Download` located at the **BOTTOM RIGHT** of this pop up.
    - Locate your download and rename the file to: `dataset.csv`
2. We will then need to create a ``data`` folder within the existing `server/` folder. 
    ```bash
    mkdir data
    ```
3. Move `dataset.csv` into `data/`

### Step 4: Import data into MongoDB
1. To create the necessary collections and import our data into MongoDB, run the the `import_data.py` script located within `server/`

    ```bash
    python import_data.py
    ```

### Step 5: Start the FastAPI Server
1. Finally, start your FastAPI server by running the following command:

    ```bash
    uvicorn main:app --reload --port 8000
    ```

## Client
### Step 1: Install NPM
1. For the client part, ensure you have npm installed. If you have the FastAPI server already running on your current terminal, open up a new one and run the following:
    ```angular2html
    cd client
    npm install
    ```
### Step 2: Start up React Frontend
1. Start up the server. 
    ```angular2html
    npm run dev
    ```
---
### Notes
database is named 'dementia_risk'

#### Server Files:
- data_scheme.py specifies data structures used
- import_data.py imports data from csv files
- main.py is the FastAPI server

### AI Usage Note:
- Used in data_scheme.py to revise our base structure
- Used in import_data.py to help out with the specifics and for optimization
- Heavier use in import_data.py for the aggregate data access functionality
- Used to help with the general architecture of the project
- Used in compute_stats.py for help with implementing the Moran's I and getting k-nearest neighbors
- Used to help sync logic and data retrieval across all webpage components