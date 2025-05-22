const express = require('express');
const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { Storage } = require('megajs');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

let clients = {};
let pairingCodes = {};

app.post('/api/get-code', (req, res) => {
  const { phone } = req.body;
  const code = Math.floor(10000000 + Math.random() * 90000000).toString();
  pairingCodes[phone] = code;
  res.json({ code });
});

app.post('/api/connect', async (req, res) => {
  const { phone, code } = req.body;
  if (pairingCodes[phone] !== code) {
    return res.status(400).json({ error: 'Invalid pairing code' });
  }

  const sessionId = uuidv4();
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: sessionId })
  });

  clients[sessionId] = client;

  client.on('ready', async () => {
    const credsPath = path.join(__dirname, `.wwebjs_auth/session-${sessionId}`);

    const storage = new Storage({
      email: 'sbot7603@gmail.com',
      password: 'sumon@2008'
    });
    await storage.ready;

    const file = await storage.upload(`${sessionId}.json`, fs.createReadStream(path.join(credsPath, 'creds.json')));
    await client.sendMessage(phone + '@c.us', `Your Session ID: ${sessionId}`);
  });

  client.initialize();

  res.json({ sessionId });
});

app.get('/api/get-qr', (req, res) => {
  const sessionId = uuidv4();
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: sessionId })
  });
  clients[sessionId] = client;

  client.on('qr', (qr) => {
    res.json({ qr });
  });

  client.initialize();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
