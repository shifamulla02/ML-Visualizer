# ML-Visualizer — Machine Learning Visualization Platform

A full-stack educational platform that visually demonstrates the Machine Learning workflow step-by-step. Upload a dataset, clean it, train models, and visualize results — all through an interactive UI.

---

## What It Does

- Upload CSV datasets and auto-detect classification vs regression
- Profile datasets with charts and statistics
- Apply preprocessing steps (missing values, encoding, scaling)
- Split data into train/test sets
- Train ML models and evaluate with metrics
- Compare multiple models side by side
- Download experiment reports as HTML

---

## Tech Stack

### Frontend
- React.js — UI framework
- Tailwind CSS — Styling
- Recharts — Data visualization charts
- Axios — API requests
- React Router — Page navigation
- Context API — Global state management
- React Hot Toast — Notifications

### Backend
- Node.js — Runtime
- Express.js — REST API server
- Multer — File upload handling
- csv-parser — CSV file reading
- JWT — Authentication tokens
- bcryptjs — Password hashing
- dotenv — Environment variables

### ML Service
- Python — Language
- FastAPI — ML REST API
- scikit-learn — ML algorithms and metrics
- pandas — Data manipulation
- numpy — Numerical computation
- uvicorn — Server runner

---

## ML Algorithms Supported

| Algorithm | Type |
|---|---|
| Decision Tree | Classification |
| K-Nearest Neighbors | Classification |
| Random Forest | Classification |
| Linear Regression | Regression |

---

### Prerequisites
- Node.js (v16 or above)
- Python (v3.8 or above)
- npm
- pip

---

## Running the project

Open three separate terminals:

```bash
# Terminal 1 — Backend
cd backend && node server.js

# Terminal 2 — ML Service
cd ml-service && python main.py

# Terminal 3 — Frontend
cd frontend && npm start
```

---

## ML Pipeline Flow

```
Upload CSV
    ↓
Profile Dataset (stats, charts)
    ↓
Preprocess Data (clean, encode, scale)
    ↓
Train / Test Split (70-30, 80-20, 90-10)
    ↓
Train Model (Decision Tree / KNN / Random Forest / Linear Regression)
    ↓
View Metrics (Accuracy, Precision, Recall, F1, Confusion Matrix)
    ↓
Compare Models
    ↓
Download Report
```

---


## License

MIT License — free to use and modify.
