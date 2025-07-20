const { supabase } = require('../config/supabase');

class DatabaseService {
  // User operations
  async getUserByUsername(username) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }
    
    return data;
  }

  async createUser(username, password, gender, type = 'member') {
    const { data, error } = await supabase
      .from('users')
      .insert([{ username, password, gender, type }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateUser(username, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('username', username)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Room operations
  async getRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  async getRoomById(roomId) {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomId)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Message operations
  async saveMessage(roomId, userId, sender, message, messageType = 'text') {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ room_id: roomId, user_id: userId, sender, message, message_type: messageType }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getMessagesByRoom(roomId, limit = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data.reverse(); // Return in chronological order
  }

  // Room participants operations
  async joinRoom(roomId, userId, username, socketId) {
    const { data, error } = await supabase
      .from('room_participants')
      .upsert([{ 
        room_id: roomId, 
        user_id: userId, 
        username, 
        socket_id: socketId,
        joined_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async leaveRoom(roomId, userId) {
    const { error } = await supabase
      .from('room_participants')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  async leaveAllRooms(userId) {
    const { error } = await supabase
      .from('room_participants')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
  }

  async getRoomParticipants(roomId) {
    const { data, error } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', roomId);
    
    if (error) throw error;
    return data;
  }

  async updateParticipantStatus(roomId, userId, updates) {
    const { data, error } = await supabase
      .from('room_participants')
      .update(updates)
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async removeParticipantBySocketId(socketId) {
    const { error } = await supabase
      .from('room_participants')
      .delete()
      .eq('socket_id', socketId);
    
    if (error) throw error;
  }

  // Real-time subscriptions
  subscribeToMessages(roomId, callback) {
    return supabase
      .channel(`messages:${roomId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        callback
      )
      .subscribe();
  }

  subscribeToRoomParticipants(roomId, callback) {
    return supabase
      .channel(`participants:${roomId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'room_participants', filter: `room_id=eq.${roomId}` },
        callback
      )
      .subscribe();
  }

  // Cleanup old data
  async cleanupOldMessages(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const { error } = await supabase
      .from('messages')
      .delete()
      .lt('created_at', cutoffDate.toISOString());
    
    if (error) throw error;
  }
}

module.exports = new DatabaseService();