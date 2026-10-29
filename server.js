const express = require('express');
const http = require('http');
const path = require('path');
const QRCode = require('qrcode');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 12e6,
  cors: { origin: true }
});

const PORT = Number(process.env.PORT) || 3000;
const siteDir = path.join(__dirname, 'public', 'site');
const gameDir = path.join(__dirname, 'public', 'games', 'sac-mau');

app.set('trust proxy', true);

// Trang chủ Lớp học Sứa Taho
app.use(express.static(siteDir));
app.get('/', (req, res) => {
  res.sendFile(path.join(siteDir, 'index.html'));
});

// Game Sắc màu của em
app.use('/games/sac-mau', express.static(gameDir, { index: false }));
app.get('/games/sac-mau', (req, res) => {
  res.sendFile(path.join(gameDir, 'tv.html'));
});
app.get('/games/sac-mau/tv', (req, res) => {
  res.sendFile(path.join(gameDir, 'tv.html'));
});
app.get('/games/sac-mau/draw', (req, res) => {
  res.sendFile(path.join(gameDir, 'draw.html'));
});

app.get('/games/sac-mau/api/qr', async (req, res) => {
  const proto = String(req.headers['x-forwarded-proto'] || req.protocol || 'https')
    .split(',')[0]
    .trim();
  const drawUrl = `${proto}://${req.get('host')}/games/sac-mau/draw`;
  const qr = await QRCode.toDataURL(drawUrl, { width: 420, margin: 1 });
  res.json({ drawUrl, qr });
});

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

io.on('connection', (socket) => {
  socket.on('tv:join', () => socket.join('tv'));
  socket.on('artwork:new', (data) => {
    if (data?.imageData) io.to('tv').emit('artwork:new', data);
  });
  socket.on('tv:clear', () => io.to('tv').emit('tv:clear'));
});

server.listen(PORT, '0.0.0.0');
