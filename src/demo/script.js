// Contoh data historis (10 tahun terakhir)
const historicalData = [
    { year: 2013, pdrbKonstan: 1000, pdrbBerlaku: 1050, unemployment: 5.0, investment: 200 },
    { year: 2014, pdrbKonstan: 1100, pdrbBerlaku: 1150, unemployment: 4.8, investment: 250 },
    { year: 2015, pdrbKonstan: 1200, pdrbBerlaku: 1250, unemployment: 4.5, investment: 300 },
    { year: 2016, pdrbKonstan: 1300, pdrbBerlaku: 1350, unemployment: 4.2, investment: 350 },
    { year: 2017, pdrbKonstan: 1400, pdrbBerlaku: 1450, unemployment: 4.0, investment: 400 },
    { year: 2018, pdrbKonstan: 1500, pdrbBerlaku: 1550, unemployment: 3.8, investment: 450 },
    { year: 2019, pdrbKonstan: 1600, pdrbBerlaku: 1650, unemployment: 3.6, investment: 500 },
    { year: 2020, pdrbKonstan: 1550, pdrbBerlaku: 1600, unemployment: 4.5, investment: 400 },
    { year: 2021, pdrbKonstan: 1700, pdrbBerlaku: 1750, unemployment: 4.0, investment: 550 },
    { year: 2022, pdrbKonstan: 1800, pdrbBerlaku: 1850, unemployment: 3.5, investment: 600 },
];

// Memisahkan data untuk pelatihan
const inputData = historicalData.map(data => [data.pdrbKonstan, data.unemployment, data.investment]);
const outputDataKonstan = historicalData.map(data => data.pdrbKonstan);
const outputDataBerlaku = historicalData.map(data => data.pdrbBerlaku);

// Membuat model TensorFlow.js
const modelKonstan = tf.sequential();
modelKonstan.add(tf.layers.dense({ inputShape: [3], units: 10, activation: 'relu' }));
modelKonstan.add(tf.layers.dense({ units: 1 }));

const modelBerlaku = tf.sequential();
modelBerlaku.add(tf.layers.dense({ inputShape: [3], units: 10, activation: 'relu' }));
modelBerlaku.add(tf.layers.dense({ units: 1 }));

modelKonstan.compile({ optimizer: 'adam', loss: 'meanSquaredError' });
modelBerlaku.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

// Fungsi untuk melatih model
async function trainModel() {
    const xs = tf.tensor2d(inputData);
    const ysKonstan = tf.tensor2d(outputDataKonstan, [outputDataKonstan.length, 1]);
    const ysBerlaku = tf.tensor2d(outputDataBerlaku, [outputDataBerlaku.length, 1]);

    await modelKonstan.fit(xs, ysKonstan, { epochs: 200 });
    await modelBerlaku.fit(xs, ysBerlaku, { epochs: 200 });

    console.log("Model trained.");
}

// Fungsi untuk melakukan prediksi
async function predictNextYear() {
    const lastYearData = historicalData[historicalData.length - 1];
    const input = tf.tensor2d([[lastYearData.pdrbKonstan, lastYearData.unemployment, lastYearData.investment]]);
    
    const predictionKonstan = modelKonstan.predict(input);
    const predictionBerlaku = modelBerlaku.predict(input);

    const resultKonstan = await predictionKonstan.data();
    const resultBerlaku = await predictionBerlaku.data();

    return {
        pdrbKonstan: resultKonstan[0],
        pdrbBerlaku: resultBerlaku[0],
    };
}

// Menangani klik tombol prediksi
document.getElementById('predict-btn').addEventListener('click', async () => {
    const prediction = await predictNextYear();
    document.getElementById('result').innerText = `Prediksi PDRB Konstan: ${prediction.pdrbKonstan.toFixed(2)} triliun IDR\nPrediksi PDRB Berlaku: ${prediction.pdrbBerlaku.toFixed(2)} triliun IDR`;
});

// Melatih model saat halaman dimuat
trainModel();
