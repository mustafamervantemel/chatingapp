-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK(gender IN ('Erkek', 'Kadın')) NOT NULL,
    type VARCHAR(10) CHECK(type IN ('member', 'guest')) DEFAULT 'member',
    avatar TEXT,
    frozen BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    locked BOOLEAN DEFAULT false,
    user_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room participants table (for real-time tracking)
CREATE TABLE IF NOT EXISTS room_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_speaking BOOLEAN DEFAULT false,
    is_typing BOOLEAN DEFAULT false,
    socket_id VARCHAR(255),
    UNIQUE(room_id, user_id)
);

-- Insert default rooms
INSERT INTO rooms (name, locked) VALUES
('~SeSLiAsK_LoBy', false),
('KaRaD£NizLiLeR', false),
('SuNGuR', false),
('HaSReTi~DiYaR', false),
('Gün_Batımı', false),
('KARsu', false),
('Cay bahcesi', false),
('Lazkızı_Zeyno', false),
('!!-Riw RiW-!!', false),
('~TUFAN~Nazey', true),
('~~HEVİN~~', true),
('Vayyy..vayy..', false),
('BLack_Seaa', false)
ON CONFLICT DO NOTHING;

-- Insert default users
INSERT INTO users (username, password, gender, type) VALUES
('testuser', '1234', 'Erkek', 'member'),
('demo', 'demo', 'Kadın', 'member')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (you can customize these)
CREATE POLICY "Users can read all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Everyone can read rooms" ON rooms FOR SELECT USING (true);
CREATE POLICY "Everyone can read messages" ON messages FOR SELECT USING (true);
CREATE POLICY "Everyone can insert messages" ON messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Everyone can read participants" ON room_participants FOR SELECT USING (true);
CREATE POLICY "Everyone can manage participants" ON room_participants FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();