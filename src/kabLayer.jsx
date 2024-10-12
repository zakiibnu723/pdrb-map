import React, { useEffect, useState } from "react";
import { GeoJSON } from "react-leaflet";

export default function KabLayer({ data, setDisplayData }) {
    const [kabGHI, setKabGHI] = useState({}); // State to hold GHI values for each district
    const [kabDataset, setKabDataset] = useState(null)
    
    useEffect(() => {
        fetch('/dataset0/FORMATTED_dataset/dataset_kab.json')
            .then((res) => res.json())
            .then((data) => setKabDataset(data))
            .catch((error) => console.error('failed fetch dataset_prov', error))
    }, [data])

    useEffect(() => {
        if (kabDataset && kabDataset.vervar) {
            const pdrbData = {};
            for (const region of kabDataset.vervar) {
                const kabName = region.kab_name;
                    
                const pdrb_konstan = region.data.pdrb_konstan.PDRB
                const data2023 = pdrb_konstan[pdrb_konstan.length - 1] // get last data (2023) [check pdrb_perkapita_prov.json to see]
                pdrbData[kabName] = data2023;
                // console.log('pdrb 2023' + pdrb_konstan_2023)
            }
            // console.log('pdrb konstan 2023 ' +  JSON.stringify(pdrbData, null, 2))
            setKabGHI(pdrbData); // Set GHI values state
        }

    }, [data, kabDataset]); 



    function setDisplayKab(data, dataName) {
        const kabList = data.vervar
        const selectedKabData = kabList.find(entry => entry.kab_name === dataName);
        
        setDisplayData(selectedKabData);
        console.log('kab displayed:', selectedKabData);
    }


    const kabStyle = (feature) => {
        const ghiValue = kabGHI[feature.properties.name];
        const fillColor = ghiValue ? getColorForGHI(ghiValue) : 'darkgrey'; // Default color if GHI is not available
        return {
            weight: 1,
            opacity: 1,
            color: 'lightgrey',
            fillColor,
            fillOpacity: 1,
        };
    };

    const getColorForGHI = (value) => {
        if (value < 10000000) return '#0B3866';
        if (value < 20000000) return '#194B6F';
        if (value < 30000000) return '#275F79';
        if (value < 40000000) return '#347282';
        if (value < 50000000) return '#42858B';
        if (value < 60000000) return '#509995';
        if (value < 70000000) return '#5EAC9E';
        if (value < 80000000) return '#6CBFA7';
        if (value < 90000000) return '#79D2B0';
        if (value < 100000000) return '#87E6BA';
        return '#95F9C3';
    };



    const kabHighlightFeature = (e) => {
        const layer = e.target;
        layer.setStyle({
            weight: 3,
            color: 'white',
        });
        layer.bringToFront();
    };

    const kabResetHighlight = (e) => {
        const layer = e.target;
        layer.setStyle({
          weight: 1,
          color: 'lightgrey',
        });
    };

    const onEachKabFeature = (feature, layer) => {
        const featureLatLng = {
            lat: feature.properties.lat,
            lng: feature.properties.lng,
        };

        // Bind tooltip with kab_name (district name)
        layer.bindTooltip(
            `${feature.properties.name}`,
            {
                permanent: false,
                direction: 'center',
                className: 'label-tooltip',
            }
        );
        feature.clicked = false; // Add a flag to track if clicked

        layer.on({
            mouseover: (e) => {
                if (!feature.clicked) {
                    kabHighlightFeature(e);
                }
            },
            mouseout: (e) => {
                if (!feature.clicked) {
                    kabResetHighlight(e);
                }
            },
            click: (e) => {
                layer._map.eachLayer((lyr) => {
                    if (lyr.feature && lyr.feature.clicked !== undefined) {
                        lyr.feature.clicked = false;
                        kabResetHighlight({ target: lyr });

                        layer.unbindTooltip();
                        layer.bindTooltip(
                            `${feature.properties.name}`,
                            {
                                permanent: false,
                                direction: 'center',
                                className: 'label-tooltip',
                            }
                        );
                    }
                });

                const kab_name = feature.properties.name;
                // check kabDataset availability
                if (kabDataset) {
                    setDisplayKab(kabDataset, kab_name)
                } else {
                    console.log('kabDataset is still null when layer clicked');
                }

                kabHighlightFeature(e);
                feature.clicked = true;
                console.log('kab clicked: ' + JSON.stringify(feature.properties, null, 2));

                layer.unbindTooltip(); // Unbind the existing tooltip
                layer.bindTooltip(
                    `${feature.properties.name}`,
                    {
                        permanent: true,
                        className: 'label-tooltip',
                    }
                );
            },
        });
    };

    return kabDataset ? (
        <GeoJSON key={data?.id} data={data} style={kabStyle} onEachFeature={onEachKabFeature} />
    ) : (
        <div>Loading...</div>
    )
}
