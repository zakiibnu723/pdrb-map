import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Simulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const pdrbPerkapitaProvFilePath = path.join(__dirname, 'RAW_dataset/pdrb_perkapita_prov.json'); // PDRB JSON
const pdrbPerkapitaJson = JSON.parse(fs.readFileSync(pdrbPerkapitaProvFilePath, 'utf-8'));

// Utility function to format the data key
const createKey = (vervar, varVal, turvar, tahun, turtahun) => {
    return `${vervar}${varVal}${turvar}${tahun}${turtahun}`;
};

// Extract the PDRB data
const extractPDRBData = (pdrbJson) => {
    const { vervar, var: varList, turvar, tahun, turtahun, datacontent } = pdrbJson;

    const resultProvinsi = {
        "var": ["PDRB Per Kapita Konstan Provinsi", "PDRB Per Kapita Berlaku Provinsi"],
        "vervar": []
    };
    
    const resultIndonesia = {
        "var": ["PDRB Per Kapita Konstan Indonesia", "PDRB Per Kapita Berlaku Indonesia"],
        "vervar": []
    };
    
    vervar.forEach(region => {
        const regionData = {
            prov_name: region.label,
            units: ["Juta Rupiah", "Juta Rupiah"],
            tahun: tahun.map(t => t.label),
            data: {
                pdrb_perkapita_konstan: [],
                pdrb_perkapita_berlaku: []
            }
        };

        tahun.forEach(tahunObj => {
            const konstanKey = createKey(region.val, varList[0].val, turvar[1].val, tahunObj.val, turtahun[0].val);
            const berlakuKey = createKey(region.val, varList[0].val, turvar[0].val, tahunObj.val, turtahun[0].val);

            const konstanValue = datacontent[konstanKey];
            const berlakuValue = datacontent[berlakuKey];

            regionData.data.pdrb_perkapita_konstan.push((konstanValue / 1000).toFixed(2)); // Convert to Juta Rupiah
            regionData.data.pdrb_perkapita_berlaku.push((berlakuValue / 1000).toFixed(2)); // Convert to Juta Rupiah
        });

        if (region.label === 'INDONESIA') {
            resultIndonesia.vervar.push({
                country_name: "INDONESIA",
                data: regionData
            });
        } else {
            resultProvinsi.vervar.push(regionData);
        }
    });

    return { resultProvinsi, resultIndonesia };
};

// Extract the data
const { resultProvinsi, resultIndonesia } = extractPDRBData(pdrbPerkapitaJson);

// Write to files
fs.writeFileSync('pdrb_perkapita_prov.json', JSON.stringify(resultProvinsi, null, 2));
fs.writeFileSync('pdrb_perkapita_indonesia.json', JSON.stringify(resultIndonesia, null, 2));

console.log('Files written successfully!');
