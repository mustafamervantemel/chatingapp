import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

function App() {
  // Tüm useState hook'ları en başta
  const [step, setStep] = useState('login') // 'login' | 'password' | 'chat'
  const [username, setUsername] = useState('')
  const [gender, setGender] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [user, setUser] = useState(null)
  // Panel için state'ler
  const [activeTab, setActiveTab] = useState('oda'); // oda | site | arkadas
  const [search, setSearch] = useState('');
  const [activeRoom, setActiveRoom] = useState(1); // aktif oda id
  const [arkadasTab, setArkadasTab] = useState('arkadaslar'); // arkadaslar | gelen | giden
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { peerId: MediaStream }
  const [peers, setPeers] = useState({}); // { peerId: RTCPeerConnection }
  const [roomUserList, setRoomUserList] = useState([]); // [{id, username}]
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(0);
  const [settings, setSettings] = useState({
    blockPrivate: false,
    blockCalls: false,
    blockOfflineMsg: false,
    muteVibration: false,
    mutePrivateNotif: false,
    showJoinLeave: false,
    showJoinFx: false,
    hideGeneral: false,
    roomHistory: true,
    privateHistory: true,
  });
  const designs = [
    'https://i.ibb.co/0j1n6kB/1.jpg',
    'https://i.ibb.co/0j1n6kB/2.jpg',
    'https://i.ibb.co/0j1n6kB/3.jpg',
    'https://i.ibb.co/0j1n6kB/4.jpg',
    'https://i.ibb.co/0j1n6kB/5.jpg',
    'https://i.ibb.co/0j1n6kB/6.jpg',
    'https://i.ibb.co/0j1n6kB/7.jpg',
    'https://i.ibb.co/0j1n6kB/8.jpg',
    'https://i.ibb.co/0j1n6kB/9.jpg',
    'https://i.ibb.co/0j1n6kB/10.jpg',
  ];
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileTab, setProfileTab] = useState('profilim'); // profilim | sifre | rumuz | ikon | dondur
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [profileUsername, setProfileUsername] = useState(user?.username || '');
  const [showGuestUpgradePopup, setShowGuestUpgradePopup] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [typingTimer, setTypingTimer] = useState(null);

  // Profil modalı açıldığında güncel bilgileri çek
  useEffect(() => {
    if (showProfileMenu && user) {
      fetch(API_URL + '/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setProfileAvatar(data.user.avatar || '');
            setProfileUsername(data.user.username);
          }
        });
    }
  }, [showProfileMenu, user]);

  // Kullanıcı adı kontrolü ve yönlendirme
  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!username || !gender) {
      setError('Kullanıcı adı ve cinsiyet zorunlu!')
      return
    }
    try {
      const res = await fetch(`${API_URL}/check-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      })
      const data = await res.json()
      if (data.exists) {
        setStep('password')
      } else {
        setUser({ username, gender, type: data.type || 'guest' })
        setStep('chat')
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı!')
    }
  }

  // Şifreli giriş
  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!password) {
      setError('Şifre zorunlu!')
      return
    }
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) {
        setUser(data.user)
        setStep('chat')
      } else {
        setError(data.error || 'Giriş başarısız!')
      }
    } catch (err) {
      setError('Sunucuya bağlanılamadı!')
    }
  }

  // Mikrofon aç/kapat
  const handleToggleMic = async () => {
    if (!micOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: camOn });
        setLocalStream(stream);
        setMicOn(true);
        if (camOn && videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        alert('Mikrofon izni alınamadı!');
      }
    } else {
      if (localStream) {
        localStream.getAudioTracks().forEach(track => track.stop());
        if (!camOn) setLocalStream(null);
      }
      setMicOn(false);
    }
  };

  // Kamera aç/kapat
  const handleToggleCam = async () => {
    if (!camOn) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
        setLocalStream(stream);
        setCamOn(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        alert('Kamera izni alınamadı!');
      }
    } else {
      if (localStream) {
        localStream.getVideoTracks().forEach(track => track.stop());
        if (!micOn) setLocalStream(null);
      }
      setCamOn(false);
    }
  };

  // Socket.io bağlantısı ve oda yönetimi
  useEffect(() => {
    if (step !== 'chat' || !user) return;
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_URL);
    }
    const socket = socketRef.current;
    // Odaya katıl
    socket.emit('joinRoom', { roomId: activeRoom, username: user.username });
    // Oda kullanıcı listesini al
    socket.on('room-users', (users) => {
      setRoomUserList(users);
    });
    // Yeni kullanıcı geldi
    socket.on('user-joined', async ({ id: peerId }) => {
      if (peerId === socket.id) return;
      await createPeerConnection(peerId, true);
    });
    // Kullanıcı ayrıldı
    socket.on('user-left', ({ id: peerId }) => {
      setRemoteStreams(prev => {
        const copy = { ...prev };
        delete copy[peerId];
        return copy;
      });
      setPeers(prev => {
        if (prev[peerId]) prev[peerId].close();
        const copy = { ...prev };
        delete copy[peerId];
        return copy;
      });
    });
    // Signaling mesajı
    socket.on('signaling', async ({ from, data }) => {
      let pc = peers[from];
      if (!pc) pc = await createPeerConnection(from, false);
      if (data.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        if (data.sdp.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signaling', { to: from, data: { sdp: pc.localDescription } });
        }
      } else if (data.candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch {}
      }
    });
    // Mesajları dinle
    socket.on('chatMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    
    // Typing indicator
    socket.on('userTyping', ({ username, isTyping }) => {
      if (isTyping) {
        setTypingUsers(prev => [...prev.filter(u => u !== username), username]);
      } else {
        setTypingUsers(prev => prev.filter(u => u !== username));
      }
    });
    // Oda değişince mesajları ve peer'ları temizle
    setMessages([]);
    setRemoteStreams({});
    setPeers({});
    // Cleanup
    return () => {
      socket.off('room-users');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('signaling');
      socket.off('chatMessage');
      socket.off('userTyping');
      socket.emit('leaveRoom', { roomId: activeRoom, username: user.username });
    };
    // eslint-disable-next-line
  }, [step, user, activeRoom]);

  // Peer bağlantısı oluştur
  const createPeerConnection = async (peerId, isInitiator) => {
    if (peers[peerId]) return peers[peerId];
    const socket = socketRef.current;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    // Local stream ekle
    if (localStream) {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    }
    // Remote stream al
    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({ ...prev, [peerId]: event.streams[0] }));
    };
    // ICE candidate
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('signaling', { to: peerId, data: { candidate: event.candidate } });
      }
    };
    // Offer/Answer
    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('signaling', { to: peerId, data: { sdp: pc.localDescription } });
    }
    setPeers(prev => ({ ...prev, [peerId]: pc }));
    return pc;
  };

  // Kamera/mikrofon açıldığında peer'lara ekle
  useEffect(() => {
    if (!localStream) return;
    Object.values(peers).forEach(pc => {
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
    });
    if (camOn && videoRef.current) {
      videoRef.current.srcObject = localStream;
    }
    // eslint-disable-next-line
  }, [localStream]);

  // Otomatik kaydırma
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mesaj gönderme
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    const msg = {
      roomId: activeRoom,
      sender: user.username,
      text: messageInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    socketRef.current.emit('chatMessage', msg);
    setMessages((prev) => [...prev, msg]);
    setMessageInput('');
    
    // Typing indicator'ı temizle
    if (typingTimer) {
      clearTimeout(typingTimer);
    }
    socketRef.current.emit('userTyping', { 
      roomId: activeRoom, 
      username: user.username, 
      isTyping: false 
    });
  };

  // Typing indicator için input change handler
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    // Typing indicator başlat
    if (socketRef.current) {
      socketRef.current.emit('userTyping', { 
        roomId: activeRoom, 
        username: user.username, 
        isTyping: true 
      });
      
      // 2 saniye sonra typing'i durdur
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
      const newTimer = setTimeout(() => {
        socketRef.current.emit('userTyping', { 
          roomId: activeRoom, 
          username: user.username, 
          isTyping: false 
        });
      }, 2000);
      setTypingTimer(newTimer);
    }
  };

  // Menü state'i
  const [activeMenu, setActiveMenu] = useState('home'); // home, people, messages, calls, requests, profile

  // Menü ikonları ve başlıkları (SVG ikonlarla)
  const menuItems = [
    { key: 'home', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>, title: 'Odalar' },
    { key: 'people', icon: <div className="relative"><svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.54.37-2.01 1.01l-.7 1.06c-.5.75-.17 1.76.58 2.26l1.13.75V18h2zm-12.5 0v-6.5H9v-2.5H7.5v2.5h-2V18h2zm0-8.5h2v-2h-2v2zm2.5-3.5c0-1.11-.89-2-2-2s-2 .89-2 2 .89 2 2 2 2-.89 2-2z"/></svg><span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">209</span></div>, title: 'Oda/Site/Arkadaşlar' },
    { key: 'messages', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>, title: 'Özel Mesajlar' },
    { key: 'calls', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>, title: 'Arama Geçmişi' },
    { key: 'requests', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>, title: 'Arkadaş İstekleri' },
    { key: 'profile', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>, title: 'Profil' },
  ];

  // Kullanıcı üye mi kontrolü (örnek: user.type)
  const isGuest = !user || user.type === 'guest';

  // Misafir kullanıcı popup'u için kontrol
  useEffect(() => {
    if (user && user.type === 'guest') {
      // Misafir kullanıcı giriş yaptığında popup'u göster
      const timer = setTimeout(() => {
        setShowGuestUpgradePopup(true);
      }, 2000); // 2 saniye sonra göster
      return () => clearTimeout(timer);
    }
  }, [user]);

  if (step === 'chat' && user) {
    // Mock veriler ve filtreler
    const rooms = [
      { id: 1, name: '~SeSLiAsK_LoBy', count: 43, favorite: true, locked: false },
      { id: 2, name: 'KaRaD£NizLiLeR', count: 11, favorite: false, locked: false },
      { id: 3, name: 'SuNGuR', count: 1, favorite: false, locked: false },
      { id: 4, name: 'HaSReTi~DiYaR', count: 6, favorite: false, locked: false },
      { id: 5, name: 'Gün_Batımı', count: 1, favorite: false, locked: false },
      { id: 6, name: 'KARsu', count: 1, favorite: false, locked: false },
      { id: 7, name: 'Cay bahcesi', count: 17, favorite: false, locked: false },
      { id: 8, name: 'Lazkızı_Zeyno', count: 9, favorite: false, locked: false },
      { id: 9, name: '!!-Riw RiW-!!', count: 6, favorite: false, locked: false },
      { id: 10, name: '~TUFAN~Nazey', count: 3, favorite: false, locked: true },
      { id: 11, name: '~~HEVİN~~', count: 1, favorite: false, locked: true },
      { id: 12, name: 'Vayyy..vayy..', count: 21, favorite: false, locked: false },
      { id: 13, name: 'BLack_Seaa', count: 5, favorite: false, locked: false },
    ];
    const siteUsers = [
      { id: 1, name: user.username, gender: user.gender, online: true },
      { id: 2, name: 'Ziyaretçi1', gender: 'Kadın', online: true },
      { id: 3, name: 'Ziyaretçi2', gender: 'Erkek', online: false },
      { id: 4, name: 'BarBoRoS', gender: 'Erkek', online: true },
      { id: 5, name: 'LaLe', gender: 'Kadın', online: true },
      { id: 6, name: 'Galatasaray', gender: 'Erkek', online: true },
    ];
    const friends = [
      { id: 2, name: 'Ziyaretçi1', gender: 'Kadın', online: true },
      { id: 5, name: 'LaLe', gender: 'Kadın', online: true },
    ];
    const gelenDavetler = [
      { id: 7, name: 'BarBoRoS', gender: 'Erkek', online: true },
    ];
    const gidenDavetler = [
      { id: 8, name: 'Galatasaray', gender: 'Erkek', online: true },
    ];
    // Oda içi kullanıcılar (her oda için farklı kullanıcılar)
    const roomUsersByRoom = {
      1: [
        { id: 1, name: 'Maraz', isSpeaking: false, online: true },
        { id: 2, name: 'SeSLiAsK', isSpeaking: true, online: true },
        { id: 3, name: '!!ZuaL!!', isSpeaking: false, online: true },
        { id: 4, name: 'BarBoRoS', isSpeaking: false, online: true },
        { id: 5, name: 'LaLe', isSpeaking: false, online: true },
        { id: 6, name: 'Galatasaray', isSpeaking: false, online: true },
      ],
      2: [
        { id: 7, name: 'KaRaD£NizLiLeR', isSpeaking: false, online: true },
        { id: 8, name: 'Ziyaretçi1', isSpeaking: false, online: true },
      ],
      3: [
        { id: 9, name: 'SuNGuR', isSpeaking: true, online: true },
      ],
      // ... diğer odalar için örnek kullanıcılar eklenebilir
    };
    const roomUsers = roomUsersByRoom[activeRoom] || [];
    const messagesByRoom = {
      1: [
        { id: 1, sender: 'Ziyaretçi1', text: 'Merhaba!' },
        { id: 2, sender: user.username, text: 'Hoşbulduk!' },
      ],
      2: [
        { id: 1, sender: 'KaRaD£NizLiLeR', text: 'Karadeniz selamlar!' },
      ],
      10: [
        { id: 1, sender: '~TUFAN~Nazey', text: 'Burası özel oda.' },
      ],
    };
    const messages = messagesByRoom[activeRoom] || [];

    let list = [];
    if (activeTab === 'oda') list = rooms;
    if (activeTab === 'site') list = siteUsers;
    if (activeTab === 'arkadas') {
      if (arkadasTab === 'arkadaslar') list = friends;
      if (arkadasTab === 'gelen') list = gelenDavetler;
      if (arkadasTab === 'giden') list = gidenDavetler;
    }
    if (search) list = list.filter(u => (u.name || '').toLowerCase().includes(search.toLowerCase()));

    // Kullanıcıya tıklayınca özel mesaj başlat (şimdilik alert)
    const handleUserClick = (u) => {
      setSelectedUser(u);
      setShowUserModal(true);
    };

    // Site sekmesinde kullanıcıya tıklama fonksiyonu
    // const handleUserClick = (u) => {
    //   setSelectedUser(u);
    //   setShowUserModal(true);
    // };

    // Profil modalı buton fonksiyonları
    const handleSendMessage = (user) => alert(`${user.name} ile özel mesaj başlat!`);
    const handleCall = (user) => alert(`${user.name} aranıyor...`);
    const handleVideoCall = (user) => alert(`${user.name} ile görüntülü arama başlatılıyor...`);
    const handleMute = (user) => alert(`${user.name} sessize alındı!`);
    const handleBlock = (user) => alert(`${user.name} engellendi!`);
    const handleInfo = (user) => alert(`${user.name} hakkında bilgi gösteriliyor...`);
    const handleAddFriend = (user) => alert(`${user.name} arkadaş olarak eklendi!`);

    // Şifre değiştir
    const handleChangePassword = async (e) => {
      e.preventDefault();
      setProfileMsg(''); setProfileError('');
      const oldPassword = e.target.oldPassword.value;
      const newPassword = e.target.newPassword.value;
      const res = await fetch(API_URL + '/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, oldPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) setProfileMsg('Şifre başarıyla değiştirildi!');
      else setProfileError(data.error || 'Hata!');
    };
    // Rumuz değiştir
    const handleChangeNickname = async (e) => {
      e.preventDefault();
      setProfileMsg(''); setProfileError('');
      const newNickname = e.target.newNickname.value;
      const res = await fetch(API_URL + '/change-nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, newNickname })
      });
      const data = await res.json();
      if (data.success) {
        setProfileMsg('Rumuz başarıyla değiştirildi!');
        setProfileUsername(data.username);
      } else setProfileError(data.error || 'Hata!');
    };
    // İkon değiştir
    const handleChangeAvatar = async (avatar) => {
      setProfileMsg(''); setProfileError('');
      const res = await fetch(API_URL + '/change-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, avatar })
      });
      const data = await res.json();
      if (data.success) {
        setProfileMsg('Avatar başarıyla değiştirildi!');
        setProfileAvatar(avatar);
      } else setProfileError(data.error || 'Hata!');
    };
    // Hesap dondur
    const handleFreezeAccount = async () => {
      setProfileMsg(''); setProfileError('');
      const res = await fetch(API_URL + '/freeze-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      const data = await res.json();
      if (data.success) setProfileMsg('Hesabınız donduruldu!');
      else setProfileError(data.error || 'Hata!');
    };

    // Modal içeriği (görseldeki gibi)
    const renderUserModal = () => {
      if (!selectedUser) return null;
      const isFemale = selectedUser.gender === 'Kadın';
      return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-0 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-[#b80040] text-2xl" onClick={() => setShowUserModal(false)}>&times;</button>
            <div className="flex items-center justify-between px-6 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <span className={`text-2xl ${isFemale ? 'text-pink-500' : 'text-blue-500'}`}>{isFemale ? '♀' : '♂'}</span>
                <span className="font-bold text-lg">{selectedUser.name}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-purple-600 text-lg">{'★'.repeat(12)}</span>
                <span className="text-xs text-gray-500">Çevrimici</span>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-0 border-b border-t border-gray-200 bg-gray-50">
              <button title="Özel mesaj" className="py-2 text-[#b80040] text-2xl" onClick={() => handleSendMessage(selectedUser)}>💬</button>
              <button title="Ara" className="py-2 text-green-600 text-2xl" onClick={() => handleCall(selectedUser)}>📞</button>
              <button title="Görüntülü" className="py-2 text-green-600 text-2xl" onClick={() => handleVideoCall(selectedUser)}>🎥</button>
              <button title="Sessize al" className="py-2 text-gray-400 text-2xl" onClick={() => handleMute(selectedUser)}>🙈</button>
              <button title="Engelle" className="py-2 text-red-500 text-2xl" onClick={() => handleBlock(selectedUser)}>🚫</button>
              <button title="Bilgi" className="py-2 text-blue-500 text-2xl" onClick={() => handleInfo(selectedUser)}>ℹ️</button>
            </div>
            <div className="flex justify-center py-4 bg-white">
              <img src={selectedUser.avatar || 'https://randomuser.me/api/portraits/women/44.jpg'} alt="avatar" className="w-40 h-40 rounded object-cover border" />
            </div>
            <div className="flex items-center justify-between px-6 text-gray-500 text-sm mb-2">
              <span>💬 0 yorum</span>
              <button className="text-gray-500 hover:text-[#b80040]" onClick={() => handleAddFriend(selectedUser)}>♡ Arkadaş Ekle</button>
            </div>
            <div className="text-center text-gray-400 text-sm mb-2">Henüz yorum yapılmamış</div>
            <div className="px-6 pb-4">
              <input type="text" placeholder="Yorum ekle..." className="w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b80040] text-sm" />
            </div>
          </div>
        </div>
      );
    };

    // Video grid için kullanıcılar
    const videoUsers = [
      { id: user.username, name: user.username, isSelf: true, stream: camOn ? localStream : null },
      ...roomUserList.filter(u => u.id !== (socketRef.current?.id || '')).map(u => ({
        id: u.id, name: u.username, isSelf: false, stream: remoteStreams[u.id] || null
      }))
    ];

    return (
      <div className="min-h-screen flex bg-gradient-to-br from-[#2d0036] via-[#1a1a2e] to-[#0f3460]">
        {/* Sol Menü ve Panel */}
        <div className="w-96 bg-white/90 border-r border-gray-200 flex flex-col h-screen">
          {/* Menü Barı */}
          <div className="flex items-center justify-between px-2 py-2 border-b border-gray-200 bg-white/95">
            {menuItems.map(item => (
              <button key={item.key} onClick={() => setActiveMenu(item.key)}
                className={`flex-1 flex flex-col items-center py-1 ${activeMenu === item.key ? 'text-[#b80040]' : 'text-gray-400'}`}
                title={item.title}>
                <div className="w-8 h-8 flex items-center justify-center">{item.icon}</div>
              </button>
            ))}
          </div>
          {/* Menü İçerikleri */}
          <div className="flex-1 overflow-y-auto">
            {/* 1. Bütün Odalar */}
            {activeMenu === 'home' && (
              <div className="p-4">
                <div className="font-bold text-lg mb-2">Tüm Odalar</div>
                <input type="text" placeholder="Tüm odalarda ara..." className="w-full mb-3 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b80040] text-sm" />
                <ul>
                  {rooms.map(room => (
                    <li key={room.id} className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer rounded mb-1 ${activeRoom === room.id ? 'bg-[#b80040] text-white' : 'hover:bg-gray-100'}`}
                      onClick={() => {
                        setActiveRoom(room.id);
                        setActiveMenu('people');
                        setActiveTab('oda');
                      }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={room.favorite ? 'text-red-500' : 'text-gray-400'}>
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    <span className="flex-1">{room.name}</span>
                    {room.locked && <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM15.1 8H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>}
                    <span className="bg-gray-200 rounded-full px-2 text-xs ml-2 text-gray-700">{room.count}</span>
                  </li>
                ))}
                </ul>
              </div>
            )}
            {/* 2. Oda/Site/Arkadaşlar */}
            {activeMenu === 'people' && (
              <div className="p-4">
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setActiveTab('oda')} className={`flex-1 py-2 font-semibold text-sm ${activeTab === 'oda' ? 'border-b-4 border-[#b80040] text-[#b80040] bg-white' : 'text-gray-500 bg-gray-100'}`}>Oda</button>
                  <button onClick={() => setActiveTab('site')} className={`flex-1 py-2 font-semibold text-sm ${activeTab === 'site' ? 'border-b-4 border-[#b80040] text-[#b80040] bg-white' : 'text-gray-500 bg-gray-100'}`}>Site</button>
                  <button onClick={() => setActiveTab('arkadas')} className={`flex-1 py-2 font-semibold text-sm ${activeTab === 'arkadas' ? 'border-b-4 border-[#b80040] text-[#b80040] bg-white' : 'text-gray-500 bg-gray-100'}`}>Arkadaşlar</button>
                </div>
                <input type="text" placeholder="Ara..." className="w-full mb-3 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b80040] text-sm" />
                <ul>
                  {list.map(u => (
                    <li key={u.id} className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-[#f8e1ec] rounded mb-1" onClick={activeMenu === 'people' && activeTab === 'site' ? () => handleUserClick(u) : undefined}>
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random&color=fff&size=48`} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base">{u.name}</div>
                        <div className="text-xs text-gray-500">{u.online ? 'Çevrimiçi' : 'Çevrimdışı'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.gender === 'Kadın' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-pink-500">
                            <path d="M12 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        )}
                        {u.gender === 'Erkek' && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-500">
                            <path d="M12 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 14c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                          </svg>
                        )}
                        <span className={`w-3 h-3 rounded-full ${u.online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      </div>
                    </li>
                  ))}
                  {list.length === 0 && <li className="px-4 py-6 text-center text-gray-400 text-xs">Kayıt bulunamadı</li>}
                </ul>
              </div>
            )}
            {/* 3. Özel Mesajlar */}
            {activeMenu === 'messages' && (
              <div className="p-4">
                <div className="font-bold text-lg mb-2">Özel Mesajlar</div>
                <input type="text" placeholder="Mesajlarda ara..." className="w-full mb-3 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b80040] text-sm" />
                <div className="bg-gray-100 rounded p-6 text-center text-gray-400">
                  <div className="text-3xl mb-2">💬</div>
                  <div className="font-semibold">Mesaj kutusu boş</div>
                  <div className="text-xs">Bu listedeki mesajlar cihazınızdan listelenir ve uzak sunucularda tutulmaz</div>
                </div>
              </div>
            )}
            {/* 4. Arama Geçmişi */}
            {activeMenu === 'calls' && (
              <div className="p-4">
                <div className="font-bold text-lg mb-2">Arama Geçmişi</div>
                <input type="text" placeholder="Tüm çağrılarda ara..." className="w-full mb-3 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b80040] text-sm" />
                <div className="flex gap-2 mb-2">
                  <button className="flex-1 py-2 text-xs border-b-2 border-[#b80040] text-[#b80040] bg-white">Tümü</button>
                  <button className="flex-1 py-2 text-xs bg-gray-100 text-gray-500">Gelen</button>
                  <button className="flex-1 py-2 text-xs bg-gray-100 text-gray-500">Giden</button>
                  <button className="flex-1 py-2 text-xs bg-gray-100 text-gray-500">Cevapsız</button>
                </div>
                <div className="bg-gray-100 rounded p-6 text-center text-gray-400">
                  <div className="text-3xl mb-2">📞</div>
                  <div className="font-semibold">Aramalar listesi boş</div>
                  <div className="text-xs">Bu listedeki aramalar cihazınızdan listelenir ve uzak sunucularda tutulmaz</div>
                </div>
              </div>
            )}
            {/* 5. Arkadaş İstekleri */}
            {activeMenu === 'requests' && (
              <div className="p-4">
                <div className="font-bold text-lg mb-2">Arkadaş İstekleri</div>
                <input type="text" placeholder="Arkadaş isteklerinde ara..." className="w-full mb-3 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b80040] text-sm" />
                <div className="flex gap-2 mb-2">
                  <button className="flex-1 py-2 text-xs border-b-2 border-[#b80040] text-[#b80040] bg-white">Giden Davetler(0)</button>
                  <button className="flex-1 py-2 text-xs bg-gray-100 text-gray-500">Gelen Davetler(0)</button>
                </div>
                <div className="bg-gray-100 rounded p-6 text-center text-gray-400">
                  <div className="text-3xl mb-2">👤</div>
                  <div className="font-semibold">Davet kutusu boş</div>
                </div>
              </div>
            )}
            {/* 6. Profil */}
            {activeMenu === 'profile' && (
              <div className="p-4">
                {/* Misafir kullanıcılar için üyelik call-to-action banner'ı */}
                {user.type === 'guest' && (
                  <div className="mb-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm font-semibold mb-2">🎉 Üyelik Avantajları</div>
                      <div className="text-xs mb-3">• Özel mesajlaşma • Profil özelleştirme • Arama geçmişi</div>
                      <button 
                        className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-100 transition-colors"
                        onClick={() => setShowGuestUpgradePopup(true)}
                      >
                        Ücretsiz Üye Ol!
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Profil paneli kodunu buraya taşıdık */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gray-300" />
                  <div>
                    <div className="font-bold text-lg">{user.username}</div>
                    <div className="text-sm text-gray-500">{user.type === 'guest' ? 'Misafir' : 'Üye'}</div>
                    <div className="text-xs text-green-600">Çevrimici</div>
                  </div>
                  {/* Üç çizgili menü butonu */}
                  <button
                    className="ml-auto bg-gray-200 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-300"
                    onClick={() => setShowProfileMenu(true)}
                    title="Üye Profili Menüsü"
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" /></svg>
                  </button>
                </div>
                {/* Üye Profili Modalı */}
                {showProfileMenu && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl relative flex min-h-[420px]">
                      <button className="absolute top-2 right-2 text-gray-400 hover:text-[#b80040] text-2xl" onClick={() => setShowProfileMenu(false)}>&times;</button>
                      {user && user.type === 'guest' ? (
                        // Misafir için sade ekran
                        <div className="flex flex-col items-center justify-center w-full p-8">
                          <div className="w-full max-w-md">
                            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6 text-center font-semibold">
                              Üye olmak basit ve ücretsizdir!<br/>
                              <button className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded" onClick={() => {
                                setShowProfileMenu(false);
                                setShowGuestUpgradePopup(true);
                              }}>Kayıtlı üye ol!</button>
                            </div>
                            <div className="flex flex-col items-center mb-6">
                              <img src={user?.avatar || 'https://randomuser.me/api/portraits/men/1.jpg'} alt="avatar" className="w-28 h-28 rounded-full border-4 border-gray-200 mb-2" />
                              <div className="text-2xl font-bold mb-1">{user?.username || 'Misafir'}</div>
                              <div className="text-lg text-gray-500">Misafir</div>
                              <div className="text-xs text-green-600">Çevrimici</div>
                            </div>
                            
                            {/* Kişisel Oda Dizaynları */}
                            <div className="mb-4">
                              <div className="text-xs text-gray-500 font-semibold mb-2 border-b pb-1">KİŞİSEL ODA DİZAYNLARI</div>
                              <div className="grid grid-cols-5 gap-2 mb-2">
                                {designs.map((url, i) => (
                                  <img key={i} src={url} alt="dizayn" onClick={() => setSelectedDesign(i)} className={`w-12 h-12 rounded cursor-pointer border-2 ${selectedDesign === i ? 'border-[#b80040]' : 'border-transparent'}`} />
                                ))}
                              </div>
                              <button className="w-full py-2 bg-gray-800 text-white rounded mt-1 text-sm" onClick={() => setSelectedDesign(-1)}>Özel Dizaynı Kaldır</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Üye için detaylı panel
                        <>
                        {/* Sol Menü */}
                        <div className="w-64 bg-gray-50 border-r rounded-l-xl flex flex-col pt-6">
                          <div className="font-bold text-lg px-6 pb-4 border-b">Üye Profili</div>
                          <button onClick={()=>setProfileTab('profilim')} className={`flex items-center gap-3 px-6 py-4 text-left text-base font-semibold ${profileTab==='profilim'?'bg-gray-200 text-[#b80040]':'text-gray-700 hover:bg-gray-100'}`}> <span className="text-2xl">⭐</span> Profilim</button>
                          <button onClick={()=>setProfileTab('sifre')} className={`flex items-center gap-3 px-6 py-4 text-left text-base font-semibold ${profileTab==='sifre'?'bg-gray-200 text-[#b80040]':'text-gray-700 hover:bg-gray-100'}`}> <span className="text-2xl">🔒</span> Şifre Değiştir</button>
                          <button onClick={()=>setProfileTab('rumuz')} className={`flex items-center gap-3 px-6 py-4 text-left text-base font-semibold ${profileTab==='rumuz'?'bg-gray-200 text-[#b80040]':'text-gray-700 hover:bg-gray-100'}`}> <span className="text-2xl">👤</span> Rumuz Değiştir</button>
                          <button onClick={()=>setProfileTab('ikon')} className={`flex items-center gap-3 px-6 py-4 text-left text-base font-semibold ${profileTab==='ikon'?'bg-gray-200 text-[#b80040]':'text-gray-700 hover:bg-gray-100'}`}> <span className="text-2xl">🎁</span> İkonlar</button>
                          <button onClick={()=>setProfileTab('dondur')} className={`flex items-center gap-3 px-6 py-4 text-left text-base font-semibold ${profileTab==='dondur'?'bg-gray-200 text-[#b80040]':'text-gray-700 hover:bg-gray-100'}`}> <span className="text-2xl">❌</span> Hesap Dondurma</button>
                        </div>
                        {/* Sağ İçerik */}
                        <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[420px]">
                          {profileMsg && <div className="mb-4 text-green-600 font-semibold">{profileMsg}</div>}
                          {profileError && <div className="mb-4 text-red-600 font-semibold">{profileError}</div>}
                          {profileTab==='profilim' && (
                            <div className="flex flex-col items-center w-full">
                              <img src={profileAvatar || 'https://randomuser.me/api/portraits/men/1.jpg'} alt="avatar" className="w-32 h-32 rounded-full border-4 border-gray-200 mb-4" />
                              <div className="text-2xl font-bold mb-1">{profileUsername}</div>
                              <div className="text-lg text-gray-500">Üye</div>
                            </div>
                          )}
                          {profileTab==='sifre' && (
                            <form className="w-full max-w-md flex flex-col gap-4" onSubmit={handleChangePassword}>
                              <div>
                                <label className="block mb-1 font-semibold">Kullandığınız Şifre</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-pink-400 text-xl">🔑</span>
                                  <input name="oldPassword" type="password" placeholder="Kullandığınız şifre" className="pl-10 pr-3 py-2 rounded border w-full bg-gray-50" required />
                                </div>
                              </div>
                              <div>
                                <label className="block mb-1 font-semibold">Yeni Şifreniz</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-xl">🔑</span>
                                  <input name="newPassword" type="password" placeholder="Yeni Şifreniz" className="pl-10 pr-3 py-2 rounded border w-full bg-gray-50" required />
                                </div>
                              </div>
                              <button type="submit" className="mt-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded text-lg">Şifre Değiştir</button>
                            </form>
                          )}
                          {profileTab==='rumuz' && (
                            <form className="w-full max-w-md flex flex-col gap-4" onSubmit={handleChangeNickname}>
                              <div>
                                <label className="block mb-1 font-semibold">Yeni rumuz yazınız</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">👤</span>
                                  <input name="newNickname" type="text" placeholder="Yeni rumuz yazınız" className="pl-10 pr-3 py-2 rounded border w-full bg-gray-50" required />
                                </div>
                              </div>
                              <button type="submit" className="mt-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded text-lg">Rumuz Değiştir</button>
                            </form>
                          )}
                          {profileTab==='ikon' && (
                            <div className="w-full grid grid-cols-6 gap-4 max-h-[340px] overflow-y-auto">
                              {[...Array(24)].map((_,i)=>(
                                <img key={i} src={`https://sesliask.net/images/avatars/avatar${i+1}.png`} alt="ikon" className={`w-16 h-16 rounded bg-gray-100 border cursor-pointer ${profileAvatar===`https://sesliask.net/images/avatars/avatar${i+1}.png`?'border-[#b80040] border-4':'hover:border-[#b80040]'}`} onClick={()=>handleChangeAvatar(`https://sesliask.net/images/avatars/avatar${i+1}.png`)} />
                              ))}
                            </div>
                          )}
                          {profileTab==='dondur' && (
                            <div className="flex flex-col items-center w-full max-w-xl">
                              <div className="text-lg text-center mb-6">Üyeliğinizi dondurmanız (kilitlemeniz) hâlinde, tekrar aynı kullanıcı adı ile sisteme giriş yapamazsınız. Ancak, bir yönetici vasıtası ile kilidinizi tekrar açtırabilirsiniz.</div>
                              <button type="button" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded text-lg" onClick={handleFreezeAccount}>Anladım, Dondur</button>
                            </div>
                          )}
                        </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                {/* Oda Dizaynları */}
                <div className="mb-4">
                  <div className="text-xs text-gray-500 font-semibold mb-2 border-b pb-1">KİŞİSEL ODA DİZAYNLARI</div>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {designs.map((url, i) => (
                      <img key={i} src={url} alt="dizayn" onClick={() => setSelectedDesign(i)} className={`w-12 h-12 rounded cursor-pointer border-2 ${selectedDesign === i ? 'border-[#b80040]' : 'border-transparent'}`} />
                    ))}
                  </div>
                  <button className="w-full py-2 bg-gray-800 text-white rounded mt-1 text-sm" onClick={() => setSelectedDesign(-1)}>Özel Dizaynı Kaldır</button>
                </div>
                {/* Misafir kullanıcılar için sadece kişisel oda dizaynları ve basit ayarlar */}
                {user.type === 'guest' ? (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 font-semibold mb-2 border-b pb-1">GENEL AYARLAR</div>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2"><input type="checkbox" checked={settings.blockPrivate} onChange={e => setSettings(s => ({ ...s, blockPrivate: e.target.checked }))} />Özel mesajları reddet</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={settings.blockCalls} onChange={e => setSettings(s => ({ ...s, blockCalls: e.target.checked }))} />Gelen aramaları reddet</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={settings.blockOfflineMsg} onChange={e => setSettings(s => ({ ...s, blockOfflineMsg: e.target.checked }))} />Çevrimdışıyken mesaj yazılmasın</label>
                      <span className="text-xs text-gray-400 ml-2">diğer tüm ayarlar...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Genel Ayarlar */}
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 font-semibold mb-2 border-b pb-1">GENEL AYARLAR</div>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={settings.blockPrivate} onChange={e => setSettings(s => ({ ...s, blockPrivate: e.target.checked }))} />Özel mesajları reddet</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={settings.blockCalls} onChange={e => setSettings(s => ({ ...s, blockCalls: e.target.checked }))} />Gelen aramaları reddet</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={settings.blockOfflineMsg} onChange={e => setSettings(s => ({ ...s, blockOfflineMsg: e.target.checked }))} />Çevrimdışıyken mesaj yazılmasın</label>
                        <span className="text-xs text-gray-400 ml-2">diğer tüm ayarlar...</span>
                      </div>
                    </div>
                    {/* Bildirimler ve Uyarılar */}
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 font-semibold mb-2 border-b pb-1">BİLDİRİMLER VE UYARILAR</div>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={settings.muteVibration} onChange={e => setSettings(s => ({ ...s, muteVibration: e.target.checked }))} />Titreşim seslerini kapat</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={settings.mutePrivateNotif} onChange={e => setSettings(s => ({ ...s, mutePrivateNotif: e.target.checked }))} />Özel mesaj uyarılarını gizle</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={settings.showJoinLeave} onChange={e => setSettings(s => ({ ...s, showJoinLeave: e.target.checked }))} />Giriş ve çıkışları göster</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={settings.showJoinFx} onChange={e => setSettings(s => ({ ...s, showJoinFx: e.target.checked }))} />Giriş efektlerini gösterme</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={settings.hideGeneral} onChange={e => setSettings(s => ({ ...s, hideGeneral: e.target.checked }))} />Atılan genelleri gizle</label>
                      </div>
                    </div>
                    {/* Yazışma Geçmişi */}
                    <div className="mb-4">
                      <div className="text-xs text-gray-500 font-semibold mb-2 border-b pb-1">YAZIŞMA GEÇMİŞLERİ</div>
                      <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={settings.roomHistory} onChange={e => setSettings(s => ({ ...s, roomHistory: e.target.checked }))} />Oda yazışma geçmişi</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={settings.privateHistory} onChange={e => setSettings(s => ({ ...s, privateHistory: e.target.checked }))} />Özel yazışma geçmişi</label>
                      </div>
                    </div>
                    {/* Site Teması (isteğe bağlı) */}
                    <div className="mb-2">
                      <div className="text-xs text-gray-500 font-semibold mb-2 border-b pb-1">SİTE TEMASI</div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 rounded bg-gray-200 text-xs">Açık</button>
                        <button className="px-3 py-1 rounded bg-gray-800 text-white text-xs">Koyu</button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            {/* Oda sekmesi: sadece oda kullanıcıları */}
            {activeMenu === 'people' && activeTab === 'oda' && (
              <div className="p-4">
                <div className="font-bold text-lg mb-2">Oda Kullanıcıları</div>
                <input type="text" placeholder="Oda kişilerinde ara..." className="w-full mb-3 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b80040] text-sm" />
                <ul>
                  {roomUsers.map(u => (
                    <li key={u.id} className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer hover:bg-[#f8e1ec] rounded mb-1" onClick={() => handleUserClick(u)}>
                      <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random&color=fff&size=48`} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-base">{u.name}</div>
                        <div className="text-xs text-gray-500">Çevrimiçi</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.isSpeaking && (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
                            <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm5.3 6.8c.4 0 .7.3.7.7 0 3.25-2.25 5.97-5.3 6.7v2.05h2.6c.4 0 .7.3.7.7s-.3.7-.7.7H8.4c-.4 0-.7-.3-.7-.7s.3-.7.7-.7h2.6v-2.05c-3.05-.73-5.3-3.45-5.3-6.7 0-.4.3-.7.7-.7s.7.3.7.7c0 2.76 2.24 5 5 5s5-2.24 5-5c0-.4.3-.7.7-.7z"/>
                          </svg>
                        )}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-green-500">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
                        </svg>
                      </div>
                    </li>
                  ))}
                  {roomUsers.length === 0 && <li className="px-4 py-6 text-center text-gray-400 text-xs">Oda boş</li>}
                </ul>
              </div>
            )}
          </div>
        </div>
        {/* Orta ve sağ panel ... */}
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white/80 font-bold text-[#b80040] text-lg">{rooms.find(r => r.id === activeRoom)?.name || 'Sohbet'}</div>
          {/* Video grid */}
          <div className="flex gap-4 p-4 bg-gradient-to-br from-gray-200 to-gray-400 min-h-[160px]">
            {videoUsers.map((vu) => (
              <div key={vu.id} className="flex flex-col items-center">
                {vu.isSelf ? (
                  camOn ? (
                    <video ref={videoRef} autoPlay muted playsInline className="w-40 h-32 rounded shadow-lg border border-gray-300 bg-black" />
                  ) : (
                    <div className="w-40 h-32 rounded shadow-lg border border-gray-300 bg-black flex items-center justify-center text-white">Kamera Kapalı</div>
                  )
                ) : (
                  <div className="w-40 h-32 rounded shadow-lg border border-gray-300 bg-black flex items-center justify-center text-white">{vu.name}</div>
                )}
                <div className="mt-1 text-xs text-gray-700 font-semibold">{vu.name}</div>
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white/60">
            {messages.map((msg, i) => (
              <div key={i} className="flex items-start gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold">
                  {msg.sender.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-800">{msg.sender}</span>
                    <span className="text-xs text-gray-500">{msg.time}</span>
                  </div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2 text-gray-800 text-sm">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="px-4 py-2 bg-white/80 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">
                  {typingUsers.length === 1 
                    ? `${typingUsers[0]} yazıyor...` 
                    : `${typingUsers.length} kişi yazıyor...`
                  }
                </span>
              </div>
            </div>
          )}
          
          <form className="flex items-center p-4 gap-2 border-t border-gray-200 bg-white/80" onSubmit={handleSendMessage}>
            <button type="button" className="text-gray-400 hover:text-[#b80040] p-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-9 2h2v2H8v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/>
              </svg>
            </button>
            <input type="text" placeholder="Mesaj..." value={messageInput} onChange={handleInputChange} className="flex-1 px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b80040]" />
            <button type="button" onClick={handleToggleMic} className={`p-2 ${micOn ? 'text-[#b80040]' : 'text-gray-400'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2c1.1 0 2 .9 2 2v6c0 1.1-.9 2-2 2s-2-.9-2-2V4c0-1.1.9-2 2-2zm5.3 6.8c.4 0 .7.3.7.7 0 3.25-2.25 5.97-5.3 6.7v2.05h2.6c.4 0 .7.3.7.7s-.3.7-.7.7H8.4c-.4 0-.7-.3-.7-.7s.3-.7.7-.7h2.6v-2.05c-3.05-.73-5.3-3.45-5.3-6.7 0-.4.3-.7.7-.7s.7.3.7.7c0 2.76 2.24 5 5 5s5-2.24 5-5c0-.4.3-.7.7-.7z"/>
              </svg>
            </button>
            <button type="button" onClick={handleToggleCam} className={`p-2 ${camOn ? 'text-[#b80040]' : 'text-gray-400'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            </button>
            <button type="button" className="text-gray-400 hover:text-[#b80040] p-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            </button>
            <button type="submit" className="text-[#b80040] hover:bg-[#b80040] hover:text-white rounded-full p-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </form>
        </div>
        {showUserModal && renderUserModal()}
        
        {/* Misafir Kullanıcı Popup'u */}
        {showGuestUpgradePopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative p-8">
              <button className="absolute top-2 right-2 text-gray-400 hover:text-[#b80040] text-2xl" onClick={() => setShowGuestUpgradePopup(false)}>&times;</button>
              <div className="text-center">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6 text-center font-semibold">
                  Üye olmak basit ve ücretsizdir!
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg mb-4" onClick={() => {
                  setShowGuestUpgradePopup(false);
                  // Burada üye olma işlemi yapılacak
                  alert('Üye olma özelliği henüz aktif değil!');
                }}>
                  Kayıtlı üye ol!
                </button>
                <div className="flex flex-col items-center mb-6">
                  <img src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.username || 'Misafir'}&background=random&color=fff&size=128`} alt="avatar" className="w-32 h-32 rounded-full border-4 border-gray-200 mb-4" />
                  <div className="text-2xl font-bold mb-1">{user?.username || 'Misafir'}</div>
                  <div className="text-lg text-gray-500">Misafir</div>
                  <div className="text-xs text-green-600">Çevrimiçi</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#2d0036] via-[#1a1a2e] to-[#0f3460]">
      <div className="bg-white/90 rounded-xl shadow-lg p-8 w-full max-w-sm flex flex-col items-center">
        <img src="https://sesliask.net/wp-content/uploads/2019/06/sesliasklogo.png" alt="logo" className="w-48 mb-4" />
        <h2 className="text-2xl font-bold text-[#b80040] mb-6">SesliAsk.NeT</h2>
        {step === 'login' && (
          <form onSubmit={handleLogin} className="w-full flex flex-col gap-3">
            <input
              type="text"
              placeholder="Kullanıcı adı"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b80040]"
            />
            <div className="flex gap-2 justify-center">
              <button type="button" onClick={() => setGender('Erkek')} className={`flex-1 py-2 rounded font-semibold border ${gender === 'Erkek' ? 'bg-[#b80040] text-white' : 'bg-gray-100 text-gray-700'}`}>Erkek</button>
              <button type="button" onClick={() => setGender('Kadın')} className={`flex-1 py-2 rounded font-semibold border ${gender === 'Kadın' ? 'bg-[#b80040] text-white' : 'bg-gray-100 text-gray-700'}`}>Kadın</button>
            </div>
            <button type="submit" className="bg-[#b80040] hover:bg-[#a00036] text-white font-bold py-2 rounded transition">Giriş Yap</button>
            {error && <div className="text-red-600 text-center text-sm font-medium mt-2 animate-pulse">{error}</div>}
          </form>
        )}
        {step === 'password' && (
          <form onSubmit={handlePasswordLogin} className="w-full flex flex-col gap-3">
            <input
              type="text"
              placeholder="Kullanıcı adı"
              value={username}
              disabled
              className="px-4 py-2 rounded border border-gray-300 bg-gray-100 text-gray-400"
            />
            <input
              type="password"
              placeholder="Şifre"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#b80040]"
            />
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-[#b80040] hover:bg-[#a00036] text-white font-bold py-2 rounded transition">Bağlan!</button>
              <button type="button" onClick={() => setStep('login')} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 rounded transition">Vazgeç</button>
            </div>
            {error && <div className="text-red-600 text-center text-sm font-medium mt-2 animate-pulse">{error}</div>}
          </form>
        )}
        <div className="mt-6 text-xs text-gray-500 flex gap-2">
          <a href="#" className="hover:underline">Gizlilik</a>
          <span>|</span>
          <a href="#" className="hover:underline">Kurallar</a>
          <span>|</span>
          <a href="#" className="hover:underline">Bilgilendirme</a>
        </div>
      </div>
    </div>
  )
}

export default App
