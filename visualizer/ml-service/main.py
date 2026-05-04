from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Any
import json
import pandas as pd
import numpy as np
from model_trainer import train_model
from dataset_profiler import profile_dataset
from preprocessing import apply_preprocessing

app = FastAPI(title="ML Visualization Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class TrainRequest(BaseModel):
    filepath: Optional[str] = None
    target_column: str
    model_type: str
    split_ratio: str = "80-20"
    preprocessing_steps: List[Any] = []
    inline_data: Optional[str] = None

class ProfileRequest(BaseModel):
    filepath: str

class PreprocessRequest(BaseModel):
    filepath: str
    steps: List[Any]

@app.get("/")
def root():
    return {"status": "ML Service Running"}

@app.post("/train-model")
def train(req: TrainRequest):
    try:
        if req.inline_data:
            data = json.loads(req.inline_data)
            df = pd.DataFrame(data)
        elif req.filepath:
            df = pd.read_csv(req.filepath)
        else:
            raise HTTPException(status_code=400, detail="No data provided")
        
        # Convert numeric columns
        for col in df.columns:
            try:
                df[col] = pd.to_numeric(df[col])
            except:
                pass
        
        result = train_model(df, req.target_column, req.model_type, req.split_ratio)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/profile-dataset")
def profile(req: ProfileRequest):
    try:
        df = pd.read_csv(req.filepath)
        return profile_dataset(df)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/preprocess")
def preprocess(req: PreprocessRequest):
    try:
        df = pd.read_csv(req.filepath)
        result_df = apply_preprocessing(df, req.steps)
        return {"data": result_df.to_dict(orient="records"), "columns": list(result_df.columns)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feature-importance")
def feature_importance(req: TrainRequest):
    try:
        if req.inline_data:
            data = json.loads(req.inline_data)
            df = pd.DataFrame(data)
        else:
            df = pd.read_csv(req.filepath)
        for col in df.columns:
            try:
                df[col] = pd.to_numeric(df[col])
            except:
                pass
        result = train_model(df, req.target_column, req.model_type, req.split_ratio)
        return {"feature_importance": result.get("feature_importance", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
