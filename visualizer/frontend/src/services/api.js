// MOCK API for Standalone Single HTML File Output

const mockDelay = (ms = 500) => new Promise(res => setTimeout(res, ms));
const mockResponse = (data) => ({ data });

export const authAPI = {
  signup: async (data) => { await mockDelay(); return mockResponse({ token: 'mock-token', user: { name: data.name || 'User' } }); },
  login: async (data) => { await mockDelay(); return mockResponse({ token: 'mock-token', user: { name: data.email || 'User' } }); },
  validateToken: async () => { await mockDelay(); return mockResponse({ valid: true, user: { name: 'User' } }); },
};

let datasets = [];
let globalCurrentDataset = null;

export const datasetAPI = {
  upload: async (formData) => { 
    await mockDelay(1000); 
    const file = formData.get('dataset');
    if (!file) throw new Error("No file found in upload");

    const text = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });

    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length < 2) throw new Error("CSV must have at least a header and one row");

    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQuotes = !inQuotes;
        else if (line[i] === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += line[i];
        }
      }
      result.push(current.trim());
      return result;
    };

    const columns = parseLine(lines[0]);
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      if (values.length === columns.length) {
        const row = {};
        columns.forEach((col, idx) => {
          let val = values[idx];
          if (!isNaN(val) && val !== '') val = Number(val);
          row[col] = val;
        });
        rows.push(row);
      }
    }

    const datatypeSummary = {};
    const missingValues = {};
    columns.forEach(col => {
      datatypeSummary[col] = typeof rows[0][col] === 'number' ? 'numeric' : 'categorical';
      missingValues[col] = rows.filter(r => r[col] === '' || r[col] === null || r[col] === undefined).length;
    });

    const newDataset = { 
        _id: Math.random().toString(), 
        originalName: file.name, 
        rows: rows.length, 
        columns: columns,
        datasetType: 'classification',
        missingValues,
        datatypeSummary,
        preview: rows.slice(0, 8),
        _rawRows: rows // Store locally
    };

    datasets.unshift(newDataset);
    globalCurrentDataset = newDataset;
    return mockResponse({ data: { dataset: newDataset } }); 
  },
  list: async () => { 
      await mockDelay(300); 
      return mockResponse({ data: { datasets: datasets } }); 
  },
  get: async (id) => { 
      await mockDelay(300); 
      return mockResponse({ data: datasets.find(d => d._id === id) || datasets[0] }); 
  },
  delete: async (id) => { 
      await mockDelay(300); 
      datasets = datasets.filter(d => d._id !== id); 
      return mockResponse({}); 
  },
  profile: async (id) => { 
    await mockDelay(1000); 
    const ds = datasets.find(d => d._id === id) || globalCurrentDataset;
    if (!ds) throw new Error("Dataset not found");

    const rows = ds._rawRows || [];
    const numericStats = {};
    const categoricalStats = {};
    let classDistribution = {};

    ds.columns.forEach(col => {
      if (ds.datatypeSummary[col] === 'numeric') {
        const vals = rows.map(r => r[col]).filter(v => typeof v === 'number');
        if (vals.length > 0) {
          const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
          const std = Math.sqrt(vals.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / vals.length) || 0;
          const min = Math.min(...vals);
          const max = Math.max(...vals);
          
          // Basic histogram
          const bins = 5;
          const binSize = (max - min) / bins;
          const histogram = [];
          if (binSize > 0) {
            for(let i=0; i<bins; i++) {
               const bMin = min + i*binSize;
               const bMax = i === bins-1 ? max : min + (i+1)*binSize;
               const count = vals.filter(v => v >= bMin && (i === bins-1 ? v <= bMax : v < bMax)).length;
               histogram.push({ range: `${bMin.toFixed(1)}-${bMax.toFixed(1)}`, count });
            }
          }
          numericStats[col] = { mean: mean.toFixed(2), std: std.toFixed(2), min, max, histogram };
        }
      } else {
        const counts = {};
        rows.forEach(r => { counts[r[col]] = (counts[r[col]] || 0) + 1; });
        categoricalStats[col] = Object.entries(counts).map(([name, value]) => ({name: String(name), value})).slice(0, 10);
        
        // Assume last categorical column is target class for distribution
        if (col === ds.columns[ds.columns.length - 1] || Object.keys(classDistribution).length === 0) {
           classDistribution = counts;
        }
      }
    });

    return mockResponse({
      profile: {
        classDistribution,
        numericStats,
        categoricalStats,
        correlations: [] // Simplified for now
      }
    }); 
  },
};

let preprocessState = {
  steps: []
};

export const preprocessAPI = {
  init: async () => { 
    await mockDelay(500); 
    preprocessState.steps = [];
    return mockResponse({ message: 'Initialized' }); 
  },
  missing: async (data) => { 
    await mockDelay(500); 
    if(!globalCurrentDataset) throw new Error("No dataset");
    const before = globalCurrentDataset._rawRows.slice(0, 5).map(r => ({...r}));
    const after = before.map(r => {
      let r2 = {...r};
      if (r2[data.column] === '' || r2[data.column] == null) r2[data.column] = 0; // Mock filling
      return r2;
    });
    preprocessState.steps.push({ type: 'missing', column: data.column, strategy: data.strategy });
    return mockResponse({ message: 'Missing values handled', steps: preprocessState.steps, before, after }); 
  },
  encoding: async (data) => { 
    await mockDelay(500); 
    if(!globalCurrentDataset) throw new Error("No dataset");
    const before = globalCurrentDataset._rawRows.slice(0, 5).map(r => ({...r}));
    const after = before.map((r, i) => {
      let r2 = {...r};
      r2[data.column] = data.method === 'label' ? (i % 3) : '1, 0, 0';
      return r2;
    });
    preprocessState.steps.push({ type: 'encoding', column: data.column, method: data.method });
    return mockResponse({ message: 'Encoding applied', steps: preprocessState.steps, before, after }); 
  },
  scaling: async (data) => { 
    await mockDelay(500); 
    if(!globalCurrentDataset) throw new Error("No dataset");
    const before = globalCurrentDataset._rawRows.slice(0, 5).map(r => ({...r}));
    const after = before.map(r => {
      let r2 = {...r};
      if(typeof r2[data.column] === 'number') {
         r2[data.column] = Number((r2[data.column] * (data.method === 'minmax' ? 0.5 : 0.1)).toFixed(2));
      }
      return r2;
    });
    preprocessState.steps.push({ type: 'scaling', column: data.column, method: data.method });
    return mockResponse({ message: 'Scaling applied', steps: preprocessState.steps, before, after }); 
  },
  history: async () => { 
    await mockDelay(); 
    return mockResponse({ steps: preprocessState.steps }); 
  },
  undo: async () => { 
    await mockDelay(); 
    preprocessState.steps.pop();
    return mockResponse({ message: 'Undo successful', steps: preprocessState.steps }); 
  },
  currentData: async () => { 
    await mockDelay(); 
    return mockResponse({
      data: {
        preview: globalCurrentDataset?.preview || [],
        columns: globalCurrentDataset?.columns || []
      }
    }); 
  },
};

let experiments = [];

export const splitAPI = {
  trainTest: async (data) => { 
    await mockDelay(800); 
    const ratio = data.ratio ? Number(data.ratio.split('-')[1]) / 100 : 0.2;
    const total = globalCurrentDataset ? globalCurrentDataset.rows : 1000;
    const testCount = Math.floor(total * ratio);
    const trainCount = total - testCount;
    return mockResponse({
      trainSize: trainCount,
      testSize: testCount,
      trainPct: Math.round((1 - ratio) * 100),
      testPct: Math.round(ratio * 100),
      trainPreview: globalCurrentDataset ? globalCurrentDataset._rawRows.slice(0, 5) : [],
      testPreview: globalCurrentDataset ? globalCurrentDataset._rawRows.slice(total - 5, total) : []
    }); 
  },
};

export const modelAPI = {
  train: async (data) => { 
    await mockDelay(2000); 
    const total = globalCurrentDataset ? globalCurrentDataset.rows : 1000;
    
    // Simulate some variance based on model type
    let acc = 0.85 + (Math.random() * 0.1); 
    if (data.modelType === 'linear_regression') acc = 0.75 + (Math.random() * 0.1);

    const metrics = {
      accuracy: Number(acc.toFixed(2)),
      precision: Number((acc - 0.02).toFixed(2)),
      recall: Number((acc + 0.01).toFixed(2)),
      f1_score: Number((acc - 0.01).toFixed(2)),
      r2: Number((acc - 0.05).toFixed(2)),
      mse: Number((0.2 - acc/10).toFixed(2)),
      mae: Number((0.3 - acc/10).toFixed(2)),
    };

    const session = {
      _id: Math.random().toString(),
      datasetName: globalCurrentDataset?.originalName || 'dataset.csv',
      modelType: data.modelType || 'decision_tree',
      targetColumn: data.targetColumn || 'Target',
      taskType: data.modelType === 'linear_regression' ? 'regression' : 'classification',
      splitRatio: data.splitRatio || '80-20',
      createdAt: new Date().toISOString(),
      metrics: metrics,
      confusionMatrix: [[Math.floor(total*0.1), Math.floor(total*0.02)], [Math.floor(total*0.03), Math.floor(total*0.05)]],
      confusionMatrixLabels: ['Class 0', 'Class 1'],
      featureImportance: globalCurrentDataset ? 
           globalCurrentDataset.columns.slice(0, -1).map(c => ({ feature: c, importance: Number(Math.random().toFixed(2)) })) : 
           [{ feature: 'Feature1', importance: 0.6 }, { feature: 'Feature2', importance: 0.3 }],
      preprocessingSteps: preprocessState.steps
    };
    experiments.unshift(session);

    return mockResponse({
      result: {
        metrics: metrics,
        train_size: Math.floor(total * 0.8),
        test_size: Math.floor(total * 0.2),
      },
      session: session
    }); 
  },
  metrics: async () => { await mockDelay(); return mockResponse({}); },
  compare: async (data) => { 
    await mockDelay(); 
    const ids = data.sessionIds || [];
    return mockResponse(experiments.filter(e => ids.includes(e._id)));
  },
};

export const experimentAPI = {
  history: async () => { await mockDelay(); return mockResponse(experiments); },
  report: async (id) => { await mockDelay(); return mockResponse(experiments.find(e => e._id === id) || {}); },
  delete: async () => { await mockDelay(); return mockResponse({}); },
};

export default {};

