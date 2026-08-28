const axios = require('axios');
const cheerio = require('cheerio');

async function testScraping() {
  const url = 'https://www.efe.cl/nuestros-servicios/limache-puerto/servicio-y-trazado/bus-limache-olmue/';
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      }
    });

    const $ = cheerio.load(response.data);
    
    // Solo extraer y limpiar todo el texto para ver si contiene información del bus
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Escribimos el resultado a consola o archivo
    console.log(bodyText.substring(bodyText.indexOf('¡Aprovecha la combinación Tren + Bus!'), bodyText.indexOf('¡Aprovecha la combinación Tren + Bus!') + 3000));

  } catch (error) {
    console.error('Error al hacer scraping:', error);
  }
}

testScraping();
