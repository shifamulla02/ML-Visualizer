import React, { createContext, useContext, useState } from 'react';

const DatasetContext = createContext(null);

export function DatasetProvider({ children }) {
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [preprocessSteps, setPreprocessSteps] = useState([]);
  const [lastTrainingResult, setLastTrainingResult] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <DatasetContext.Provider value={{
      selectedDataset, setSelectedDataset,
      preprocessSteps, setPreprocessSteps,
      lastTrainingResult, setLastTrainingResult,
      darkMode, setDarkMode
    }}>
      {children}
    </DatasetContext.Provider>
  );
}

export const useDataset = () => useContext(DatasetContext);
