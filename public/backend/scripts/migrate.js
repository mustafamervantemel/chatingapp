const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DATABASE_URL || './database.db';

const db = new sqlite3.Database(dbPath);

// Create tables if they don't exist
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    gender TEXT CHECK(gender IN ('Erkek', 'Kadın')) NOT NULL,
    type TEXT CHECK(type IN ('member', 'guest')) DEFAULT 'member',
    avatar TEXT,
    frozen BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Rooms table
  db.run(`CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    locked BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Messages table
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms (id)
  )`);

  // Insert default users
  const defaultUsers = [
    { username: 'testuser', password: '1234', gender: 'Erkek' },
    { username: 'demo', password: 'demo', gender: 'Kadın' },
  ];

  const insertUser = db.prepare(`INSERT OR IGNORE INTO users (username, password, gender) VALUES (?, ?, ?)`);
  defaultUsers.forEach(user => {
    insertUser.run(user.username, user.password, user.gender);
  });
  insertUser.finalize();

  // Insert default rooms
  const defaultRooms = [
    { name: '~SeSLiAsK_LoBy', locked: 0 },
    { name: 'KaRaD£NizLiLeR', locked: 0 },
    { name: 'SuNGuR', locked: 0 },
    { name: 'HaSReTi~DiYaR', locked: 0 },
    { name: 'Gün_Batımı', locked: 0 },
    { name: 'KARsu', locked: 0 },
    { name: 'Cay bahcesi', locked: 0 },
    { name: 'Lazkızı_Zeyno', locked: 0 },
    { name: '!!-Riw RiW-!!', locked: 0 },
    { name: '~TUFAN~Nazey', locked: 1 },
    { name: '~~HEVİN~~', locked: 1 },
    { name: 'Vayyy..vayy..', locked: 0 },
    { name: 'BLack_Seaa', locked: 0 },
  ];

  const insertRoom = db.prepare(`INSERT OR IGNORE INTO rooms (name, locked) VALUES (?, ?)`);
  defaultRooms.forEach(room => {
    insertRoom.run(room.name, room.locked);
  });
  insertRoom.finalize();

  console.log('Database migration completed successfully!');
});

db.close();