import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the file paths for jsondata1, jsondata2, and geojson
const jsondata1Path = path.join(__dirname, 'RAW_dataset/pdrb_konstan_prov.json');
const jsondata2Path = path.join(__dirname, 'RAW_dataset/pdrb_berlaku_prov.json');
const geojsonPath = path.join(__dirname, '../geojson/prov-34-simplified.geojson');



// Function to process jsonData
// Function to process jsonData
function formatResult(geojson, ...jsonDataArray) {

  const results = {
    var: [],
    vervar: [],
  };

  jsonDataArray.forEach((jsonData) => {
    results.var.push(jsonData.var[0].label);
  });

  // Iterate over each region (vervar) to build the final structure
  jsonDataArray[0].vervar.forEach(region => {

    const data = {
      pdrb_konstan: [],
      pdrb_berlaku: [],
    };

    const units = [];
    const years = [];

    // Function to construct the key and collect the data for each year
    const populateData = (jsonData, dataType) => {
      jsonData.tahun.forEach(year => {
        jsonData.turtahun.forEach((triwulan, index) => {
          if (index < jsonData.turtahun.length - 1) {
            const regionId = region.val;
            const variableId = jsonData.var[0].val;
            const pdrbDataId = jsonData.turvar[13].val;
            const yearId = year.val;
            const periodeTypeId = triwulan.val;
    
            const key = `${regionId}${variableId}${pdrbDataId}${yearId}${periodeTypeId}`;
            
            // Push the data into the corresponding dataType (pdrb_konstan or pdrb_berlaku)
            data[dataType].push(jsonData.datacontent[key] || "Data not available");    
  
            // Collect the years (only do this once for pdrb_konstan)
            if (dataType === "pdrb_konstan") {
              years.push(`${year.label} (${triwulan.label})`);
            }
          }
        })
        
        
      });

      // Collect the units (each jsonDataArray has its own unit for its data)
      units.push(jsonData.var[0].unit);
    };

    // Populate data for both pdrb_konstan and pdrb_berlaku
    populateData(jsonDataArray[0], "pdrb_konstan");
    populateData(jsonDataArray[1], "pdrb_berlaku");

    // Add the final formatted result for each province (vervar)
    results.vervar.push({
      prov_name: region.label || "Province not found",
      units: units,    // Insert the units for both data types
      tahun: years,    // Insert the years for this region
      data: data,      // Insert the pdrb_konstan and pdrb_berlaku data
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
    fs.writeFileSync('dataset_prov_triwulan.json', JSON.stringify(formattedData, null, 2), (err) => {
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
