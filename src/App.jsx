// src/App.js
import React, { useEffect, useState } from 'react';
import './App.css';
import LeafletMap from './leafletMap';
import DataVisual from './dataVisual';


function App() {
  const [displayData, setDisplayData] = useState(null);
  const [typeDataset, setTypeDataset] = useState('pdrb_perkapit')
  const [dataFrequency, setDataFrequency] = useState('tahunan')

  return (
    <div className="App">
      {displayData &&
          <DataVisual 
            displayData={displayData} 
            // typeDataset={typeDataset}
            dataFrequency={dataFrequency}
            setDataFrequency={setDataFrequency}
          /> 
      }
      <LeafletMap 
        displayData={displayData}
        setDisplayData={setDisplayData}
        typeDataset={typeDataset} 
        dataFrequency={dataFrequency}
      />
    </div>
  );
}

export default App;
