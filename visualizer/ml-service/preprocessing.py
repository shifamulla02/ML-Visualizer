import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler, MinMaxScaler

def apply_preprocessing(df, steps):
    df = df.copy()
    for step in steps:
        step_type = step.get('type')
        column = step.get('column')
        
        if step_type == 'missing':
            strategy = step.get('strategy')
            if strategy == 'drop':
                df = df.dropna(subset=[column])
            elif strategy == 'mean':
                df[column] = pd.to_numeric(df[column], errors='coerce')
                df[column] = df[column].fillna(df[column].mean())
            elif strategy == 'median':
                df[column] = pd.to_numeric(df[column], errors='coerce')
                df[column] = df[column].fillna(df[column].median())
            elif strategy == 'mode':
                mode_val = df[column].mode()
                if len(mode_val) > 0:
                    df[column] = df[column].fillna(mode_val[0])
        
        elif step_type == 'encoding':
            method = step.get('method')
            if method == 'label':
                le = LabelEncoder()
                df[column] = le.fit_transform(df[column].astype(str))
            elif method == 'onehot':
                dummies = pd.get_dummies(df[column], prefix=column)
                df = pd.concat([df.drop(columns=[column]), dummies], axis=1)
        
        elif step_type == 'scaling':
            method = step.get('method')
            df[column] = pd.to_numeric(df[column], errors='coerce')
            vals = df[[column]].fillna(0)
            if method == 'standard':
                scaler = StandardScaler()
            elif method == 'minmax':
                scaler = MinMaxScaler()
            else:
                continue
            df[column] = scaler.fit_transform(vals).flatten()
    
    return df
