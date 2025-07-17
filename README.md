# SesliAsk.NeT - Real-time Voice Chat Application

🎙️ Modern, real-time voice and video chat application built with React, Node.js, and WebRTC.

## 🌟 Features

- **Real-time Voice & Video Chat** - WebRTC powered communication
- **Multiple Chat Rooms** - Join different themed rooms
- **User Authentication** - Member and guest support
- **Live Typing Indicators** - See who's typing in real-time
- **Profile Management** - Avatar, nickname, and settings
- **Room Themes** - Customizable room designs
- **Mobile Responsive** - Works on all devices
- **Production Ready** - Security, logging, and error handling

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser with WebRTC support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sesliask.git
   cd sesliask
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   cd ..
   ```

3. **Setup environment variables**
   ```bash
   # Backend
   cp backend/.env.example backend/.env
   
   # Frontend
   cp frontend/.env.example frontend/.env
   ```

4. **Setup database**
   ```bash
   cd backend
   npm run migrate
   cd ..
   ```

5. **Run development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000
   - Health check: http://localhost:5000/api/health

## 🏭 Production Deployment

### Vercel Deployment (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Environment Variables**
   Set in Vercel dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://your-domain.vercel.app`
   - `FRONTEND_URL=https://your-domain.vercel.app`

### Automated Deployment

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

### Manual Deployment

1. **Build frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start backend**
   ```bash
   cd backend
   NODE_ENV=production npm start
   ```

3. **Serve frontend**
   - Serve the `frontend/dist` folder with nginx, Apache, or any static file server

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CORS_ORIGIN=https://yourdomain.com
```

#### Frontend (.env)
```env
VITE_API_URL=https://yourapi.com/api
VITE_SOCKET_URL=https://yourapi.com
VITE_APP_NAME=SesliAsk.NeT
VITE_APP_VERSION=1.0.0
```

## 📁 Project Structure

```
sesliask/
├── backend/
│   ├── scripts/
│   │   └── migrate.js          # Database migration
│   ├── index.js                # Main server file
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main React component
│   │   ├── index.css
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   └── .env.example
├── deploy.sh                   # Deployment script
├── docker-compose.yml          # Docker configuration
├── Dockerfile                  # Docker build instructions
└── README.md
```

## 🛡️ Security Features

- **Helmet.js** - Security headers
- **Rate Limiting** - API protection
- **CORS** - Cross-origin control
- **Input Validation** - Data sanitization
- **Environment Variables** - Secret management
- **Error Handling** - Secure error responses

## 🔌 API Endpoints

### Authentication
- `POST /api/check-username` - Check if username exists
- `POST /api/login` - User login

### Profile Management
- `POST /api/profile` - Get user profile
- `POST /api/change-password` - Change password
- `POST /api/change-nickname` - Change nickname
- `POST /api/change-avatar` - Change avatar
- `POST /api/freeze-account` - Freeze account

### System
- `GET /api/health` - Health check
- `GET /` - Server status

## 🔄 Socket.io Events

### Client to Server
- `joinRoom` - Join a chat room
- `leaveRoom` - Leave a chat room
- `chatMessage` - Send chat message
- `userTyping` - Typing indicator
- `signaling` - WebRTC signaling

### Server to Client
- `room-users` - Room user list
- `user-joined` - User joined room
- `user-left` - User left room
- `chatMessage` - Receive chat message
- `userTyping` - Typing indicator
- `signaling` - WebRTC signaling

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Logs
- Development: Console output
- Production: `logs/` directory

### PM2 Support
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start backend/index.js --name sesliask-backend

# Monitor
pm2 monit
```

## 🐛 Troubleshooting

### Common Issues

1. **WebRTC not working**
   - Ensure HTTPS in production
   - Check firewall settings
   - Verify STUN server connectivity

2. **Database errors**
   - Run migration: `npm run migrate`
   - Check file permissions
   - Verify SQLite installation

3. **CORS errors**
   - Update `CORS_ORIGIN` in backend .env
   - Check frontend API URL configuration

### Debug Mode

```bash
# Backend debug
DEBUG=* npm run dev

# Frontend debug
npm run dev -- --debug
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **React** - Frontend framework
- **Node.js** - Backend runtime
- **Socket.io** - Real-time communication
- **WebRTC** - Peer-to-peer communication
- **SQLite** - Database
- **TailwindCSS** - Styling

---

**Made with ❤️ for the Turkish chat community**# chatingapp
