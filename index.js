// hotel-bot.js - Tu chatbot completo en una sola página
const express = require('express');
const fetch = require('node-fetch');
const app = express();

// Middleware
app.use(express.json());

// ==========================================
// CONFIGURACIÓN - Cambiar por tus datos
// ==========================================

const CONFIG = {
  // Tu API key de Claude (conseguir en console.anthropic.com)
  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY, // CAMBIAR
  
  // Tokens de WhatsApp Business (conseguir en developers.facebook.com)
  WHATSAPP_TOKEN: 'EAABwzLixnjYBAxxxxxxxx', // CAMBIAR
  VERIFY_TOKEN: 'HotelBot2024', // Puedes cambiarlo
  
  // IDs de teléfono de WhatsApp Business
  PHONE_ID_HOTEL_A: '1234567890123456', // CAMBIAR
  PHONE_ID_HOTEL_B: '6543210987654321', // CAMBIAR
};

// ==========================================
// BASE DE CONOCIMIENTO - Pegar tu PDF aquí
// ==========================================

const HOTEL_A_KNOWLEDGE = `
HOTEL GRAND PLAZA - BASE DE CONOCIMIENTO

INFORMACIÓN GENERAL:
- Nombre: Hotel Grand Plaza
- Dirección: Av. Reforma 123, Polanco, Ciudad de México
- Teléfono: +52 55 1234 5678
- Check-in: 15:00 hrs
- Check-out: 12:00 hrs
- WiFi: "GrandPlaza_Guest" / Contraseña: "Welcome2024"

RESTAURANTES:
- Restaurant La Terraza: 6:00-23:00 hrs diario
  * Desayuno: 6:00-11:00 hrs
  * Almuerzo: 12:00-16:00 hrs
  * Cena: 18:00-23:00 hrs
  * Reservaciones: Ext. 2501

- Bar Skyline: 17:00-01:00 hrs (L-J), 17:00-02:00 hrs (V-S)
  * Happy Hour: 17:00-19:00 hrs (L-V)
  * Ubicación: Piso 15

SERVICIOS:
- Piscina: 6:00-22:00 hrs (Piso 8)
- Spa Serenity: 9:00-21:00 hrs
- Gimnasio: 24 horas
- Room Service: 24 horas - Ext. 2201

CONTACTOS DEPARTAMENTOS:
- Recepción: Ext. 2001 / WhatsApp +52 55 1111 2222
- Mantenimiento: Ext. 2601 / WhatsApp +52 55 7777 8888
- Housekeeping: Ext. 2301 / WhatsApp +52 55 5555 6666
- Concierge: Ext. 2401 / WhatsApp +52 55 3333 4444
`;

const HOTEL_B_KNOWLEDGE = `
HOTEL COSTA AZUL - BASE DE CONOCIMIENTO

INFORMACIÓN GENERAL:
- Nombre: Hotel Costa Azul
- Dirección: Blvd. Costero 456, Zona Hotelera, Cancún
- Teléfono: +52 998 987 6543
- Check-in: 15:00 hrs
- Check-out: 12:00 hrs
- WiFi: "CostaAzul_Guest" / Contraseña: "Paradise2024"

RESTAURANTES:
- Restaurant Mariscos del Mar: 7:00-23:00 hrs diario
  * Desayuno: 7:00-11:00 hrs
  * Almuerzo: 12:00-16:00 hrs
  * Cena: 18:00-23:00 hrs
  * Especialidad: Mariscos frescos

- Beach Bar: 10:00-24:00 hrs diario
  * Ubicación: Junto a la piscina
  * Cocteles tropicales

SERVICIOS:
- Piscina: 6:00-23:00 hrs (Vista al mar)
- Spa del Mar: 8:00-20:00 hrs
- Gimnasio: 24 horas
- Room Service: 24 horas - Ext. 3301

CONTACTOS DEPARTAMENTOS:
- Recepción: Ext. 3001 / WhatsApp +52 998 111 2222
- Mantenimiento: Ext. 3601 / WhatsApp +52 998 777 8888
- Housekeeping: Ext. 3301 / WhatsApp +52 998 555 6666
- Concierge: Ext. 3401 / WhatsApp +52 998 333 4444
`;

// ==========================================
// FUNCIÓN PRINCIPAL - CONSULTAR IA
// ==========================================

async function consultarIA(mensaje, hotel) {
  const knowledge = hotel === 'a' ? HOTEL_A_KNOWLEDGE : HOTEL_B_KNOWLEDGE;
  const hotelName = hotel === 'a' ? 'Hotel Grand Plaza' : 'Hotel Costa Azul';
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.CLAUDE_API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307', // Modelo más barato
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `
            Eres el asistente virtual oficial del ${hotelName}.
            
            INSTRUCCIONES:
            - Responde como un concierge profesional y amable
            - Detecta el idioma del mensaje y responde en el mismo idioma
            - Si necesitas derivar a un departamento, proporciona el WhatsApp correspondiente
            - Mantén respuestas concisas (máximo 3 párrafos)
            - Nunca menciones que eres IA o bot
            
            INFORMACIÓN DEL HOTEL:
            ${knowledge}
            
            PREGUNTA DEL HUÉSPED: ${mensaje}
            
            RESPUESTA:
          `
        }]
      })
    });

    const data = await response.json();
    
    if (data.content && data.content[0]) {
      return data.content[0].text;
    } else {
      throw new Error('No se recibió respuesta válida de la IA');
    }
    
  } catch (error) {
    console.error('Error consultando IA:', error);
    return 'Disculpa, tengo un problema técnico. Por favor contacta recepción directamente. 📞';
  }
}

// ==========================================
// FUNCIÓN - ENVIAR WHATSAPP
// ==========================================

async function enviarWhatsApp(to, message, hotel) {
  const phoneId = hotel === 'a' ? CONFIG.PHONE_ID_HOTEL_A : CONFIG.PHONE_ID_HOTEL_B;
  
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      })
    });

    const data = await response.json();
    console.log('WhatsApp enviado:', data);
    return data;
    
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    throw error;
  }
}

// ==========================================
// WEBHOOK - VERIFICACIÓN DE WHATSAPP
// ==========================================

app.get('/webhook/:hotel', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === CONFIG.VERIFY_TOKEN) {
    console.log('Webhook verificado para hotel:', req.params.hotel);
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Verificación fallida');
  }
});

// ==========================================
// WEBHOOK - RECIBIR MENSAJES
// ==========================================

app.post('/webhook/:hotel', async (req, res) => {
  const hotel = req.params.hotel; // 'a' o 'b'
  
  try {
    const body = req.body;
    
    // Verificar que hay mensajes
    if (body.entry && body.entry[0] && body.entry[0].changes && body.entry[0].changes[0]) {
      const change = body.entry[0].changes[0];
      
      if (change.value && change.value.messages && change.value.messages[0]) {
        const message = change.value.messages[0];
        const from = message.from;
        const messageBody = message.text ? message.text.body : '';
        
        console.log(`Mensaje recibido en hotel ${hotel.toUpperCase()}: ${messageBody}`);
        
        // Ignorar mensajes del propio bot
        if (message.type === 'text' && messageBody) {
          // Consultar IA
          const respuestaIA = await consultarIA(messageBody, hotel);
          
          // Enviar respuesta
          await enviarWhatsApp(from, respuestaIA, hotel);
          
          console.log('Respuesta enviada exitosamente');
        }
      }
    }
    
    res.status(200).send('OK');
    
  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).send('Error interno');
  }
});

// ==========================================
// ENDPOINT DE PRUEBA
// ==========================================

app.get('/test/:hotel', async (req, res) => {
  const hotel = req.params.hotel;
  const mensaje = req.query.mensaje || '¿Cuáles son los horarios del restaurante?';
  
  try {
    const respuesta = await consultarIA(mensaje, hotel);
    res.json({
      hotel: hotel === 'a' ? 'Hotel Grand Plaza' : 'Hotel Costa Azul',
      pregunta: mensaje,
      respuesta: respuesta
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// INFORMACIÓN DEL BOT
// ==========================================

app.get('/', (req, res) => {
  res.json({
    bot: 'Hotel Chatbot',
    version: '1.0',
    hotels: {
      a: 'Hotel Grand Plaza',
      b: 'Hotel Costa Azul'
    },
    endpoints: {
      webhook_a: '/webhook/a',
      webhook_b: '/webhook/b',
      test_a: '/test/a?mensaje=hola',
      test_b: '/test/b?mensaje=hello'
    },
    status: 'Funcionando ✅'
  });
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🤖 Hotel Chatbot iniciado en puerto ${PORT}`);
  console.log(`🏨 Hotel A: http://localhost:${PORT}/webhook/a`);
  console.log(`🏖️ Hotel B: http://localhost:${PORT}/webhook/b`);
  console.log(`🧪 Test: http://localhost:${PORT}/test/a?mensaje=hola`);
});

// ==========================================
// EXPORTAR PARA VERCEL
// ==========================================

module.exports = app;