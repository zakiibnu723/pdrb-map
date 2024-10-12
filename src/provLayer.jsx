import React, { useEffect, useState, useCallback } from "react";
import { GeoJSON } from "react-leaflet";

export default function ProvLayer({
  data,
  selectedProvince,
  setSelectedProvince,
  setFitBounds,
  setDisplayData,
  setProvClicked,
  lastRemovedLayer,
  dataFrequency,
}) {
  const [provGHI, setProvGHI] = useState({}); // State to hold GHI values for provinces
  const [provDataset, setProvDataset] = useState(null);
  const [provDatasetTriwulan, setProvDatasetTriwulan] = useState(null);

  useEffect(() => {
    fetch("/dataset0/FORMATTED_dataset/dataset_prov.json")
      .then((res) => res.json())
      .then((data) => setProvDataset(data))
      .catch((error) => console.error("failed fetch dataset_prov", error));
  }, [data]);

  useEffect(() => {
    fetch("/dataset0/FORMATTED_dataset/dataset_prov_triwulan.json")
      .then((res) => res.json())
      .then((data) => setProvDatasetTriwulan(data))
      .catch((error) => console.error("failed fetch dataset_prov_triwulan", error));
  }, [data]);

  useEffect(() => {
    if (provDataset) {
      const pdrbData = {};
      for (const province of provDataset.vervar) {
        const provName = province.prov_name;
        const pdrb_konstan = province.data.pdrb_konstan.PDRB;
        const data2023 = pdrb_konstan[pdrb_konstan.length - 2]; // get last data (2023)
        pdrbData[provName] = data2023;
      }
      setProvGHI(pdrbData);
    }
  }, [data, provDataset]);

  useEffect(() => {
    if (provDataset && provDatasetTriwulan) {
      setDisplayProv(dataFrequency, provDataset, provDatasetTriwulan, selectedProvince?.name);
    }
  }, [dataFrequency, provDatasetTriwulan, selectedProvince?.name]);

  const setDisplayProv = useCallback(
    (dataFrequency, provDataset, provDatasetTriwulan, dataName) => {
      if (dataFrequency === "tahunan") {
        const provincesList = provDataset.vervar;
        const selectedProvData = provincesList.find((entry) => entry.prov_name === dataName);
        setDisplayData(selectedProvData);
      } else if (dataFrequency === "triwulan") {
        const provincesList = provDatasetTriwulan.vervar;
        const selectedProvData = provincesList.find((entry) => entry.prov_name === dataName);
        setDisplayData(selectedProvData);
      }
    },
    [dataFrequency, provDataset, provDatasetTriwulan, setDisplayData]
  );

  const provStyle = (feature) => {
    const ghiValue = provGHI[feature.properties.name];
    const fillColor = ghiValue ? getColorForGHI(ghiValue) : "grey"; // Default color if GHI is not available
    return {
      fillColor,
      weight: 0.8,
      opacity: 1,
      color: "darkgrey",
      fillOpacity: 0.8,
    };
  };

  const getColorForGHI = (value) => {
    if (value < 100000000) return "#0B3866";
    if (value < 200000000) return "#194B6F";
    if (value < 300000000) return "#275F79";
    if (value < 400000000) return "#347282";
    if (value < 500000000) return "#42858B";
    if (value < 600000000) return "#509995";
    if (value < 700000000) return "#5EAC9E";
    if (value < 800000000) return "#6CBFA7";
    if (value < 900000000) return "#79D2B0";
    if (value < 1000000000) return "#87E6BA";
    return "#95F9C3";
  };

  const highlightFeature = (e) => {
    const layer = e.target;
    layer.setStyle({
      weight: 2,
      color: "white",
    });
    layer.bringToFront();
  };

  const resetHighlight = (e) => {
    const layer = e.target;
    layer.setStyle({
      weight: 0.3,
      color: "darkgrey",
    });
  };

  const onEachProvinceFeature = useCallback(
    (feature, layer) => {
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: (e) => {
          const prov_name = feature.properties.name;
          if (provDataset) {
            setDisplayProv(dataFrequency, provDataset, provDatasetTriwulan, prov_name);
          } else {
            console.log("provDataset is still null when layer clicked");
          }

          setSelectedProvince(layer.feature.properties);
          setProvClicked(true);

          const bounds = layer.getBounds();
          setFitBounds(bounds);
          const map = layer._map;

          if (lastRemovedLayer.current) {
            map.addLayer(lastRemovedLayer.current);
          }

          map.eachLayer((lyr) => {
            if (lyr._path) {
              lyr._path.classList.add("nonActive");
            }
          });

          if (layer._path) {
            layer._path.classList.remove("nonActive");
          }

          map.removeLayer(layer);
          lastRemovedLayer.current = layer;
          resetHighlight(e);
        },
      });
    },
    [dataFrequency, provDataset, provDatasetTriwulan, lastRemovedLayer, setSelectedProvince, setProvClicked, setFitBounds, setDisplayProv]
  );

  return provDataset && provDatasetTriwulan && dataFrequency ? (
    <GeoJSON data={data} style={provStyle} onEachFeature={onEachProvinceFeature} />
  ) : (
    <div>Loading...</div>
  );
}
