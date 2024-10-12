import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the file paths for jsondata1, jsondata2, and geojson
const jsondata1Path = path.join(__dirname, 'RAW_dataset/pdrb_konstan_kab.json');
const jsondata2Path = path.join(__dirname, 'RAW_dataset/pdrb_berlaku_kab.json');
const geojsonPath = path.join(__dirname, '../geojson/kab-34.geojson');


//Normalized name for comparison
function normalizedName(name) {
  return name.toLowerCase().replace(/[-\s]/g, '');
}

// Function to get prov and kab name from geojson data
function importNameFromGeojson(kabName, geojson) {
  const normalizedKabName = normalizedName(kabName)
  const feature = geojson.features.find(f => normalizedName(f.properties.name) === normalizedKabName)
    
  if (feature) {
    console.log(`converted ${kabName} >> ${feature.properties.name}`)
    return {
      kab_name: feature.properties.name,
      prov_name: feature.properties.prov_name
    };
  } else {
    console.log(`failed converted ${kabName}`)
    return {
      kab_name: 'Kab not found',
      prov_name: 'Province not found'
    };
  }
}


// Function to process jsonData
function formatResult(geojson, ...jsonDataArray) {
  const results = {
    var: [],
    vervar: []
  };

   // Add the "var" labels for each dataset
   jsonDataArray.forEach((jsonData) => {
    results.var.push(jsonData.var[0].label);
  });

  // Iterate over each region (vervar) to build the final structure
  jsonDataArray[0].vervar.forEach(region => {
    const importedName = importNameFromGeojson(region.label, geojson);

    const data = {
      pdrb_konstan: {},
      pdrb_berlaku: {},
    };

    // Initialize arrays for years and units
    const units = [];
    const years = [];

    // Function to populate the data for each year, and also get the units and years
    const populateData = (jsonData, dataType) => {
      jsonData.tahun.forEach(year => {
        const regionId = region.val;
        const variableId = jsonData.var[0].val;
        // const pdrbDataId = jsonData.turvar[6].val;
        const yearId = year.val;
        const periodeTypeId = jsonData.turtahun[0].val;


        jsonData.turvar.forEach(turvar => {
          const key = `${regionId}${variableId}${turvar.val}${yearId}${periodeTypeId}`;
          // const data_pengeluaran = data[`${dataType}_pengeluaran`][turvar.label] = [] 
          if (!data[dataType][turvar.label]) {
            data[dataType][turvar.label] = [];
          }

          const data_pengeluaran = jsonData.datacontent[key]
          data[dataType][turvar.label].push(data_pengeluaran || "Data not available")

        })

        // Populate the years and units
        if (dataType === "pdrb_konstan") {
          years.push(year.label); // Ensure the years array is populated only once
        }
      });

      // Collect the units for each type of data (pdrb_konstan, pdrb_berlaku)
      units.push(jsonData.var[0].unit); // Each JSON data has its own unit
    };

    // Populate data for both `pdrb_konstan` and `pdrb_berlaku`
    populateData(jsonDataArray[0], "pdrb_konstan");
    populateData(jsonDataArray[1], "pdrb_berlaku");

    // Add the final formatted result for each kab
    results.vervar.push({
      kab_name: importedName.kab_name || 'Kab not Found',
      prov_name: importedName.prov_name || "Province not found",
      units: units, // Insert the units in the same order as data
      tahun: years, // Insert the years into vervar
      data: data
    });
  });

  return results;
}

// Main function to read all the files and process the data
function main() {
  try {
    // Read all JSON files synchronously
    const jsondata1 = JSON.parse(fs.readFileSync(jsondata1Path, 'utf-8'));
    const jsondata2 = JSON.parse(fs.readFileSync(jsondata2Path, 'utf-8'));
    const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf-8'));

    // Format the results by calling the function
    const formattedData = formatResult(geojson, jsondata1, jsondata2);
    fs.writeFileSync('dataset_kab.json', JSON.stringify(formattedData, null, 2), (err) => {
      if (err) {
        console.error('Error writing processed data:', err);
      } else {
        console.log('Processed data successfully written to pdrb_kab.json');
      }
    });
  } catch (error) {
    console.error('Error reading files:', error);
  }
}

// Call the main function
main();
