import './dataVisual.css';
import React, { useEffect, useRef } from 'react';

export default function DataVisual({ displayData, dataFrequency, setDataFrequency }) {
  const chartRef1 = useRef(null); // First chart reference
  const chartRef2 = useRef(null); // Second chart reference


  const prepareData = (provData) => {
    const pdrbDataKonstan = provData.data.pdrb_konstan.PDRB.filter(value => value !== "Data not available");
    const pdrbDataBerlaku = provData.data.pdrb_berlaku.PDRB.filter(value => value !== "Data not available");

    const inputData = [];
    const outputDataKonstan = [];
    const outputDataBerlaku = [];

    // Prepare input and output for the model
    for (let i = 0; i < pdrbDataKonstan.length - 3; i++) {
      inputData.push([
        provData.data.pdrb_konstan.Pengeluaran_Konsumsi_Rumah_Tangga[i],
        provData.data.pdrb_konstan.Pengeluaran_Konsumsi_LNPRT[i],
        provData.data.pdrb_konstan.Pengeluaran_Konsumsi_Pemerintah[i],
        provData.data.pdrb_konstan.Pembentukan_Modal_Tetap_Bruto[i],
        provData.data.pdrb_konstan.Perubahan_Inventori[i],
        provData.data.pdrb_konstan.Net_Ekspor[i]
      ]);

      // Output is the next three years of PDRB for konstan and berlaku
      outputDataKonstan.push([
        pdrbDataKonstan[i + 1],
        pdrbDataKonstan[i + 2],
        pdrbDataKonstan[i + 3]
      ]);
      
      outputDataBerlaku.push([
        pdrbDataBerlaku[i + 1],
        pdrbDataBerlaku[i + 2],
        pdrbDataBerlaku[i + 3]
      ]);
    }

    return { inputData, outputDataKonstan, outputDataBerlaku, pdrbDataKonstan, pdrbDataBerlaku };
  };

  // Function to create and train the model
  const createModel = async (inputData, outputData) => {
    const model = tf.sequential();
    model.add(tf.layers.dense({ inputShape: [inputData[0].length], units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3, activation: 'linear' })); // Output for three years

    model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

    // Prepare tensors
    const xs = tf.tensor2d(inputData);
    const ys = tf.tensor2d(outputData);

    // Train the model
    await model.fit(xs, ys, { epochs: 1000 });
    return model;
  };

   // Function to predict the next three years
   const predictNextThreeYears = async (model, provData, pdrbDataKonstan, pdrbDataBerlaku) => {
    const lastYearIndexKonstan = pdrbDataKonstan.length - 1; // Index for the last year of konstan
    const lastYearIndexBerlaku = pdrbDataBerlaku.length - 1; // Index for the last year of berlaku

    const inputForPrediction = [
      provData.data.pdrb_konstan.Pengeluaran_Konsumsi_Rumah_Tangga[lastYearIndexKonstan - 1],
      provData.data.pdrb_konstan.Pengeluaran_Konsumsi_LNPRT[lastYearIndexKonstan - 1],
      provData.data.pdrb_konstan.Pengeluaran_Konsumsi_Pemerintah[lastYearIndexKonstan - 1],
      provData.data.pdrb_konstan.Pembentukan_Modal_Tetap_Bruto[lastYearIndexKonstan - 1],
      provData.data.pdrb_konstan.Perubahan_Inventori[lastYearIndexKonstan - 1],
      provData.data.pdrb_konstan.Net_Ekspor[lastYearIndexKonstan - 1]
    ];

    const inputTensor = tf.tensor2d([inputForPrediction]);
    const predictionKonstan = model.predict(inputTensor);
    const predictionValuesKonstan = await predictionKonstan.data();

    const inputForPredictionBerlaku = [
      provData.data.pdrb_berlaku.Pengeluaran_Konsumsi_Rumah_Tangga[lastYearIndexBerlaku - 1],
      provData.data.pdrb_berlaku.Pengeluaran_Konsumsi_LNPRT[lastYearIndexBerlaku - 1],
      provData.data.pdrb_berlaku.Pengeluaran_Konsumsi_Pemerintah[lastYearIndexBerlaku - 1],
      provData.data.pdrb_berlaku.Pembentukan_Modal_Tetap_Bruto[lastYearIndexBerlaku - 1],
      provData.data.pdrb_berlaku.Perubahan_Inventori[lastYearIndexBerlaku - 1],
      provData.data.pdrb_berlaku.Net_Ekspor[lastYearIndexBerlaku - 1]
    ];

    const inputTensorBerlaku = tf.tensor2d([inputForPredictionBerlaku]);
    const predictionBerlaku = model.predict(inputTensorBerlaku);
    const predictionValuesBerlaku = await predictionBerlaku.data();

    return {
      predictedKonstan: predictionValuesKonstan,
      predictedBerlaku: predictionValuesBerlaku
    };
  };



  useEffect(() => {
    if (!displayData || !window.Chart) return;

    // Extract time and radiation data
    const labels = displayData.tahun; // Dates for X-axis
    const predictLabels = ['2024', '2025', '2026'] 
    const predictValueKonstan = Array(labels.length - 1).fill(null);
    const predictValueBerlaku = Array(labels.length - 1).fill(null);
    
    
    
    // Data for Chart 1
    const pdrb_konstan = displayData.data.pdrb_konstan.PDRB;
    const pdrb_berlaku = displayData.data.pdrb_berlaku.PDRB;
    predictValueKonstan.push(pdrb_konstan[pdrb_konstan.length - 1])
    predictValueBerlaku.push(pdrb_berlaku[pdrb_berlaku.length - 1])

    // Data for Chart 2
    const konsumsiRumahTangga = displayData.data.pdrb_konstan.Pengeluaran_Konsumsi_Rumah_Tangga;
    const konsumsiLNPRT = displayData.data.pdrb_konstan.Pengeluaran_Konsumsi_LNPRT;
    const konsumsiPemerintah = displayData.data.pdrb_konstan.Pengeluaran_Konsumsi_Pemerintah;
    const modalTetapBruto = displayData.data.pdrb_konstan.Pembentukan_Modal_Tetap_Bruto;
    const perubahanInventori = displayData.data.pdrb_konstan.Perubahan_Inventori;
    const netEkspor = displayData.data.pdrb_konstan.Net_Ekspor;



    const { inputData, outputDataKonstan, outputDataBerlaku, pdrbDataKonstan, pdrbDataBerlaku } = prepareData(displayData);

    // Run the model training and prediction
    const runModel = async () => {
      const model = await createModel(inputData, outputDataKonstan); // Train with konstan output
      const predictions = await predictNextThreeYears(model, displayData, pdrbDataKonstan, pdrbDataBerlaku);

      predictValueKonstan.push(...predictions.predictedKonstan)
      predictValueBerlaku.push(...predictions.predictedBerlaku)
      console.log(`Prediksi PDRB Konstan untuk tiga tahun ke depan: ${predictions.predictedKonstan}`);
      console.log(`Prediksi PDRB Berlaku untuk tiga tahun ke depan: ${predictions.predictedBerlaku}`);

      updateChart()
      // You can now use predictedValues to update your charts or state as needed
    };

    runModel();

    
    const updateChart = () => {
      if (window.myChart1) {
        window.myChart1.destroy();
      }
      if (window.myChart2) {
        window.myChart2.destroy();
      }
  
      // Create Chart 1
      const ctx1 = chartRef1.current.getContext('2d');
      window.myChart1 = new window.Chart(ctx1, {
        type: 'line',
        data: {
          labels: [...labels, ...predictLabels], // X-axis labels (dates)
          datasets: [
            {
              label: 'PDRB Waktu Berlaku',
              data: pdrb_berlaku,
              borderColor: '#00FFEE',
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              borderWidth: 1,
              pointRadius: 0,
              pointHoverRadius: 2,
            },
            {
              label: 'PDRB Waktu Konstan',
              data: pdrb_konstan,
              borderColor: '#8800FF',
              backgroundColor: 'rgba(136, 0, 255, 0.271)',
              borderWidth: 1,
              pointRadius: 0,
              pointHoverRadius: 2,
            },
            {
              label: 'Prediksi PDRB Waktu Berlaku',
              data: predictValueBerlaku,
              borderColor: 'rgba(255, 0, 200, 1)',
              backgroundColor: 'rgba(255, 0, 200, 0.2)',
              borderWidth: 1,
              pointRadius: 0,
              pointHoverRadius: 2,
            },
            {
              label: 'Prediksi PDRB Waktu Konstan',
              data: predictValueKonstan,
              borderColor: 'rgba(66, 135, 245, 1)',
              backgroundColor: 'rgba(66, 135, 245, 0.2)',
              borderWidth: 1,
              pointRadius: 0,
              pointHoverRadius: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Time',
              },
              ticks: {
                display: true,
                maxTicksLimit: 6,
                beginAtZero: false,
                font: {
                  size: 10,
                },
              },
            },
            y: {
              title: {
                display: true,
                text: 'Million (Rp)',
              },
              ticks: {
                display: true,
                maxTicksLimit: 6,
                beginAtZero: false,
                font: {
                  size: 10,
                  color: 'white',
                },
              },
              suggestedMin: 10,
            },
          },
          interaction: {
            mode: 'nearest',
            intersect: false,
          },
          plugins: {
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
            },
          },
          hover: {
            mode: 'index',
            intersect: false,
          },
        },
      });
  
      // Create Chart 2
      const ctx2 = chartRef2.current.getContext('2d');
      window.myChart2 = new window.Chart(ctx2, {
        type: 'bar', // Change type to 'bar' for the second chart
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Konsumsi Rumah Tangga',
              data: konsumsiRumahTangga,
              backgroundColor: 'rgba(0, 255, 135, 0.2)', // Neon Green
              borderColor: 'rgba(0, 255, 135, 1)',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 3,
            },
            {
              label: 'Konsumsi LNPRT',
              data: konsumsiLNPRT,
              backgroundColor: 'rgba(150, 0, 255, 0.2)', // Neon Purple (changed)
              borderColor: 'rgba(150, 0, 255, 1)',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 3,
            },
            {
              label: 'Konsumsi Pemerintah',
              data: konsumsiPemerintah,
              backgroundColor: 'rgba(66, 135, 245, 0.2)', // Bright Cyan Blue
              borderColor: 'rgba(66, 135, 245, 1)',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 3,
            },
            {
              label: 'Modal Tetap Bruto',
              data: modalTetapBruto,
              backgroundColor: 'rgba(255, 0, 200, 0.2)', // Brighter Neon Magenta (adjusted)
              borderColor: 'rgba(255, 0, 200, 1)',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 3,
            },
            {
              label: 'Perubahan Inventori',
              data: perubahanInventori,
              backgroundColor: 'rgba(66, 245, 191, 0.2)', // Neon Aqua Green
              borderColor: 'rgba(66, 245, 191, 1)',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 3,
            },
            {
              label: 'Net Ekspor',
              data: netEkspor,
              backgroundColor: 'rgba(255, 195, 66, 0.2)', // Neon Orange
              borderColor: 'rgba(255, 238, 46, 0.8)',
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 3,
            },
          ],
          
          
          
          
          
          
          
          
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Time',
              },
              ticks: {
                display: true,
                maxTicksLimit: 6,
                beginAtZero: false,
                font: {
                  size: 10,
                },
              },
            },
            y: {
              title: {
                display: true,
                text: 'Million (Rp)',
              },
              ticks: {
                display: true,
                maxTicksLimit: 6,
                beginAtZero: false,
                font: {
                  size: 10,
                },
              },
            },
          },
          interaction: {
            mode: 'nearest',
            intersect: false,
          },
          plugins: {
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
            },
          },
          hover: {
            mode: 'index',
            intersect: false,
          },
        },
      });
  
      // Cleanup the charts on component unmount
      return () => {
        if (window.myChart1) {
          window.myChart1.destroy();
        }
        if (window.myChart2) {
          window.myChart2.destroy();
        }
      };
    }

    updateChart()

    // Destroy existing charts if they exist
  }, [displayData]);

  // Ensure displayData is available before accessing properties
  const prov_name = displayData?.prov_name;
  const kab_name = displayData?.kab_name;

  let header;

  if (kab_name) {
    header = (
      <div className="header">
        <h1>{kab_name},</h1>
        <h2>{prov_name}</h2>
      </div>
    );
  } else if (prov_name) {
    header = (
      <div className="header">
        <h1>{prov_name}</h1>
        {/* <p>Total Regency: {displayData?.num_kab}</p> */}
      </div>
    );
  } else {
    header = <div>No data available</div>;
  }

  const handleFrequencyChange = (event) => {
    const newFrequency = event.target.value;
    setDataFrequency(newFrequency);
    console.log('data frequency: ', newFrequency);
  };

  return (
    <>
      <div className="data-visual">
        {header}
        <div className="historical-data">

          <div className="chart-container">
            <p>

            Data PDRB
            </p>
            <canvas className="chart" ref={chartRef1}></canvas> 
          </div>
        </div>
      </div>
      <div className="data-visual2">
        <div className="chart-container">
          <p>

          Data Pengeluaran
          </p>
          <canvas className="chart chart2" ref={chartRef2}></canvas> {/* Second chart */}
        </div>
      </div>
    </>
  );
}
