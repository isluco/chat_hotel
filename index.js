const express = require('express');
const app = express();

app.use(express.json());

// Configuración
const CONFIG = {
  CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || 'HotelBot2024',
  PHONE_ID_HOTEL_A: process.env.PHONE_ID_HOTEL_A,
  PHONE_ID_HOTEL_B: process.env.PHONE_ID_HOTEL_B
};

// Endpoint principal
app.get('/', (req, res) => {
  res.json({
    bot: 'Hotel Chatbot',
    version: '1.0',
    status: 'Funcionando ✅',
    timestamp: new Date().toISOString(),
    env_check: {
      claude_key: CONFIG.CLAUDE_API_KEY ? 'Configurado' : 'Falta',
      whatsapp_token: CONFIG.WHATSAPP_TOKEN ? 'Configurado' : 'Falta'
    }
  });
});

// Test endpoint
app.get('/test/:hotel', (req, res) => {
  const hotel = req.params.hotel;
  const mensaje = req.query.mensaje || 'test';
  
  res.json({
    hotel: hotel === 'a' ? 'Hotel Grand Plaza' : 'Hotel Costa Azul',
    pregunta: mensaje,
    respuesta: 'Bot funcionando - próximo paso: integrar IA',
    config_status: CONFIG.CLAUDE_API_KEY ? 'API Key OK' : 'API Key falta'
  });
});

// Webhooks
app.get('/webhook/:hotel', (req, res) => {
  const challenge = req.query['hub.challenge'];
  const token = req.query['hub.verify_token'];
  
  if (token === CONFIG.VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Token incorrecto');
  }
});

app.post('/webhook/:hotel', (req, res) => {
  console.log('Mensaje recibido:', req.body);
  res.status(200).send('OK');
});

module.exports = app;