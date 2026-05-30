# ECS273 Project README

This folder contains two parts, client and server.

## Server
For the server part, make sure you have the respective packages installed.

```
pip install -r requirements.txt
```

Secondly, make sure you have already installed and started your mongoDB local server.
For example, for mongodb managed with homebrew, run:

```
brew services start mongodb-community
```

Then, put your data into database with:

```
python import_data.py
```

Finally, start your FastAPI server by,

```
uvicorn main:app --reload --port 8000
```

## Client
For the client part, ensure you have npm installed, if not:
```angular2html
npm install
```

Start up the server (React frontend) using: 
```angular2html
cd client
npm run dev
```

### Notes
database is named 'dementia_risk'

#### Server Files:
- data_scheme.py specifies data structures used
- import_data.py imports data from csv files
- main.py is the FastAPI server

### AI Usage Note:
- Used in data_scheme.py to revise our base structure
- Used in import_data.py to help out with the specifics and for optimization