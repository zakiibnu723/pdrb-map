// Data historis dari tahun 2010 hingga 2023
const data = {
    "Pengeluaran_Konsumsi_Rumah_Tangga": [
        55438432.71, 56612415.12, 58580993.67,
        60397296.12, 62326263.9, 64201370.35,
        66335056.95, 68571837.95, 71037725.02,
        73746376.37, 73271449.57, 74123833.18,
        76318526.83, 79428836.99
    ],
    "Pengeluaran_Konsumsi_LNPRT": [
        1464586.57, 1517887.16, 1597454.41,
        1763032.88, 2058708.11, 1969097.9,
        2129275.9, 2300610.48, 2395444.68,
        2657158.88, 2565364.42, 2501249.55,
        2629601.48, 2845434.43
    ],
    "Pengeluaran_Konsumsi_Pemerintah": [
        19572175.74, 19913184.14, 21535998.68,
        22688966.87, 23097244.05, 23960168.51,
        19930250.96, 20884412.19, 21730249.82,
        23356672.38, 22204488.91, 22758274.67,
        22319770.12, 22293138.13
    ],
    "Pembentukan_Modal_Tetap_Bruto": [
        29766574.04, 32980775.86, 34901818.78,
        34736027.05, 36571542.84, 37892086.04,
        40598054.96, 39421958.41, 40769450.85,
        43513913.81, 45045624.54, 45438247.72,
        44903555.05, 47544761.46
    ],
    "Perubahan_Inventori": [
        941160.28, 419259.79, 1553962.22,
        -32303.88, 33990.53, -88309.6,
        28661.01, -82506, 155.75,
        8770.42, -239127.54, 87312.06,
        154442.36, 285648.76
    ],
    "Net_Ekspor": [
        -5637692.52, -6569310.91, -9255330.14,
        -7797192.49, -10597390.18, -15268880.93,
        -12646999.88, -9855334.3, -9108660.89,
        -11213271.06, -11266832.73, -9634877.88,
        -5354180.47, -5465397.67
    ],
    "PDRB": [
        101545236.83, 104874211.16, 108914897.62,
        111755826.56, 113490359.26, 112665532.27,
        116374299.89, 121240978.72, 126824365.24,
        132069620.8, 131580967.16, 135274039.3,
        140971715.37, 146932422.11
    ]
};

// Fungsi untuk mempersiapkan data
const prepareData = (data) => {
    const inputs = [];
    const outputs = [];

    for (let i = 0; i < data.PDRB.length; i++) {
        inputs.push([
            data.Pengeluaran_Konsumsi_Rumah_Tangga[i],
            data.Pengeluaran_Konsumsi_LNPRT[i],
            data.Pengeluaran_Konsumsi_Pemerintah[i],
            data.Pembentukan_Modal_Tetap_Bruto[i],
            data.Perubahan_Inventori[i],
            data.Net_Ekspor[i]
        ]);
        outputs.push([data.PDRB[i]]);
    }

    return { inputs, outputs };
};

// Mempersiapkan data
const { inputs, outputs } = prepareData(data);

// Membuat model
const model = tf.sequential();
model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [6] }));
model.add(tf.layers.dense({ units: 1 }));

// Mengkompilasi model
model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });

// Melatih model
const trainModel = async () => {
    const xs = tf.tensor2d(inputs);
    const ys = tf.tensor2d(outputs);
    await model.fit(xs, ys, { epochs: 100 });
    console.log("Model telah dilatih!");
};

// Panggil fungsi pelatihan
trainModel().then(() => {
    console.log("Pelatihan selesai, model siap untuk prediksi.");
});

// Fungsi untuk memprediksi PDRB berdasarkan input estimasi
const predictFuture = async (dataInputs) => {
    const inputTensor = tf.tensor2d([dataInputs]);
    const prediction = model.predict(inputTensor);
    const result = await prediction.data();
    return result[0];
};

// Event listener untuk tombol prediksi
document.getElementById("predictButton").addEventListener("click", async () => {
    const year = document.getElementById("year").value;
    
    // Input estimasi untuk tahun yang dipilih
    const inputs = [
        80000000, // Pengeluaran Konsumsi Rumah Tangga (estimasi)
        3000000,  // Pengeluaran Konsumsi LNPRT (estimasi)
        20000000, // Pengeluaran Konsumsi Pemerintah (estimasi)
        50000000, // Pembentukan Modal Tetap Bruto (estimasi)
        300000,   // Perubahan Inventori (estimasi)
        -6000000  // Net Ekspor (estimasi)
    ];
    
    // Tunggu sampai model selesai dilatih sebelum memprediksi
    const predictedValue = await predictFuture(inputs);
    document.getElementById("result").innerText = `Prediksi PDRB untuk tahun ${year}: ${predictedValue.toFixed(2)}`;
});
