

async function writeFile(kabName) {
  
  const API_URL = `https://us1.locationiq.com/v1/search?key=pk.3e2d20d7e2fac7f940d17ae2143971ad&q=${kabName}&format=json&`
  const res = await fetch(API_URL)
  const data = await res.json()
  // console.log(data)

  return {
    lat: data[0].lat,
    lng: data[0].lon
  }
  // return (data)
}

async function a() {
  const sleman = await writeFile('KABUPATEN SLEMAN')
  console.log(sleman)
}

a()

