import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, r2_score, mean_squared_error, mean_absolute_error
)

def detect_task_type(df, target_column, model_type=None):
    if model_type in ['linear_regression']:
        return 'regression'
    if model_type in ['decision_tree', 'knn', 'random_forest']:
        return 'classification'
        
    target = df[target_column]
    unique_vals = target.nunique()
    if target.dtype == object or unique_vals <= 10:
        return 'classification'
    return 'regression'

def preprocess_for_training(df, target_column):
    df = df.copy()
    le = LabelEncoder()
    for col in df.columns:
        if df[col].dtype == object:
            df[col] = df[col].fillna('missing')
            df[col] = le.fit_transform(df[col].astype(str))
        else:
            df[col] = pd.to_numeric(df[col], errors='coerce')
            df[col] = df[col].fillna(df[col].median())
    return df

def train_model(df, target_column, model_type, split_ratio='80-20'):
    if target_column not in df.columns:
        raise ValueError(f"Target column '{target_column}' not found in dataset")
    
    df = preprocess_for_training(df, target_column)
    task_type = detect_task_type(df, target_column, model_type)
    
    X = df.drop(columns=[target_column])
    y = df[target_column]
    
    label_encoder = None
    if task_type == 'classification':
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(y.astype(str))
        
    feature_names = list(X.columns)
    
    train_pct = int(split_ratio.split('-')[0]) / 100
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=1-train_pct, random_state=42)
    
    model = None
    if task_type == 'classification':
        if model_type == 'decision_tree':
            model = DecisionTreeClassifier(random_state=42, max_depth=10)
        elif model_type == 'knn':
            model = KNeighborsClassifier(n_neighbors=5)
        elif model_type == 'random_forest':
            model = RandomForestClassifier(n_estimators=100, random_state=42)
        else:
            model = DecisionTreeClassifier(random_state=42)
        
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        avg = 'weighted' if len(np.unique(y)) > 2 else 'binary'
        metrics = {
            'accuracy': round(accuracy_score(y_test, y_pred), 4),
            'precision': round(precision_score(y_test, y_pred, average=avg, zero_division=0), 4),
            'recall': round(recall_score(y_test, y_pred, average=avg, zero_division=0), 4),
            'f1_score': round(f1_score(y_test, y_pred, average=avg, zero_division=0), 4),
        }
        
        cm = confusion_matrix(y_test, y_pred)
        labels = sorted(list(set(y_test)))
        if label_encoder:
            labels = label_encoder.inverse_transform(labels).tolist()
            
        feature_importance = []
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            fi_pairs = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)
            feature_importance = [{'feature': f, 'importance': round(float(i), 4)} for f, i in fi_pairs[:15]]
        
        return {
            'task_type': 'classification',
            'metrics': metrics,
            'confusion_matrix': cm.tolist(),
            'confusion_matrix_labels': [str(l) for l in labels],
            'feature_importance': feature_importance,
            'train_size': len(X_train),
            'test_size': len(X_test)
        }
    
    else:  # regression
        model = LinearRegression()
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        metrics = {
            'r2_score': round(r2_score(y_test, y_pred), 4),
            'mse': round(mean_squared_error(y_test, y_pred), 4),
            'mae': round(mean_absolute_error(y_test, y_pred), 4),
            'rmse': round(np.sqrt(mean_squared_error(y_test, y_pred)), 4)
        }
        
        feature_importance = []
        if hasattr(model, 'coef_'):
            coefs = abs(model.coef_)
            fi_pairs = sorted(zip(feature_names, coefs), key=lambda x: x[1], reverse=True)
            feature_importance = [{'feature': f, 'importance': round(float(i), 4)} for f, i in fi_pairs[:15]]
        
        return {
            'task_type': 'regression',
            'metrics': metrics,
            'confusion_matrix': [],
            'confusion_matrix_labels': [],
            'feature_importance': feature_importance,
            'train_size': len(X_train),
            'test_size': len(X_test)
        }
