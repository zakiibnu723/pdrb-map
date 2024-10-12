import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const populationFilePath = path.join(__dirname, 'RAW_dataset/kab_jumlah_penduduk.json'); // Population JSON
const pdrbFilePath = path.join(__dirname, 'FORMATTED_dataset/dataset_kab.json'); // PDRB JSON
const outputPopulationFilePath = path.join(__dirname, 'jumlah_penduduk_kab.json'); // Output updated jumlah penduduk file
const outputPdrbPerCapitaFilePath = path.join(__dirname, 'pdrb_perkapita_kab.json'); // Output PDRB per capita file

// Utility function to normalize kab_name/kabkot to handle differences
function normalizeKabName(name) {
  return name
    .toLowerCase() // Convert to lowercase
    .replace(/\b(kabupaten|kab\.?|kotamadya)\b/g, '') // Remove prefixes
    .replace(/\s+/g, '') // Remove all whitespace
    .replace(/[-]+/g, '') // Remove hyphens
    .replace(/[^\w]/g, ''); // Remove any non-word characters, if needed
}

// Main function to merge and calculate PDRB per capita
function calculatePDRBPerCapita() {
  try {
    // Read and parse both JSON files
    const populationDataRaw = fs.readFileSync(populationFilePath, 'utf-8');
    const pdrbDataRaw = fs.readFileSync(pdrbFilePath, 'utf-8');

    const populationData = JSON.parse(populationDataRaw);
    const pdrbData = JSON.parse(pdrbDataRaw);

    // Create the result structure for PDRB per capita
    const pdrbPerCapitaResult = {
      var: ['PDRB Per Kapita Konstan Kabupaten/Kota', 'PDRB Per Kapita Berlaku Kabupaten/Kota'],
      vervar: [] // Removed units and tahun from here
    };

    // Create the updated population result structure
    const updatedPopulationResult = {
      var: ['Jumlah Penduduk'],
      vervar: [] // Removed units and tahun from here
    };

    // Loop through each entry in the PDRB data
    pdrbData.vervar.forEach(entry => {
      const kabName = normalizeKabName(entry.kab_name);
      const provName = entry.prov_name;

      // Find matching population data by kabkot
      const matchingPopulationData = populationData.data.filter(populationEntry => {
        const kabkot = normalizeKabName(populationEntry.kabkot);
        return kabName === kabkot;
      });

      if (matchingPopulationData.length === 0) {
        console.log(`❌ No matching population data found for: ${entry.kab_name} (${provName})`);
        return; // Skip if no matching population data
      }

      // Extract relevant years from PDRB data (2018-2023)
      const pdrbKonstan = entry.data.pdrb_konstan.slice(-6); // Last 6 years (2018-2023)
      const pdrbBerlaku = entry.data.pdrb_berlaku.slice(-6);

      // Prepare arrays to store PDRB per capita values
      const pdrbPerCapitaKonstan = [];
      const pdrbPerCapitaBerlaku = [];
      const updatedPopulationByYear = [];

      // Flag to track if any population data is missing
      let hasError = false;

      // Calculate PDRB per capita for each year (2018-2023)
      ['2018', '2019', '2020', '2021', '2022', '2023'].forEach((year, index) => {
        const populationForYear = matchingPopulationData.find(item => item.tahun === year);
        const population = populationForYear ? parseInt(populationForYear.jumlah_penduduk, 10) : null;

        if (population && population > 0) {
          // Calculate PDRB per capita (Konstan and Berlaku)
          const perCapitaKonstan = pdrbKonstan[index] / population;
          const perCapitaBerlaku = pdrbBerlaku[index] / population;

          pdrbPerCapitaKonstan.push(perCapitaKonstan.toFixed(2)); // Rounded to 2 decimal places
          pdrbPerCapitaBerlaku.push(perCapitaBerlaku.toFixed(2));

          updatedPopulationByYear.push(population); // Store the population
        } else {
          // If population data is missing, log an error and fill with null
          pdrbPerCapitaKonstan.push(null);
          pdrbPerCapitaBerlaku.push(null);
          updatedPopulationByYear.push(null);
          hasError = true; // Set error flag
        }
      });

      if (hasError) {
        console.log(`⚠️ Processed with issues for: ${entry.kab_name} (${provName})`);
      } else {
        console.log(`✅ Successfully processed: ${entry.kab_name} (${provName})`);
      }

      // Add the PDRB per capita result for this kabupaten
      pdrbPerCapitaResult.vervar.push({
        kab_name: entry.kab_name,
        prov_name: provName,
        units: ['Juta Rupiah', 'Juta Rupiah'], // Moved units here
        tahun: ['2018', '2019', '2020', '2021', '2022', '2023'], // Moved tahun here
        data: {
          pdrb_perkapita_konstan: pdrbPerCapitaKonstan,
          pdrb_perkapita_berlaku: pdrbPerCapitaBerlaku
        }
      });

      // Add the updated population data for this kabupaten
      updatedPopulationResult.vervar.push({
        kab_name: entry.kab_name,
        prov_name: provName,
        units: ['Orang'], // Moved units here
        tahun: ['2018', '2019', '2020', '2021', '2022', '2023'], // Moved tahun here
        data: updatedPopulationByYear
      });
    });

    // Write the updated population result to a new JSON file
    fs.writeFileSync(outputPopulationFilePath, JSON.stringify(updatedPopulationResult, null, 2), 'utf-8');
    console.log(`✅ Updated population data written to ${outputPopulationFilePath}`);

    // Write the PDRB per capita result to a new JSON file
    fs.writeFileSync(outputPdrbPerCapitaFilePath, JSON.stringify(pdrbPerCapitaResult, null, 2), 'utf-8');
    console.log(`✅ PDRB per capita data written to ${outputPdrbPerCapitaFilePath}`);
  } catch (error) {
    console.error('Error processing data:', error);
  }
}

// Execute the PDRB per capita calculation
calculatePDRBPerCapita();
