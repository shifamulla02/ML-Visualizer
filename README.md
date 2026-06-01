**ML-Visualizer: Machine Learning Visualization Platform
A full-stack educational platform that visually demonstrates the Machine Learning workflow step-by-step. Upload a dataset, clean it, train models, visualize results, and test your knowledge, all through an interactive UI.**

🚀 **What It Does**

-Upload CSV datasets and auto-detect classification vs. regression tasks.

-Profile datasets with interactive charts and comprehensive statistics.

-Apply preprocessing steps including missing value imputation, encoding, and feature scaling.

-Split data into customizable train/test sets.

-Train ML models and evaluate them using standard industry metrics.

-Compare multiple models side-by-side to determine the best performer.

-Test your knowledge with an Interactive Quiz covering core ML concepts and workflow terminology.

-Download experiment reports as HTML for offline viewing and sharing.

🛠️ **Tech Stack**

**Frontend**

React.js — UI framework

Tailwind CSS — Styling

Recharts — Data visualization charts

Axios — API requests

React Router — Page navigation

Context API — Global state management

React Hot Toast — Notifications

**Backend**

Node.js — Runtime

Express.js — REST API server

Multer — File upload handling

csv-parser — CSV file reading

JWT — Authentication tokens

bcryptjs — Password hashing

dotenv — Environment variables

**ML Service**

Python — Language

FastAPI — ML REST API

scikit-learn — ML algorithms and metrics

pandas — Data manipulation

numpy — Numerical computation

🌊 ML Pipeline Flow

Upload CSV

↓ Profile Dataset (stats, charts)

↓ Preprocess Data (clean, encode, scale)

↓ Train / Test Split (70-30, 80-20, 90-10)

↓ Train Model (Decision Tree / KNN / Random Forest / Linear Regression)

↓ View Metrics (Accuracy, Precision, Recall, F1, Confusion Matrix)

↓ Compare Models

↓ Download Report

Note: At any point, users can navigate to the Interactive Quiz to test their understanding of the steps they are performing in the pipeline.

Limits: Currently supports CSV files up to 50MB.


uvicorn — Server runner
