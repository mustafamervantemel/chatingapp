require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const db = require('./services/database');

// Import database functions
const { getUserByUsername, updateUser } = db;

const app = express();
const server = http.createServer(app);

// Environment variables
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: NODE_ENV === 'production' ? CORS_ORIGIN : '*',
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Logging
if (NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Socket.io configuration
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Database connection test
(async () => {
  try {
    console.log('🔗 Testing Supabase connection...');
    await db.getRooms();
    console.log('✅ Connected to Supabase successfully');
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
  }
})();

// Helper function to generate UUID for guest users
const generateGuestId = () => {
  return 'guest_' + Math.random().toString(36).substr(2, 9);
};

// Error handling middleware
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Kullanıcı adı kayıtlı mı?
app.post('/api/check-username', asyncHandler(async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, error: 'Kullanıcı adı gerekli!' });
  }
  
  const user = await getUserByUsername(username);
  res.json({ exists: !!user, type: user ? 'member' : 'guest' });
}));

// Giriş (şifreli)
app.post('/api/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Kullanıcı adı ve şifre gerekli!' });
  }
  
  const user = await getUserByUsername(username);
  if (user && user.password === password && !user.frozen) {
    res.json({ 
      success: true, 
      user: { 
        username: user.username, 
        gender: user.gender, 
        type: user.type,
        avatar: user.avatar || ''
      } 
    });
  } else if (user && user.frozen) {
    res.json({ success: false, error: 'Hesap dondurulmuş!' });
  } else {
    res.json({ success: false, error: 'Kullanıcı adı veya şifre yanlış!' });
  }
}));

// Kullanıcı profilini getir
app.post('/api/profile', asyncHandler(async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, error: 'Kullanıcı adı gerekli!' });
  }
  
  const user = await getUserByUsername(username);
  if (!user) return res.json({ success: false, error: 'Kullanıcı bulunamadı!' });
  
  res.json({ 
    success: true, 
    user: { 
      username: user.username, 
      gender: user.gender, 
      avatar: user.avatar || '', 
      frozen: !!user.frozen 
    } 
  });
}));

// Şifre değiştir
app.post('/api/change-password', asyncHandler(async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  if (!username || !oldPassword || !newPassword) {
    return res.status(400).json({ success: false, error: 'Tüm alanlar gerekli!' });
  }
  
  const user = await getUserByUsername(username);
  if (!user) return res.json({ success: false, error: 'Kullanıcı bulunamadı!' });
  if (user.password !== oldPassword) return res.json({ success: false, error: 'Mevcut şifre yanlış!' });
  
  await updateUser(username, { password: newPassword });
  res.json({ success: true });
}));

// Rumuz değiştir
app.post('/api/change-nickname', asyncHandler(async (req, res) => {
  const { username, newNickname } = req.body;
  if (!username || !newNickname) {
    return res.status(400).json({ success: false, error: 'Kullanıcı adı ve yeni rumuz gerekli!' });
  }
  
  const user = await getUserByUsername(username);
  if (!user) return res.json({ success: false, error: 'Kullanıcı bulunamadı!' });
  
  // Check if new nickname already exists
  const existingUser = await getUserByUsername(newNickname);
  if (existingUser && existingUser.username !== username) {
    return res.json({ success: false, error: 'Bu rumuz zaten kullanımda!' });
  }
  
  await updateUser(username, { username: newNickname });
  res.json({ success: true, username: newNickname });
}));

// Avatar değiştir
app.post('/api/change-avatar', asyncHandler(async (req, res) => {
  const { username, avatar } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, error: 'Kullanıcı adı gerekli!' });
  }
  
  const user = await getUserByUsername(username);
  if (!user) return res.json({ success: false, error: 'Kullanıcı bulunamadı!' });
  
  await updateUser(username, { avatar });
  res.json({ success: true });
}));

// Hesap dondur
app.post('/api/freeze-account', asyncHandler(async (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ success: false, error: 'Kullanıcı adı gerekli!' });
  }
  
  const user = await getUserByUsername(username);
  if (!user) return res.json({ success: false, error: 'Kullanıcı bulunamadı!' });
  
  await updateUser(username, { frozen: 1 });
  res.json({ success: true });
}));

app.get('/', (req, res) => {
  res.send('Backend çalışıyor!');
});

// WebRTC signaling için oda yönetimi
const roomUsers = {};

io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı:', socket.id);

  // Odaya katıl
  socket.on('joinRoom', ({ roomId, username }) => {
    socket.join(roomId);
    if (!roomUsers[roomId]) roomUsers[roomId] = [];
    roomUsers[roomId].push({ id: socket.id, username });
    // Oda içindeki diğer kullanıcılara yeni kullanıcıyı bildir
    socket.to(roomId).emit('user-joined', { id: socket.id, username });
    // Odaya mevcut kullanıcı listesini gönder
    io.to(socket.id).emit('room-users', roomUsers[roomId]);
  });

  // Odayı terk et
  socket.on('leaveRoom', ({ roomId, username }) => {
    socket.leave(roomId);
    if (roomUsers[roomId]) {
      roomUsers[roomId] = roomUsers[roomId].filter(u => u.id !== socket.id);
      socket.to(roomId).emit('user-left', { id: socket.id, username });
    }
  });

  // WebRTC signaling (offer, answer, candidate)
  socket.on('signaling', ({ to, data }) => {
    io.to(to).emit('signaling', { from: socket.id, data });
  });

  // Chat mesajı
  socket.on('chatMessage', (msg) => {
    io.to(msg.roomId).emit('chatMessage', msg);
  });

  // Typing indicator
  socket.on('userTyping', ({ roomId, username, isTyping }) => {
    socket.to(roomId).emit('userTyping', { username, isTyping });
  });

  socket.on('disconnect', () => {
    // Tüm odalardan çıkar
    for (const roomId in roomUsers) {
      const user = roomUsers[roomId]?.find(u => u.id === socket.id);
      if (user) {
        roomUsers[roomId] = roomUsers[roomId].filter(u => u.id !== socket.id);
        socket.to(roomId).emit('user-left', { id: socket.id, username: user.username });
      }
    }
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: NODE_ENV === 'production' ? 'Sunucu hatası!' : err.message 
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    version: '1.0.0'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ success: false, error: 'Route bulunamadı!' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    db.close((err) => {
      if (err) console.error('Database close error:', err);
      else console.log('Database connection closed');
      process.exit(0);
    });
  });
});

// For Vercel serverless function
if (process.env.VERCEL) {
  module.exports = app;
} else {
  server.listen(PORT, () => {
    console.log(`🚀 Backend sunucusu ${NODE_ENV} modunda ${PORT} portunda çalışıyor`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  });
}

