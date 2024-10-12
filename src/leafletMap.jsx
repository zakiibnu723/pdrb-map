import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import KabLayer from './kabLayer';
import ProvLayer from './provLayer';

// Fix for missing marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


const Legend = ({ typeDataset }) => {

  const grades = (typeDataset === 'pdrb_perkapita')
    ? [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    : [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000]

  const getColorForGHI = (value) => {
    if (typeDataset === 'pdrb_perkapita') {
      if (value < 10) return '#0B3866';
      if (value < 20) return '#194B6F';
      if (value < 20) return '#275F79';
      if (value < 40) return '#347282';
      if (value < 50) return '#42858B';
      if (value < 60) return '#509995';
      if (value < 70) return '#5EAC9E';
      if (value < 80) return '#6CBFA7';
      if (value < 90) return '#79D2B0';
      if (value < 100) return '#87E6BA';
      return '#95F9C3';
    } else {
      if (value < 1000) return '#0B3866';
      if (value < 2000) return '#194B6F';
      if (value < 2000) return '#275F79';
      if (value < 4000) return '#347282';
      if (value < 5000) return '#42858B';
      if (value < 6000) return '#509995';
      if (value < 7000) return '#5EAC9E';
      if (value < 8000) return '#6CBFA7';
      if (value < 9000) return '#79D2B0';
      if (value < 10000) return '#87E6BA';
      return '#95F9C3';
    }
  };

  return (
    <div className="legend">
      <h4>PDRB Color Scale</h4>
      {grades.map((grade, index) => (
        <div key={index} className="legend-item">
          <i
            style={{
              backgroundColor: getColorForGHI(grade),
              display: 'inline-block',
              width: '20px',
              height: '20px',
              marginRight: '8px',
            }}
          ></i>
          {grade}+
        </div>
      ))}
    </div>
  );
};

const indonesiaBounds = [
  [6.1352, 94.974],  // Top-left corner (north-west point of Indonesia)
  [-11.0076, 141.018]  // Bottom-right corner (south-east point of Indonesia)
];











// Create a component that uses useMap and handles the fitBounds action
const FitBoundsHandler = ({ bounds }) => {
  const map = useMap(); // Access the current map instance

  useEffect(() => {
    if (bounds) {
      map.flyToBounds(bounds, {
        paddingBottomRight: bounds === indonesiaBounds ? [0, 0] : [650, 300],
        paddingTopLeft: bounds === indonesiaBounds ?[0, 0] : [0, 30],
        animate: true,
        duration: 1.5,
      });
    }
  }, [bounds, map]);

  return null; // This component does not render any visible UI
};

const LeafletMap = ({ displayData, setDisplayData, typeDataset, dataFrequency }) => {
  const [provGeoData, setProvGeoData] = useState(null);
  const [kabGeoData, setKabGeoData] = useState(null)
  const [selectedProvince, setSelectedProvince] = useState(null); 
  const [fitBounds, setFitBounds] = useState(null); // Track bounds for fitBounds
  const [provClicked, setProvClicked] = useState(false)
  // const [lastRemovedLayer, setLastRemovedLayer] = useState(null)
  const lastRemovedLayer = useRef(null)
  const mapRef = useRef()

  useEffect(() => {
    fetch('/geojson/prov-34-simplified.geojson') // Update with your GeoJSON path
      .then((response) => response.json())
      .then((data) => setProvGeoData(data))
      .catch((error) => console.error('Error loading GeoJSON data:', error));
  }, []);

  useEffect(() => {
    fetch('/geojson/kab-34.geojson') // Update with your GeoJSON path
      .then((response) => response.json())
      .then((data) => {setKabGeoData(data);})
      .catch((error) => console.error('Error loading GeoJSON data:', error));
  }, []);





  const filteredKabGeoData = kabGeoData
  ? {
      type: 'FeatureCollection',
      id: selectedProvince?.prov_id,
      features: kabGeoData.features.filter(
        (feature) => feature.properties.prov_name === selectedProvince?.name
      ),
    }
  : null;
  useEffect(() => {
    console.log("Filtered kab geo data:", filteredKabGeoData);
    console.log("kab geo data:", kabGeoData);
  }, [selectedProvince])



  const closeHandler = () => {
    console.log(indonesiaBounds)
    setFitBounds(indonesiaBounds)
    setSelectedProvince(null)
    setDisplayData(null)
    setProvClicked(false)

    if (mapRef.current) {
      mapRef.current.eachLayer((layer) => {
        if (layer._path) {
          layer._path.classList.remove('nonActive');
        }
      });

      mapRef.current.addLayer(lastRemovedLayer.current)
    } 
  }

  return (
    <>
    <MapContainer
      ref={mapRef}
      center={[-2.5489, 118.0149]} // Center of Indonesia
      zoom={5}
      style={{ height: '100vh', width: '100%' }}
      doubleClickZoom={false}
      zoomSnap={0.1}
      className='mapContainer'  
    >

        {kabGeoData && (
          <KabLayer data={filteredKabGeoData} setDisplayData={setDisplayData} />
        )}
        {provGeoData && (
          <ProvLayer 
            data={provGeoData} 
            selectedProvince={selectedProvince}
            setSelectedProvince={setSelectedProvince} 
            setFitBounds={setFitBounds} 
            setDisplayData={setDisplayData}
            setProvClicked={setProvClicked}
            lastRemovedLayer={lastRemovedLayer}
            dataFrequency={dataFrequency}
          />
        )}


      {/* Render FitBoundsHandler when fitBounds is set */}
      {fitBounds && <FitBoundsHandler bounds={fitBounds} />}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        className='leafletMap'
      />
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        className='label-map'
        zIndex={1}
      />
      
{/*make color value information */}

      <Legend typeDataset={typeDataset} />

      {displayData ? (
        <button className="close-button" onClick={closeHandler} >
          <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <path d="m7 7 18 18M7 25 25 7" fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2px" className="stroke-000000"></path>
          </svg>
        </button>
      ) : null}

    <div className={`vignette ${provClicked ? 'active' : ''}`}></div>

    </MapContainer>
    </>
  );
};

export default LeafletMap;
