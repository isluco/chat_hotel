// hotel-chatbot-complete.js - Versión completa del chatbot hotelero
const express = require('express');
const twilio = require('twilio');

const app = express();

// Middleware
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// Importar fetch de forma compatible con Vercel
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// ==========================================
// CONFIGURACIÓN
// ==========================================

const CONFIG = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,        // ← Cambiar esta línea
  WHATSAPP_TOKEN: process.env.WHATSAPP_TOKEN,
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || 'HotelBot2024',
  PHONE_ID_HOTEL_A: process.env.PHONE_ID_HOTEL_A,
  PHONE_ID_HOTEL_B: process.env.PHONE_ID_HOTEL_B
};

// ==========================================
// BASE DE CONOCIMIENTO - HOTEL A
// ==========================================

const HOTEL_A_KNOWLEDGE = `
HOTEL GRAND PLAZA - BASE DE CONOCIMIENTO

INFORMACIÓN GENERAL:
- Nombre: Hotel Grand Plaza
- Dirección: Av. Reforma 123, Polanco, Ciudad de México
- Teléfono Principal: +52 55 1234 5678
- Email: info@hotelgrandplaza.com
- Sitio Web: www.hotelgrandplaza.com
- Check-in: 15:00 hrs
- Check-out: 12:00 hrs
- WiFi: Red "GrandPlaza_Guest" / Contraseña: "Welcome2024"

RESTAURANTES Y BARES:
- Restaurant La Terraza:
  * Horarios: Lunes a Domingo 6:00-23:00 hrs
  * Desayuno: 6:00-11:00 hrs
  * Almuerzo: 12:00-16:00 hrs
  * Cena: 18:00-23:00 hrs
  * Especialidad: Cocina mexicana contemporánea
  * Reservaciones: Ext. 2501
  * Dress Code: Smart casual

- Bar Skyline:
  * Horarios: L-J 17:00-01:00 hrs, V-S 17:00-02:00 hrs
  * Happy Hour: L-V 17:00-19:00 hrs (2x1 cocteles)
  * Ubicación: Piso 15 - Terraza
  * Especialidad: Cocteles premium y vista panorámica

- Café Morning Brew:
  * Horarios: Diario 5:00-14:00 hrs
  * Servicios: Café especialidad, pasteles, snacks
  * Ubicación: Lobby principal

SERVICIOS:
- Piscina: 6:00-22:00 hrs (Piso 8, climatizada)
- Spa Serenity: 9:00-21:00 hrs
  * Reservaciones: Ext. 2801 / WhatsApp +52 55 9876 5432
  * Promoción: 20% descuento L-Mi
- Gimnasio: 24 horas (acceso con tarjeta)
- Business Center: 24 horas (Lobby Mezzanine)
- Room Service: 24 horas - Ext. 2201
- Valet Parking: $150/noche

ACTIVIDADES DIARIAS:
- Lunes: 9:00 Aqua Aeróbicos, 19:00 Música en vivo
- Martes: 10:00 Tour gastronómico, 20:00 Karaoke
- Miércoles: 8:00 Yoga, 18:00 Cata de vinos
- Jueves: 9:00 Clase cocina, 21:00 DJ Set
- Viernes: 10:00 City tour, 19:00 Live Jazz
- Sábado: 9:00 Zumba acuático, 20:00 Noche mexicana
- Domingo: 8:00 Meditación, 18:00 Brunch dominical

CONTACTOS DEPARTAMENTOS:
- Recepción: Ext. 2001 / WhatsApp +52 55 1111 2222
- Concierge: Ext. 2401 / WhatsApp +52 55 3333 4444
- Room Service: Ext. 2201 / WhatsApp +52 55 3333 4444
- Housekeeping: Ext. 2301 / WhatsApp +52 55 5555 6666
- Mantenimiento: Ext. 2601 / WhatsApp +52 55 7777 8888
- Seguridad: Ext. 2701 / WhatsApp +52 55 9999 0000
- Spa: Ext. 2801 / WhatsApp +52 55 9876 5432

EMERGENCIAS:
- Emergencias Médicas: 911 o Ext. 2701
- Médico del hotel: Dr. López +52 55 2468 1357 (24/7)
- Hospital más cercano: Hospital ABC (5km)
- Farmacia 24hrs: Farmacia Guadalajara (2 cuadras)
`;

// ==========================================
// BASE DE CONOCIMIENTO - HOTEL B
// ==========================================

const HOTEL_B_KNOWLEDGE = `
HOTEL COSTA AZUL - BASE DE CONOCIMIENTO

INFORMACIÓN GENERAL:
- Nombre: Hotel Costa Azul
- Dirección: Blvd. Costero 456, Zona Hotelera, Cancún
- Teléfono Principal: +52 998 987 6543
- Email: info@hotelcostaazul.com
- Sitio Web: www.hotelcostaazul.com
- Check-in: 15:00 hrs
- Check-out: 12:00 hrs
- WiFi: Red "CostaAzul_Guest" / Contraseña: "Paradise2024"

RESTAURANTES Y BARES:
- Restaurant Mariscos del Mar:
  * Horarios: Diario 7:00-23:00 hrs
  * Desayuno: 7:00-11:00 hrs
  * Almuerzo: 12:00-16:00 hrs
  * Cena: 18:00-23:00 hrs
  * Especialidad: Mariscos frescos del Caribe
  * Reservaciones: Ext. 3501

- Beach Bar:
  * Horarios: Diario 10:00-24:00 hrs
  * Ubicación: Junto a la piscina
  * Especialidad: Cocteles tropicales
  * Happy Hour: 15:00-17:00 hrs

- Snack Bar Playa:
  * Horarios: 8:00-18:00 hrs
  * Servicios: Snacks, bebidas, helados
  * Ubicación: Playa principal

SERVICIOS:
- Piscina: 6:00-23:00 hrs (Vista al mar)
- Spa del Mar: 8:00-20:00 hrs
  * Reservaciones: Ext. 3801 / WhatsApp +52 998 876 5432
  * Especialidad: Tratamientos con algas marinas
- Gimnasio: 24 horas (Vista al océano)
- Centro de negocios: 8:00-20:00 hrs
- Room Service: 24 horas - Ext. 3301
- Estacionamiento: Gratuito

ACTIVIDADES DIARIAS:
- Lunes: 9:00 Voleibol playa, 20:00 Show folklórico
- Martes: 10:00 Snorkel, 21:00 Noche karaoke
- Miércoles: 8:00 Yoga playa, 19:00 Cata tequila
- Jueves: 9:00 Aqua aeróbicos, 20:00 Música en vivo
- Viernes: 10:00 Tour Chichen Itzá, 21:00 Fiesta playa
- Sábado: 9:00 Pesca deportiva, 20:00 Cena temática
- Domingo: 8:00 Paddleboard, 18:00 BBQ familiar

CONTACTOS DEPARTAMENTOS:
- Recepción: Ext. 3001 / WhatsApp +52 998 111 2222
- Concierge: Ext. 3401 / WhatsApp +52 998 333 4444
- Room Service: Ext. 3301 / WhatsApp +52 998 333 4444
- Housekeeping: Ext. 3301 / WhatsApp +52 998 555 6666
- Mantenimiento: Ext. 3601 / WhatsApp +52 998 777 8888
- Seguridad: Ext. 3701 / WhatsApp +52 998 999 0000
- Spa: Ext. 3801 / WhatsApp +52 998 876 5432

EMERGENCIAS:
- Emergencias Médicas: 911 o Ext. 3701
- Médico del hotel: Dra. Martínez +52 998 246 8135 (24/7)
- Hospital más cercano: Hospital Americano (3km)
- Farmacia 24hrs: Farmacia Similares (1 cuadra)
`;

// ==========================================
// FUNCIÓN PRINCIPAL - CONSULTAR IA
// ==========================================

async function consultarIA(mensaje, hotel) {
  const knowledge = hotel === 'a' ? HOTEL_A_KNOWLEDGE : HOTEL_B_KNOWLEDGE;
  const hotelName = hotel === 'a' ? 'Hotel Grand Plaza' : 'Hotel Costa Azul';
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`,  // ← En lugar de process.env.OPENAI_API_KEY
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: 500,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: `
Eres el asistente virtual oficial del ${hotelName}.

INSTRUCCIONES IMPORTANTES:
- Responde como un concierge profesional y amable
- Detecta automáticamente el idioma del mensaje y responde en el mismo idioma
- Si necesitas derivar a un departamento, proporciona el WhatsApp correspondiente
- Mantén respuestas concisas (máximo 3 párrafos)
- Nunca menciones que eres IA o bot
- Usa emojis apropiados para hoteles (🏨 🍽️ 🏊‍♂️ 📞 etc.)
- Si la pregunta es sobre mantenimiento, housekeeping o problemas, deriva inmediatamente

INFORMACIÓN DEL HOTEL:
${knowledge}

PREGUNTA DEL HUÉSPED: ${mensaje}

RESPUESTA (en el idioma de la pregunta):
          `
        }]
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else if (data.error) {
      console.error('Error de OpenAI API:', data.error);
      return `Disculpa, tengo un problema técnico momentáneo. Por favor contacta recepción directamente al ${hotel === 'a' ? '+52 55 1234 5678' : '+52 998 987 6543'} 📞`;
    } else {
      throw new Error('Respuesta inválida de la IA');
    }
    
  } catch (error) {
    console.error('Error consultando OpenAI:', error);
    const phoneNumber = hotel === 'a' ? '+52 55 1234 5678' : '+52 998 987 6543';
    return `Disculpa, tengo dificultades técnicas. Por favor contacta recepción al ${phoneNumber} para asistencia inmediata 📞`;
  }
}

// ==========================================
// FUNCIÓN - ENVIAR WHATSAPP
// ==========================================

async function enviarWhatsApp(to, message, hotel) {
  const phoneId = hotel === 'a' ? CONFIG.PHONE_ID_HOTEL_A : CONFIG.PHONE_ID_HOTEL_B;
  
  if (!phoneId || !CONFIG.WHATSAPP_TOKEN) {
    console.error('WhatsApp no configurado para hotel:', hotel);
    return { error: 'WhatsApp no configurado' };
  }
  
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
    
    if (data.error) {
      console.error('Error WhatsApp API:', data.error);
      return { error: data.error };
    }
    
    console.log('WhatsApp enviado exitosamente:', data);
    return data;
    
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    return { error: error.message };
  }
}

// ==========================================
// ENDPOINTS PRINCIPALES
// ==========================================

// Información del bot
app.get('/', (req, res) => {
  res.json({
    bot: 'Hotel Chatbot',
    version: '1.0',
    timestamp: new Date().toISOString(),
    hotels: {
      a: 'Hotel Grand Plaza',
      b: 'Hotel Costa Azul'
    },
    endpoints: {
      webhook_a: '/webhook/a',
      webhook_b: '/webhook/b',
      test_a: '/test/a?mensaje=hola',
      test_b: '/test/b?mensaje=hello',
      test_ai_a: '/test-ai/a?mensaje=¿horarios del restaurante?',
      test_ai_b: '/test-ai/b?mensaje=restaurant hours?'
    },
    env_check: {
      openai_key: CONFIG.OPENAI_API_KEY ? 'Configurado ✅' : 'Falta ❌',
      whatsapp_token: CONFIG.WHATSAPP_TOKEN ? 'Configurado ✅' : 'Falta ❌',
      phone_id_a: CONFIG.PHONE_ID_HOTEL_A ? 'Configurado ✅' : 'Falta ❌',
      phone_id_b: CONFIG.PHONE_ID_HOTEL_B ? 'Configurado ✅' : 'Falta ❌'
    },
    status: 'Funcionando ✅'
  });
});

// Test básico sin IA
app.get('/test/:hotel', (req, res) => {
  const hotel = req.params.hotel;
  const mensaje = req.query.mensaje || 'test';
  
  if (hotel !== 'a' && hotel !== 'b') {
    return res.status(400).json({ error: 'Hotel debe ser "a" o "b"' });
  }
  
  res.json({
    hotel: hotel === 'a' ? 'Hotel Grand Plaza' : 'Hotel Costa Azul',
    pregunta: mensaje,
    respuesta: '🤖 Bot funcionando correctamente - versión básica sin IA',
    timestamp: new Date().toISOString(),
    config_status: CONFIG.CLAUDE_API_KEY ? 'API Key OK ✅' : 'API Key falta ❌'
  });
});

// Test con IA completa
app.get('/test-ai/:hotel', async (req, res) => {
  const hotel = req.params.hotel;
  const mensaje = req.query.mensaje || '¿Cuáles son los horarios del restaurante?';
  
  if (hotel !== 'a' && hotel !== 'b') {
    return res.status(400).json({ error: 'Hotel debe ser "a" o "b"' });
  }
  
  if (!CONFIG.OPENAI_API_KEY) {  // ← En lugar de CLAUDE_API_KEY
    return res.status(500).json({ 
      error: 'OpenAI API Key no configurado',  // ← Actualizar mensaje
      hotel: hotel === 'a' ? 'Hotel Grand Plaza' : 'Hotel Costa Azul',
      pregunta: mensaje
    });
  }
  
  try {
    console.log(`Consultando IA para hotel ${hotel.toUpperCase()}: ${mensaje}`);
    
    const respuestaIA = await consultarIA(mensaje, hotel);
    
    res.json({
      hotel: hotel === 'a' ? 'Hotel Grand Plaza' : 'Hotel Costa Azul',
      pregunta: mensaje,
      respuesta_ia: respuestaIA,
      timestamp: new Date().toISOString(),
      status: 'IA funcionando ✅'
    });
    
  } catch (error) {
    console.error('Error en test IA:', error);
    res.status(500).json({
      hotel: hotel === 'a' ? 'Hotel Grand Plaza' : 'Hotel Costa Azul',
      pregunta: mensaje,
      error: 'Error procesando con IA: ' + error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ==========================================
// WEBHOOKS WHATSAPP
// ==========================================

// Verificación de webhook (GET)
app.get('/webhook/:hotel', (req, res) => {
  const hotel = req.params.hotel;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`Verificación webhook hotel ${hotel.toUpperCase()}: mode=${mode}, token=${token}`);

  if (mode === 'subscribe' && token === CONFIG.VERIFY_TOKEN) {
    console.log(`✅ Webhook verificado para hotel ${hotel.toUpperCase()}`);
    res.status(200).send(challenge);
  } else {
    console.log(`❌ Verificación fallida para hotel ${hotel.toUpperCase()}`);
    res.status(403).send('Verificación fallida');
  }
});

// Recibir mensajes de WhatsApp (POST)
app.post('/webhook/:hotel', async (req, res) => {
  const hotel = req.params.hotel;
  
  try {
    const body = req.body;
    console.log(`Webhook recibido en hotel ${hotel.toUpperCase()}:`, JSON.stringify(body, null, 2));
    
    // Verificar estructura del mensaje
    if (body.entry && body.entry[0] && body.entry[0].changes && body.entry[0].changes[0]) {
      const change = body.entry[0].changes[0];
      
      if (change.value && change.value.messages && change.value.messages[0]) {
        const message = change.value.messages[0];
        const from = message.from;
        const messageType = message.type;
        
        console.log(`Mensaje de ${from}, tipo: ${messageType}`);
        
        // Solo procesar mensajes de texto
        if (messageType === 'text' && message.text && message.text.body) {
          const messageBody = message.text.body;
          
          console.log(`📱 Mensaje recibido en hotel ${hotel.toUpperCase()}: "${messageBody}" de ${from}`);
          
          // Verificar que tenemos configuración de IA
          if (!CONFIG.CLAUDE_API_KEY) {
            console.error('Claude API Key no configurado');
            return res.status(200).send('OK');
          }
          
          try {
            // Consultar IA
            const respuestaIA = await consultarIA(messageBody, hotel);
            console.log(`🤖 Respuesta IA generada: ${respuestaIA.substring(0, 100)}...`);
            
            // Enviar respuesta por WhatsApp
            const resultadoWhatsApp = await enviarWhatsApp(from, respuestaIA, hotel);
            
            if (resultadoWhatsApp.error) {
              console.error('Error enviando WhatsApp:', resultadoWhatsApp.error);
            } else {
              console.log(`✅ Respuesta enviada exitosamente a ${from}`);
            }
            
          } catch (error) {
            console.error('Error procesando mensaje:', error);
            
            // Enviar mensaje de error por WhatsApp
            const mensajeError = `Disculpa, tengo dificultades técnicas. Por favor contacta recepción al ${hotel === 'a' ? '+52 55 1234 5678' : '+52 998 987 6543'} 📞`;
            
            try {
              await enviarWhatsApp(from, mensajeError, hotel);
            } catch (errorWhatsApp) {
              console.error('Error enviando mensaje de error:', errorWhatsApp);
            }
          }
        } else {
          console.log('Mensaje no es de texto, ignorando');
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
// ENDPOINT DE HEALTH CHECK
// ==========================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0'
  });
});

// Agregar este endpoint al final del código, antes de module.exports
app.get('/debug-claude/:hotel', async (req, res) => {
  const mensaje = req.query.mensaje || 'test';
  
  try {
    console.log('Testing Claude API...');
    console.log('API Key exists:', !!CONFIG.CLAUDE_API_KEY);
    console.log('API Key format:', CONFIG.CLAUDE_API_KEY ? CONFIG.CLAUDE_API_KEY.substring(0, 15) + '...' : 'null');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.CLAUDE_API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: 'Test message: ' + mensaje
        }]
      })
    });

    const responseText = await response.text();
    console.log('Claude response status:', response.status);
    console.log('Claude response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw_response: responseText };
    }

    res.json({
      status: response.status,
      api_key_configured: !!CONFIG.CLAUDE_API_KEY,
      response_data: data,
      headers: Object.fromEntries(response.headers.entries())
    });

  } catch (error) {
    console.error('Debug error:', error);
    res.json({
      error: error.message,
      api_key_configured: !!CONFIG.CLAUDE_API_KEY,
      stack: error.stack
    });
  }
});

app.post('/webhook/twilio', async (req, res) => {
  try {
    console.log('📦 Webhook recibido en hotel TWILIO:', JSON.stringify(req.body, null, 2));
    
    const { Body, From, To, MessageSid, ProfileName } = req.body;
    
    console.log(`📱 Procesando mensaje de ${ProfileName}: "${Body}"`);
    
    // Validar mensaje
    if (!Body || Body.trim() === '') {
      console.log('⚠️ Mensaje vacío');
      const twiml = new twilio.twiml.MessagingResponse();
      twiml.message('¡Hola! ¿En qué puedo ayudarte? 😊');
      
      res.type('text/xml');
      return res.send(twiml.toString());
    }
    
    // Hotel A por defecto para testing
    const hotel = 'a';
    
    console.log(`🤖 Consultando IA para hotel ${hotel}: "${Body}"`);
    
    // Llamar a tu función de IA
    const respuestaIA = await consultarIA(Body.trim(), hotel);
    
    console.log(`✅ IA respondió: ${respuestaIA.substring(0, 100)}...`);
    
    // Responder por Twilio
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(respuestaIA);
    
    console.log('📤 Enviando respuesta a Twilio...');
    
    res.type('text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('❌ Error en webhook Twilio:', error);
    
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message('Disculpa, problemas técnicos temporales. Intenta de nuevo 🔧');
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Test endpoint para Twilio
app.get('/test-twilio', (req, res) => {
  res.json({
    status: 'Twilio webhook endpoint listo ✅',
    webhook_url: 'https://chat-hotel.vercel.app/webhook/twilio',
    method: 'POST',
    testing: 'Envía mensaje al sandbox de Twilio para probar'
  });
});
// ==========================================
// EXPORTAR PARA VERCEL
// ==========================================

const path = require('path');

// Servir archivos estáticos desde public/
app.use(express.static('public'));

// Ruta principal para el chat
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});





module.exports = app;