import { Room, RoomEvent, Track } from 'livekit-client';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const KaylaAvatar = forwardRef(function KaylaAvatar({ livekitUrl, livekitToken, videoStyle = {} }, ref) {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const roomRef = useRef(null);

  useImperativeHandle(ref, () => ({
    speak(text) {
      const room = roomRef.current;
      if (!room) return;
      const encoder = new TextEncoder();
      const data = encoder.encode(
        JSON.stringify({
          event_type: 'avatar.speak_text',
          text: text,
        }),
      );
      room.localParticipant.publishData(data, {
        reliable: true,
        topic: 'agent-control',
      });
    },
  }));

  useEffect(() => {
    if (!livekitUrl || !livekitToken) return;
    const room = new Room();
    roomRef.current = room;
    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Video) {
        track.attach(videoRef.current);
      }
      if (track.kind === Track.Kind.Audio) {
        track.attach(audioRef.current);
        audioRef.current.play().catch(() => {});
      }
    });

    room
      .connect(livekitUrl, livekitToken)
      .then(() => {
        // Unlock iOS audio on first user interaction
        const unlock = () => {
          if (audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          document.removeEventListener('touchstart', unlock);
          document.removeEventListener('click', unlock);
        };
        document.addEventListener('touchstart', unlock);
        document.addEventListener('click', unlock);

        setTimeout(() => {
          const encoder = new TextEncoder();
          const data = encoder.encode(
            JSON.stringify({
              event_type: 'avatar.interrupt',
            }),
          );
          room.localParticipant.publishData(data, {
            reliable: true,
            topic: 'agent-control',
          });
        }, 300);
      })
      .catch(console.error);

    return () => {
      room.disconnect();
    };
  }, [livekitUrl, livekitToken]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        borderRadius: '0',
        background: 'transparent',
        transformStyle: 'preserve-3d',
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          borderRadius: '0',
          background: 'transparent',
          ...videoStyle,
        }}
      />
      <audio
        ref={audioRef}
        autoPlay
        playsInline
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '1px',
          height: '1px',
          opacity: 0.01,
        }}
      />
    </div>
  );
});

export default KaylaAvatar;