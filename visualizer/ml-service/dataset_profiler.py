import pandas as pd
import numpy as np

def profile_dataset(df):
    profile = {
        'rows': len(df),
        'columns': len(df.columns),
        'column_names': list(df.columns),
        'dtypes': {col: str(df[col].dtype) for col in df.columns},
        'missing_values': df.isnull().sum().to_dict(),
        'numeric_stats': {},
        'class_distribution': {},
        'correlations': []
    }
    
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(exclude=[np.number]).columns.tolist()
    
    for col in numeric_cols:
        vals = df[col].dropna()
        profile['numeric_stats'][col] = {
            'mean': round(float(vals.mean()), 4) if len(vals) > 0 else 0,
            'std': round(float(vals.std()), 4) if len(vals) > 0 else 0,
            'min': round(float(vals.min()), 4) if len(vals) > 0 else 0,
            'max': round(float(vals.max()), 4) if len(vals) > 0 else 0,
            'median': round(float(vals.median()), 4) if len(vals) > 0 else 0,
        }
    
    last_col = df.columns[-1]
    if df[last_col].nunique() <= 15:
        dist = df[last_col].value_counts().to_dict()
        profile['class_distribution'] = {str(k): int(v) for k, v in dist.items()}
    
    if len(numeric_cols) > 1:
        corr = df[numeric_cols].corr()
        for i, col1 in enumerate(numeric_cols):
            for j, col2 in enumerate(numeric_cols):
                if i < j:
                    val = corr.loc[col1, col2]
                    if not np.isnan(val):
                        profile['correlations'].append({
                            'col1': col1, 'col2': col2,
                            'correlation': round(float(val), 4)
                        })
    
    return profile
