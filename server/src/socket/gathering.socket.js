const supabase = require('../config/db');

module.exports = (io) => {
  const canControl = async (inviteCode, profileId) => {
    if (!inviteCode || !profileId) return null;
    const { data: gathering } = await supabase
      .from('gatherings')
      .select('id, host_profile_id, is_live')
      .eq('invite_code', inviteCode)
      .maybeSingle();
    if (!gathering?.id || !gathering.is_live) return null;
    const { data: participant } = await supabase
      .from('gathering_participants')
      .select('id')
      .eq('gathering_id', gathering.id)
      .eq('profile_id', profileId)
      .maybeSingle();
    if (!participant?.id) return null;
    return gathering;
  };

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('gathering:join', async ({ inviteCode, profileId }) => {
      try {
        const profile = String(profileId || '');
        const code = String(inviteCode || '').toUpperCase();
        if (!profile || !code) {
          socket.emit('gathering:error', { message: 'Invalid gathering join payload' });
          return;
        }

        const gathering = await canControl(code, profile);
        if (!gathering) {
          socket.emit('gathering:error', { message: 'Gathering not found or access denied' });
          return;
        }

        socket.join(code);
        socket.profileId = profile;
        socket.inviteCode = code;
        socket.isHost = gathering.host_profile_id === profile;

        const { data: state } = await supabase
          .from('gatherings')
          .select('current_timestamp_sec, is_paused, host_profile_id')
          .eq('invite_code', code)
          .single();

        if (state) {
          socket.emit('gathering:state', {
            currentTimestamp: state.current_timestamp_sec,
            isPaused: state.is_paused,
            hostProfileId: state.host_profile_id,
          });
        }

        socket.to(code).emit('gathering:user-joined', { profileId: profile });
      } catch (e) {
        socket.emit('gathering:error', { message: 'Failed to join gathering' });
      }
    });

    socket.on('gathering:sync', async ({ inviteCode, currentTimestamp, isPaused }) => {
      try {
        const code = String(inviteCode || socket.inviteCode || '').toUpperCase();
        const profile = String(socket.profileId || '');
        const gathering = await canControl(code, profile);
        if (!gathering || gathering.host_profile_id !== profile) return;

        await supabase
          .from('gatherings')
          .update({ current_timestamp_sec: Number(currentTimestamp || 0), is_paused: !!isPaused })
          .eq('invite_code', code);

        socket.to(code).emit('gathering:sync', { currentTimestamp: Number(currentTimestamp || 0), isPaused: !!isPaused });
      } catch {}
    });

    socket.on('gathering:play', async ({ inviteCode }) => {
      const code = String(inviteCode || socket.inviteCode || '').toUpperCase();
      const profile = String(socket.profileId || '');
      const gathering = await canControl(code, profile);
      if (!code || !gathering || gathering.host_profile_id !== profile) return;
      socket.to(code).emit('gathering:play');
    });

    socket.on('gathering:pause', async ({ inviteCode }) => {
      const code = String(inviteCode || socket.inviteCode || '').toUpperCase();
      const profile = String(socket.profileId || '');
      const gathering = await canControl(code, profile);
      if (!code || !gathering || gathering.host_profile_id !== profile) return;
      socket.to(code).emit('gathering:pause');
    });

    socket.on('gathering:seek', async ({ inviteCode, timestamp }) => {
      const code = String(inviteCode || socket.inviteCode || '').toUpperCase();
      const profile = String(socket.profileId || '');
      const gathering = await canControl(code, profile);
      if (!code || !gathering || gathering.host_profile_id !== profile) return;
      socket.to(code).emit('gathering:seek', { timestamp: Number(timestamp || 0) });
    });

    socket.on('gathering:end', async ({ inviteCode }) => {
      const code = String(inviteCode || socket.inviteCode || '').toUpperCase();
      const profile = String(socket.profileId || '');
      const gathering = await canControl(code, profile);
      if (!code || !gathering || gathering.host_profile_id !== profile) return;
      await supabase
        .from('gatherings')
        .update({ is_live: false, ended_at: new Date().toISOString() })
        .eq('invite_code', code);
      io.to(code).emit('gathering:ended');
    });

    socket.on('disconnect', () => {
      if (socket.inviteCode) {
        socket.to(socket.inviteCode).emit('gathering:user-left', { profileId: socket.profileId });
      }
    });
  });
};
