import { useEffect, useRef, useState } from 'react';
import KaylaAvatar from './components/KaylaAvatar';

const BG = 'linear-gradient(165deg, #f5f0ff 0%, #e8deff 32%, #d8c9fc 58%, #c9b8f5 82%, #bfb0ef 100%)';
const PURPLE = '#5b21b6';
const NAVY = '#0f0a2e';
const ASK_TEXT = '#4c1d95';
const ANALYZE_URL = 'https://sixth-sense-production.up.railway.app/analyze';
const CONTACTS_API_URL = 'https://sixth-sense-production.up.railway.app/contacts';
const CONTACTS_ALERT_URL = 'https://sixth-sense-production.up.railway.app/contacts/alert';
const AUTO_UPDATE_INTERVAL_MS = 15_000;
const VOICE_COMMAND_COOLDOWN_MS = 5000;
const COUNTDOWN_SECONDS = 15;

let isSpeakingGlobal = false;

function buildFinalTranscript(event) {
  const { results, resultIndex } = event;
  let text = '';
  for (let i = resultIndex; i < results.length; i++) {
    if (results[i].isFinal) text += results[i][0]?.transcript ?? '';
  }
  return text.trim();
}

function hasNewFinalResult(event) {
  for (let i = event.resultIndex; i < event.results.length; i++) {
    if (event.results[i].isFinal) return true;
  }
  return false;
}

function parseDescriptionFromResponse(data) {
  if (typeof data === 'string') return data;
  if (data && typeof data.description === 'string') return data.description;
  if (data && typeof data.text === 'string') return data.text;
  if (data && typeof data.message === 'string') return data.message;
  return null;
}

function isCloseProximityDescription(text) {
  if (!text || typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  if (lower.includes('very close')) return true;
  return /\bclose\b/.test(lower);
}

function shouldApplyNarration(opts, isPaused) {
  return opts.updateNarration === true || !isPaused;
}

/** Launch hero: circular frame; ring diameters 1.45× and 1.6× avatar diameter. */
const LAUNCH_KAYLA_DIAM = 220;
const LAUNCH_KAYLA_OUTER_W = LAUNCH_KAYLA_DIAM;
const LAUNCH_KAYLA_OUTER_H = LAUNCH_KAYLA_DIAM;
const LAUNCH_KAYLA_OUTER_RADIUS = '50%';
const LAUNCH_KAYLA_INNER_RADIUS = '50%';
const LAUNCH_KAYLA_PAD = 3;
const LAUNCH_RING_OUTER = Math.round(1.6 * LAUNCH_KAYLA_DIAM);
const LAUNCH_RING_INNER = Math.round(1.45 * LAUNCH_KAYLA_DIAM);
const LAUNCH_AVATAR_ZONE_H = LAUNCH_RING_OUTER + 40;

function KaylaAvatarStage({compact = false }) {
  const z = compact
    ? {
        minHeight: '100%',
        perspective: '800px',
        deckW: Math.round(0.95 * LAUNCH_KAYLA_DIAM),
        deckH: 36,
        deckBottom: '4%',
        holo: Math.min(400, Math.round(LAUNCH_RING_OUTER * 1.05)),
        glowW: Math.round(0.88 * LAUNCH_KAYLA_DIAM),
        glowH: Math.round(0.88 * LAUNCH_KAYLA_DIAM),
        glowBg: 'linear-gradient(145deg, rgba(210,195,255,0.55), rgba(167,139,250,0.22))',
        ringOuter: LAUNCH_RING_OUTER,
        ringOuterBorder: '1px dashed rgba(196,167,255,0.32)',
        ringInner: LAUNCH_RING_INNER,
        ringInnerBorder: '1.5px dashed rgba(139,92,246,0.38)',
        orbTop: '-7px',
        orbSize: 12,
        orbML: '-6px',
        frameMaxW: LAUNCH_KAYLA_DIAM - LAUNCH_KAYLA_PAD * 2,
        frameMaxH: LAUNCH_KAYLA_DIAM - LAUNCH_KAYLA_PAD * 2,
        translateZ: 27,
        outerRadius: LAUNCH_KAYLA_OUTER_RADIUS,
        pad: LAUNCH_KAYLA_PAD,
        frameBg: 'linear-gradient(160deg, rgba(255,255,255,0.98), rgba(245,238,255,0.9), rgba(230,216,255,0.82))',
        frameShadow:
          '0 2px 0 rgba(255,255,255,0.75) inset, 0 10px 28px -12px rgba(15,10,46,0.2), 0 0 0 0.5px rgba(124,58,237,0.35)',
        innerRadius: LAUNCH_KAYLA_INNER_RADIUS,
        tagBottom: { bottom: '6px', left: '4px', padding: '8px 12px', maxW: 'min(220px, 88vw)', br: 13 },
        tagBodyFs: 13,
        tagTitleFs: 10,
        tagTop: { top: '6px', right: '4px', padding: '7px 12px', br: 13 },
        tagTopFs: 11,
      }
    : {
        minHeight: '160px',
        perspective: '880px',
        deckW: 200,
        deckH: 48,
        deckBottom: '6%',
        holo: 248,
        glowW: 180,
        glowH: 200,
        glowBg: 'linear-gradient(145deg, rgba(196,167,255,0.75), rgba(91,33,182,0.45), rgba(139,92,246,0.35))',
        ringOuter: 225,
        ringOuterBorder: '1px dashed rgba(196,167,255,0.35)',
        ringInner: 200,
        ringInnerBorder: '1.5px dashed rgba(139,92,246,0.45)',
        orbTop: '-6px',
        orbSize: 11,
        orbML: '-5.5px',
        frameMaxW: 224,
        frameMaxH: 286,
        translateZ: 36,
        outerRadius: '26px',
        pad: 2,
        frameBg: 'linear-gradient(145deg, rgba(255,255,255,0.55), rgba(167,139,250,0.35), rgba(91,33,182,0.5))',
        frameShadow: `
              0 1px 0 rgba(255,255,255,0.45) inset,
              0 -2px 12px rgba(91,33,182,0.35) inset,
              0 28px 56px -14px rgba(15,10,46,0.55),
              0 12px 0 -4px rgba(91,33,182,0.25),
              0 0 48px rgba(124,58,237,0.35)
            `,
        innerRadius: '24px',
        tagBottom: { bottom: '8px', left: '6px', padding: '11px 15px', maxW: 'min(210px, 56%)', br: 16 },
        tagBodyFs: 14,
        tagTitleFs: 10,
        tagTop: { top: '6px', right: '6px', padding: '9px 14px', br: 14 },
        tagTopFs: 11,
      };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: z.minHeight,
        perspective: z.perspective,
        perspectiveOrigin: '50% 40%',
      }}
    >
      {/* Ground plane / depth deck */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: z.deckBottom,
          width: `${z.deckW}px`,
          height: `${z.deckH}px`,
          transformStyle: 'preserve-3d',
          background: 'radial-gradient(ellipse 80% 100% at 50% 50%, rgba(124,58,237,0.45), rgba(91,33,182,0.12) 45%, transparent 72%)',
          filter: 'blur(10px)',
          animation: 'deckGlow 4s ease-in-out infinite',
          zIndex: 0,
          pointerEvents: screen === 'active' ? 'auto' : 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: screen === 'active' ? 0 : screen === 'launch' ? '38%' : 0,
          bottom: 0,
          margin: 'auto',
          width: `${z.holo}px`,
          height: `${z.holo}px`,
          borderRadius: '50%',
          background: 'conic-gradient(from 210deg, transparent 0deg, rgba(167,139,250,0.12) 60deg, transparent 120deg, rgba(196,181,255,0.1) 200deg, transparent 280deg)',
          animation: 'holoSweep 14s linear infinite',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: `${z.glowW}px`,
          height: `${z.glowH}px`,
          background: z.glowBg,
          borderRadius: '50% 50% 42% 42%',
          filter: 'blur(28px)',
          animation: 'glowPulse 3s ease-in-out infinite',
          left: '50%',
          top: '48%',
          transform: 'translate(-50%, -50%) translateZ(-20px)',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          margin: 'auto',
          width: `${z.ringOuter}px`,
          height: `${z.ringOuter}px`,
          borderRadius: '50%',
          border: z.ringOuterBorder,
          boxShadow: '0 0 24px rgba(124,58,237,0.25), inset 0 0 22px rgba(139,92,246,0.08)',
          animation: 'spin2 18s linear infinite',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          margin: 'auto',
          width: `${z.ringInner}px`,
          height: `${z.ringInner}px`,
          borderRadius: '50%',
          border: z.ringInnerBorder,
          boxShadow: '0 0 18px rgba(167,139,250,0.3), inset 0 0 16px rgba(124,58,237,0.06)',
          animation: 'spin1 12s linear infinite',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: z.orbTop,
            left: '50%',
            marginLeft: z.orbML,
            width: `${z.orbSize}px`,
            height: `${z.orbSize}px`,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #e9d5ff, #7c3aed 55%, #4c1d95)',
            boxShadow: '0 0 10px rgba(196,167,255,0.95), 0 0 22px rgba(124,58,237,0.85), 0 0 2px rgba(255,255,255,0.9) inset',
            animation: 'orbpulse 2.2s ease-in-out infinite',
          }}
        />
      </div>
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          width: '100%',
          height: '100%',
          maxWidth: `${z.frameMaxW + z.pad * 2}px`,
          maxHeight: `${z.frameMaxH + z.pad * 2}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transformStyle: 'preserve-3d',
          ...(compact
            ? {
                width: `${z.frameMaxW + z.pad * 2}px`,
                height: `${z.frameMaxH + z.pad * 2}px`,
                flexShrink: 0,
              }
            : {}),
        }}
      >
        <div
          style={{
            transform: `translateZ(${z.translateZ}px)`,
            transformStyle: 'preserve-3d',
            borderRadius: z.outerRadius,
            padding: `${z.pad}px`,
            background: z.frameBg,
            boxShadow: z.frameShadow,
            boxSizing: 'border-box',
            ...(compact
              ? {
                  width: `${z.frameMaxW + z.pad * 2}px`,
                  height: `${z.frameMaxH + z.pad * 2}px`,
                  flexShrink: 0,
                }
              : {}),
          }}
        >
          <div
            style={{
              borderRadius: z.innerRadius,
              overflow: 'hidden',
              background: 'transparent',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.25) inset',
              ...(compact
                ? {
                    width: `${z.frameMaxW}px`,
                    height: `${z.frameMaxH}px`,
                  }
                : {}),
            }}
          >
            <div style={{ width: '100%', height: '100%', background: 'rgba(124,58,237,0.15)', borderRadius: 'inherit' }} />
          </div>
        </div>
      </div>
      {compact ? (
        <>
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-178%)',
              zIndex: 3,
            }}
          >
            <div
              style={{
                background: 'linear-gradient(155deg, rgba(255,255,255,0.92), rgba(245,240,255,0.78))',
                backdropFilter: 'blur(14px) saturate(1.2)',
                WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
                borderRadius: `${z.tagBottom.br}px`,
                padding: z.tagBottom.padding,
                boxShadow: '0 4px 0 rgba(196,181,255,0.35), 0 12px 32px rgba(109,40,217,0.22), 0 0 0 1px rgba(255,255,255,0.5) inset',
                border: '1px solid rgba(196,181,255,0.45)',
                animation: 'tagFloat 4s ease-in-out infinite',
                maxWidth: z.tagBottom.maxW,
              }}
            >
              <div
                style={{
                  fontSize: `${z.tagTitleFs}px`,
                  fontWeight: 800,
                  color: '#6d28d9',
                  letterSpacing: '0.12em',
                  textShadow: '0 0 20px rgba(167,139,250,0.5)',
                }}
              >
                KAYLA SAYS
              </div>
              <div
                style={{
                  fontSize: `${z.tagBodyFs}px`,
                  fontWeight: 700,
                  color: NAVY,
                  marginTop: '3px',
                  textShadow: '0 1px 0 rgba(255,255,255,0.8)',
                }}
              >
                Hi! I am Kayla
              </div>
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              top: '28px',
              right: '50%',
              transform: 'translateX(188%)',
              zIndex: 3,
            }}
          >
            <div
              style={{
                background: 'linear-gradient(145deg, rgba(124,58,237,0.95), rgba(91,33,182,0.92), rgba(76,29,149,0.9))',
                borderRadius: `${z.tagTop.br}px`,
                padding: z.tagTop.padding,
                animation: 'tagFloat2 5s ease-in-out infinite',
                boxShadow: '0 0 0 1px rgba(255,255,255,0.22) inset, 0 6px 0 rgba(49,27,94,0.5), 0 16px 36px rgba(91,33,182,0.45), 0 0 28px rgba(167,139,250,0.35)',
                border: '1px solid rgba(196,167,255,0.35)',
              }}
            >
              <span
                style={{
                  fontSize: `${z.tagTopFs}px`,
                  fontWeight: 800,
                  color: '#f5f3ff',
                  letterSpacing: '0.14em',
                  textShadow: '0 0 12px rgba(255,255,255,0.35)',
                }}
              >
                Ai powered
              </span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div
            style={{
              position: 'absolute',
              bottom: z.tagBottom.bottom,
              left: z.tagBottom.left,
              zIndex: 3,
              background: 'linear-gradient(155deg, rgba(255,255,255,0.92), rgba(245,240,255,0.78))',
              backdropFilter: 'blur(14px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
              borderRadius: `${z.tagBottom.br}px`,
              padding: z.tagBottom.padding,
              boxShadow: '0 4px 0 rgba(196,181,255,0.35), 0 12px 32px rgba(109,40,217,0.22), 0 0 0 1px rgba(255,255,255,0.5) inset',
              border: '1px solid rgba(196,181,255,0.45)',
              animation: 'tagFloat 4s ease-in-out infinite',
              maxWidth: z.tagBottom.maxW,
            }}
          >
            <div
              style={{
                fontSize: `${z.tagTitleFs}px`,
                fontWeight: 800,
                color: '#6d28d9',
                letterSpacing: '0.12em',
                textShadow: '0 0 20px rgba(167,139,250,0.5)',
              }}
            >
              KAYLA SAYS
            </div>
            <div
              style={{
                fontSize: `${z.tagBodyFs}px`,
                fontWeight: 700,
                color: NAVY,
                marginTop: '5px',
                textShadow: '0 1px 0 rgba(255,255,255,0.8)',
              }}
            >
              Hi! I am Kayla
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              top: z.tagTop.top,
              right: z.tagTop.right,
              zIndex: 3,
              background: 'linear-gradient(145deg, rgba(124,58,237,0.95), rgba(91,33,182,0.92), rgba(76,29,149,0.9))',
              borderRadius: `${z.tagTop.br}px`,
              padding: z.tagTop.padding,
              animation: 'tagFloat2 5s ease-in-out infinite',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.22) inset, 0 6px 0 rgba(49,27,94,0.5), 0 16px 36px rgba(91,33,182,0.45), 0 0 28px rgba(167,139,250,0.35)',
              border: '1px solid rgba(196,167,255,0.35)',
            }}
          >
            <span
              style={{
                fontSize: `${z.tagTopFs}px`,
                fontWeight: 800,
                color: '#f5f3ff',
                letterSpacing: '0.14em',
                textShadow: '0 0 12px rgba(255,255,255,0.35)',
              }}
            >
              Ai powered
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const kaylaRef = useRef(null);
  const [livekitUrl, setLivekitUrl] = useState(null);
  const [livekitToken, setLivekitToken] = useState(null);
  const [screen, setScreen] = useState('launch');
  const [narration, setNarration] = useState('Path is clear.');
  const [isPaused, setIsPaused] = useState(false);
  const [autoUpdate, setAutoUpdate] = useState(false);
  const [contactsList, setContactsList] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [contactsFormError, setContactsFormError] = useState('');
  const [helpContactsList, setHelpContactsList] = useState([]);
  const [helpContactsLoading, setHelpContactsLoading] = useState(false);
  const [sosSecondsLeft, setSosSecondsLeft] = useState(null);
  const [helpSecondsLeft, setHelpSecondsLeft] = useState(null);
  const [ttsUi, setTtsUi] = useState({ speaking: false, source: null });

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const analyzeFrameRef = useRef(null);
  const isPausedRef = useRef(isPaused);
  const lastVoiceCommandAtRef = useRef(0);
  const commandInProgressRef = useRef(false);
  const manualStopRef = useRef(false);
  const screenRef = useRef(screen);

  useEffect(() => { screenRef.current = screen; }, [screen]);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  async function fetchAvatarSession() {
    try {
      const res = await fetch('https://sixth-sense-production.up.railway.app/avatar/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setLivekitUrl(data.livekit_url);
      setLivekitToken(data.livekit_client_token);
    } catch (err) {
      console.error('Avatar error:', err);
    }
  }

  function stopSpeaking() {
    setTtsUi({ speaking: false, source: null });
  }

  function speakDescription(text, { source = 'auto' } = {}) {
  if (!text) return;
  if (isPausedRef.current && source !== 'triggered') return;
  if (kaylaRef.current) {
    kaylaRef.current.speak(text);
  }
  setTtsUi({ speaking: true, source });
  setTimeout(() => {
    setTtsUi({ speaking: false, source: null });
  }, Math.max(3000, text.length * 60));
}

  function handleKaylaVoiceCommand(transcript) {
    const t = transcript.toLowerCase();

    if (t.includes('hey kayla cancel')) {
      if (screenRef.current === 'sos' || screenRef.current === 'help') {
        stopSpeaking();
        setIsPaused(false);
        setScreen('active');
        return true;
      }
      return false;
    }
    if (t.includes('hey kayla turn auto on') || t.includes('hey kayla turn on auto updates')) {
      setAutoUpdate(true);
      setNarration('Auto updates on');
      speakDescription('Auto updates on', { source: 'triggered' });
      return true;
    }
    if (t.includes('hey kayla turn auto off') || t.includes('hey kayla turn off auto updates')) {
      setAutoUpdate(false);
      setNarration('Auto updates off');
      speakDescription('Auto updates off', { source: 'triggered' });
      return true;
    }
    if (t.includes('hey kayla help')) {
      setScreen('help');
      return true;
    }
    if (t.includes('hey kayla sos')) {
      setScreen('sos');
      return true;
    }
    if (t.includes('hey kayla update')) {
      setIsPaused(false);
      queueMicrotask(() => analyzeFrameRef.current?.({ updateNarration: true, speechSource: 'triggered' }));
      return true;
    }
    if (t.includes('hey kayla pause')) {
      setIsPaused(true);
      stopSpeaking();
      return true;
    }
    if (t.includes('hey kayla resume')) {
      setIsPaused(false);
      queueMicrotask(() => analyzeFrameRef.current?.({ updateNarration: true, speechSource: 'triggered' }));
      return true;
    }
    return false;
  }

  useEffect(() => {
    fetchAvatarSession();
  }, []);

  useEffect(() => {
    const stopFully = screen === 'launch' || screen === 'contacts';
    if (stopFully) {
      setIsPaused(false);
      setAutoUpdate(false);
      stopSpeaking();
      if (intervalRef.current != null) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
      const el = videoRef.current;
      if (el) el.srcObject = null;
      return undefined;
    }

    if (screen !== 'active') {
      if (intervalRef.current != null) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
      const el = videoRef.current;
      if (el) el.srcObject = null;
      return undefined;
    }

    let cancelled = false;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const analyzeLockRef = { current: false };

    async function analyzeFrameImpl(opts = {}) {
      const video = videoRef.current;
      const stream = streamRef.current;
      if (cancelled || !video || !stream || analyzeLockRef.current) return;
      const track = stream.getVideoTracks()[0];
      if (!track || track.readyState !== 'live') return;
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return;
      const allowNarration = shouldApplyNarration(opts, isPausedRef.current);
      analyzeLockRef.current = true;
      try {
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
        const res = await fetch(ANALYZE_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        });
        if (cancelled || !res.ok) {
          if (!cancelled && !res.ok && allowNarration) setNarration('Analysis request failed. Path is clear.');
          return;
        }
        const data = await res.json().catch(() => null);
        const description = parseDescriptionFromResponse(data);
        if (cancelled || !description) return;
        if (allowNarration) {
          setNarration(description);
          speakDescription(description, { source: opts.speechSource ?? 'auto' });
        }
      } catch {
        if (!cancelled && shouldApplyNarration(opts, isPausedRef.current)) {
          setNarration('Unable to reach analysis service.');
        }
      } finally {
        analyzeLockRef.current = false;
      }
    }

    analyzeFrameRef.current = (o) => analyzeFrameImpl(o);

    (async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const el = videoRef.current;
        if (el) { el.srcObject = stream; await el.play().catch(() => {}); }
      } catch {
        if (!cancelled) setNarration('Camera access is required for vision assistance.');
      }
    })();

    return () => {
      cancelled = true;
      analyzeFrameRef.current = null;
      if (intervalRef.current != null) { clearInterval(intervalRef.current); intervalRef.current = null; }
      if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
      const el = videoRef.current;
      if (el) el.srcObject = null;
    };
  }, [screen]);

  useEffect(() => {
  if (screen !== 'active' || isPaused) {
    if (intervalRef.current != null) { clearInterval(intervalRef.current); intervalRef.current = null; }
    return undefined;
  }
  let cancelled = false;
  const tick = () => { if (!cancelled && analyzeFrameRef.current) analyzeFrameRef.current({ updateNarration: true, speechSource: 'auto' }); };
  tick();
  intervalRef.current = window.setInterval(tick, AUTO_UPDATE_INTERVAL_MS);
  return () => { cancelled = true; if (intervalRef.current != null) { clearInterval(intervalRef.current); intervalRef.current = null; } };
}, [screen, isPaused]);

  useEffect(() => {
    if (screen !== 'contacts') return undefined;
    let cancelled = false;
    (async function loadContacts() {
      setContactsLoading(true);
      try {
        const res = await fetch(CONTACTS_API_URL);
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setContactsList(Array.isArray(data.contacts) ? data.contacts.slice(0, 4) : []);
      } catch { if (!cancelled) setContactsList([]); }
      finally { if (!cancelled) setContactsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [screen]);

  useEffect(() => {
    if (screen !== 'help') return undefined;
    let cancelled = false;
    (async function loadHelpContacts() {
      setHelpContactsLoading(true);
      try {
        const res = await fetch(CONTACTS_API_URL);
        const data = await res.json().catch(() => ({}));
        if (!cancelled && Array.isArray(data.contacts)) setHelpContactsList(data.contacts.slice(0, 4));
      } catch { if (!cancelled) setHelpContactsList([]); }
      finally { if (!cancelled) setHelpContactsLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [screen]);

  useEffect(() => {
    if (screen !== 'help') { setHelpSecondsLeft(null); return undefined; }
    setHelpSecondsLeft(COUNTDOWN_SECONDS);

    speakDescription('Contacting your emergency contacts in 15 seconds, say cancel or press cancel to stop.', { source: 'triggered' });
    let remaining = COUNTDOWN_SECONDS;
    const intervalId = window.setInterval(() => {
      remaining -= 1;
      setHelpSecondsLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(intervalId);
        void fetch(CONTACTS_ALERT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: null }) }).catch(() => {});
      }
    }, 1000);
    return () => { window.clearInterval(intervalId); };
  }, [screen]);

  useEffect(() => {
    if (screen !== 'sos') { setSosSecondsLeft(null); return undefined; }
    setSosSecondsLeft(COUNTDOWN_SECONDS);
    speakDescription('Calling 9 1 1 in 15 seconds, say cancel or press cancel to stop.', { source: 'triggered' });
    let remaining = COUNTDOWN_SECONDS;
    const intervalId = window.setInterval(() => {
      remaining -= 1;
      setSosSecondsLeft(remaining);
      if (remaining <= 0) { window.clearInterval(intervalId); window.location.href = 'tel:911'; }
    }, 1000);
    return () => { window.clearInterval(intervalId); };
  }, [screen]);

  useEffect(() => {
    if (screen !== 'active' && screen !== 'sos' && screen !== 'help') return undefined;
    const SpeechRecognition = window.webkitSpeechRecognition;
    if (!SpeechRecognition) { console.log('Speech not supported'); return undefined; }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => console.log('Recognition started');
    recognition.onresult = (event) => {
      if (commandInProgressRef.current) return;
      if (!hasNewFinalResult(event)) return;
      const now = Date.now();
      if (now - lastVoiceCommandAtRef.current < VOICE_COMMAND_COOLDOWN_MS) return;
      const transcript = buildFinalTranscript(event);
      if (!transcript) return;
      if (!transcript.toLowerCase().includes('hey kayla')) return;
      commandInProgressRef.current = true;
      lastVoiceCommandAtRef.current = Date.now();
      console.log(`Heard (final): ${transcript}`);
      const handled = handleKaylaVoiceCommand(transcript);
      if (handled) {
        manualStopRef.current = true;
        try { recognition.stop(); } catch { }
      } else {
        commandInProgressRef.current = false;
      }
    };
    recognition.onerror = (e) => { if (e.error !== 'aborted') console.log('Error:', e.error); };
    let alive = true;
    recognition.onend = () => {
      if (!alive) return;
      if (manualStopRef.current) {
        manualStopRef.current = false;
        commandInProgressRef.current = false;
        setTimeout(() => {
          if (!alive) return;
          try { recognition.start(); } catch { }
        }, 500);
        return;
      }
      try { recognition.start(); } catch { }
      manualStopRef.current = false;
    };
    try { recognition.start(); } catch { }
    return () => {
      alive = false;
      commandInProgressRef.current = false;
      manualStopRef.current = false;
      lastVoiceCommandAtRef.current = 0;
      try { recognition.stop(); } catch { }
      recognition.onresult = null;
      recognition.onstart = null;
      recognition.onerror = null;
      recognition.onend = null;
    };
  }, [screen]);

  const hiddenVideoStyle = {
    position: 'fixed', width: '2px', height: '2px', opacity: 0,
    pointerEvents: 'none', left: 0, top: 0, overflow: 'hidden',
  };

  const shell = {
    minHeight: '100dvh',
    background: BG,
    color: NAVY,
    boxSizing: 'border-box',
    padding: '20px 20px 28px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: '-apple-system, system-ui, sans-serif',
    WebkitFontSmoothing: 'antialiased',
  };

  const goActive = () => { setIsPaused(false); setScreen('active'); };
  const cancelCountdownAndGoActive = () => { stopSpeaking(); goActive(); };

  return (
    <>
      <style>{`
        @keyframes sixthSenseSosPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 14px rgba(239,68,68,0.55)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 32px rgba(239,68,68,0.95)); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes ripple {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(1.7); opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes eyeBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes eyeRoam {
          0% { transform: translate(0, 0); }
          25% { transform: translate(2px, -2px); }
          50% { transform: translate(0, -3px); }
          75% { transform: translate(-2px, -2px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes ringRotate {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes ringPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
        }
        @keyframes spin1 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin2 {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        @keyframes float3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float3d {
          0%, 100% { transform: translateY(0px) translateZ(0px) rotateX(1deg) scale(1); }
          50% { transform: translateY(-10px) translateZ(12px) rotateX(-2deg) scale(1.02); }
        }
        @keyframes float3dLaunch {
          0%, 100% { transform: translateY(0px) translateZ(0px) rotateX(2deg) scale(1); }
          50% { transform: translateY(-20px) translateZ(25px) rotateX(-4.5deg) scale(1.07); }
        }
        @keyframes holoSweep {
          0% { transform: rotate(0deg) scale(1); opacity: 0.35; }
          50% { opacity: 0.65; }
          100% { transform: rotate(360deg) scale(1.05); opacity: 0.35; }
        }
        @keyframes deckGlow {
          0%, 100% { opacity: 0.22; transform: translateX(-50%) rotateX(78deg) scaleX(1); }
          50% { opacity: 0.48; transform: translateX(-50%) rotateX(78deg) scaleX(1.1); }
        }
        @keyframes wave {
          0%, 100% { height: 6px; }
          25% { height: 14px; }
          50% { height: 10px; }
          75% { height: 18px; }
        }
        @keyframes wave2 {
          0%, 100% { height: 10px; }
          25% { height: 6px; }
          50% { height: 16px; }
          75% { height: 8px; }
        }
        @keyframes wave3 {
          0%, 100% { height: 14px; }
          25% { height: 8px; }
          50% { height: 6px; }
          75% { height: 12px; }
        }
        @keyframes orbpulse {
          0%, 100% { opacity: 0.45; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes tagFloat {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-5px) rotate(-2deg); }
        }
        @keyframes tagFloat2 {
          0%, 100% { transform: translateY(0px) rotate(2deg); }
          50% { transform: translateY(-7px) rotate(2deg); }
        }
        .sixth-sense-bg {
          position: relative;
          overflow: hidden;
        }
        .sixth-sense-bg::before {
          content: '';
          position: absolute;
          top: -80px;
          left: -80px;
          width: 280px;
          height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(167,139,250,0.48), rgba(196,167,255,0.2) 45%, transparent 72%);
          pointer-events: none;
          z-index: 0;
        }
        .sixth-sense-bg::after {
          content: '';
          position: absolute;
          bottom: -60px;
          right: -60px;
          width: 240px;
          height: 240px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,92,246,0.22), rgba(255,200,230,0.18) 50%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }
        .sixth-sense-bg > * {
          position: relative;
          z-index: 1;
        }
        .sixth-sense-bg.sixth-sense-bg--launch {
          overflow: visible;
        }
        .granny {
          position: relative;
          width: 120px;
          margin: 0 auto;
          animation: ladySway 3.2s ease-in-out infinite;
          transform-origin: center bottom;
        }
        .granny-head {
          width: 48px;
          height: 44px;
          background: #f0c4b2;
          border-radius: 50%;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }
        .granny-hair {
          width: 52px;
          height: 40px;
          background: #d8d2dc;
          border-radius: 50%;
          position: absolute;
          top: -10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 3;
        }
        .granny-bun {
          width: 28px;
          height: 28px;
          background: #c4c0ca;
          border-radius: 50%;
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 4;
        }
        .granny-eye-left, .granny-eye-right {
          width: 7px;
          height: 8px;
          background: #4c1d95;
          border-radius: 50%;
          position: absolute;
          top: 18px;
          z-index: 5;
        }
        .granny-eye-left { left: 10px; }
        .granny-eye-right { right: 10px; }
        .granny-smile {
          width: 20px;
          height: 10px;
          border-bottom: 2px solid #b87a6a;
          border-radius: 0 0 50% 50%;
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
        }
        .granny-body {
          width: 70px;
          height: 110px;
          background: linear-gradient(135deg, #c4b5fd, #7c3aed, #5b21b6);
          border-radius: 35px 35px 30px 30px;
          margin: -6px auto 0;
          position: relative;
          z-index: 1;
        }
        .granny-arm-left {
          width: 18px;
          height: 50px;
          background: #f0c4b2;
          border-radius: 10px;
          position: absolute;
          top: 10px;
          left: -12px;
          transform: rotate(15deg);
        }
        .granny-foot-left, .granny-foot-right {
          width: 26px;
          height: 20px;
          background: #4c1d95;
          border-radius: 10px;
          position: absolute;
          bottom: -10px;
        }
        .granny-foot-left { left: 8px; }
        .granny-foot-right { right: 8px; }
        .granny-cane {
          width: 4px;
          height: 120px;
          background: #f5f5f5;
          border-radius: 2px;
          position: absolute;
          bottom: -10px;
          right: -30px;
          transform: rotate(20deg);
          transform-origin: top center;
          animation: caneTap 2.5s ease-in-out infinite;
        }
        .granny-cane::after {
          content: '';
          width: 10px;
          height: 10px;
          background: #374151;
          border-radius: 50%;
          position: absolute;
          bottom: -5px;
          left: -3px;
        }
        .granny-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px dashed rgba(124,58,237,0.4);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: sensePulse 4s ease-in-out infinite;
          pointer-events: none;
        }
        .granny-ring-1 { width: 180px; height: 180px; }
        .granny-ring-2 { width: 230px; height: 230px; animation-delay: 0.8s; }
        .granny-glow {
          width: 160px;
          height: 160px;
          background: radial-gradient(circle, rgba(124,58,237,0.18), transparent 70%);
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        @keyframes ladySway {
          0%, 100% { transform: rotate(-1.5deg) translateY(0px); }
          50% { transform: rotate(1.5deg) translateY(-4px); }
        }
        @keyframes caneTap {
          0%, 100% { transform: rotate(20deg); }
          50% { transform: rotate(25deg); }
        }
        @keyframes sensePulse {
          0%, 100% { opacity: 0.25; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.55; transform: translate(-50%, -50%) scale(1.07); }
        }
      `}</style>

      <video ref={videoRef} autoPlay playsInline muted aria-hidden style={hiddenVideoStyle} />
        <div style={{
    position: 'fixed',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: screen === 'active' ? '100%' : '1px',
    maxWidth: screen === 'active' ? '420px' : '1px',
    height: screen === 'active' ? 'min(42dvh, 300px)' : '1px',
    opacity: screen === 'active' ? 1 : 0,
    pointerEvents: screen === 'active' ? 'auto' : 'none',
    zIndex: screen === 'active' ? 2 : -1,
    borderRadius: screen === 'active' ? '28px 28px 0 0' : '0',
    background: screen === 'active' ? 'linear-gradient(160deg, #c4b0ff, #9d7ef5, #7c3aed)' : 'transparent',
    border: screen === 'active' ? '3px solid rgba(255,255,255,0.85)' : 'none',
    boxShadow: screen === 'active' ? '0 8px 32px rgba(91,33,182,0.18)' : 'none',
    padding: screen === 'active' ? '8px' : '0',
    boxSizing: 'border-box',
  }}>
    <KaylaAvatar ref={kaylaRef} livekitUrl={livekitUrl} livekitToken={livekitToken} />
  </div>


      {screen === 'launch' && (
        <div
          className="sixth-sense-bg sixth-sense-bg--launch"
          style={{
            minHeight: '100dvh',
            boxSizing: 'border-box',
            background: BG,
            color: NAVY,
            fontFamily: '-apple-system, system-ui, sans-serif',
            WebkitFontSmoothing: 'antialiased',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '0 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxSizing: 'border-box',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '14px',
                flexShrink: 0,
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '30px', height: '30px', background: PURPLE, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.5"/><circle cx="7" cy="7" r="2" fill="white"/></svg>
                </div>
                <span style={{ fontSize: '17px', fontWeight: 600, color: NAVY }}>Sixth Sense</span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: 600, color: '#9d7ef5' }}>Skip</span>
            </div>

            <div style={{ marginTop: '12px', animation: 'fadeUp .55s ease both', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 'clamp(26px, 7vw, 34px)',
                  fontWeight: 800,
                  color: NAVY,
                  lineHeight: 1.12,
                  letterSpacing: '-0.5px',
                  textAlign: 'center',
                }}
              >
                See the World Through Kayla
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6b7280', lineHeight: 1.5, textAlign: 'center', fontWeight: 500, maxWidth: '340px' }}>
                Real-time vision assistance powered by Kayla
              </p>
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                {['Live Vision', 'Voice Commands', 'SOS Alerts'].map((label, i) => (
                  <span
                    key={label}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '7px 15px',
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.88)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '0.5px solid rgba(124,58,237,0.45)',
                      color: PURPLE,
                      fontSize: '14px',
                      fontWeight: 600,
                      animation: 'float 2s ease-in-out infinite',
                      animationDelay: `${i * 0.3}s`,
                    }}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              width: '100%',
              maxWidth: '420px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 0,
              gap: '4px',
            }}
          ><div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
  <div className="granny-glow"></div>
  <div className="granny-ring granny-ring-1"></div>
  <div className="granny-ring granny-ring-2"></div>
  <div className="granny">
    <div className="granny-head">
      <div className="granny-hair">
        <div className="granny-bun"></div>
      </div>
      <div className="granny-eye-left"></div>
      <div className="granny-eye-right"></div>
      <div className="granny-smile"></div>
    </div>
    <div className="granny-body">
      <div className="granny-arm-left"></div>
      <div className="granny-foot-left"></div>
      <div className="granny-foot-right"></div>
      <div className="granny-cane"></div>
    </div>
  </div>
</div>

            <div
              style={{
                width: '100%',
                padding: '4px 20px max(8px, env(safe-area-inset-bottom, 0px))',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '8px' }}>
                <div style={{ width: '22px', height: '4px', borderRadius: '2px', background: NAVY }} />
                <div style={{ width: '8px', height: '4px', borderRadius: '2px', background: '#d1c4ff' }} />
                <div style={{ width: '8px', height: '4px', borderRadius: '2px', background: '#d1c4ff' }} />
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'nowrap',
                  gap: '6px',
                  justifyContent: 'center',
                  marginBottom: '10px',
                  width: '100%',
                  maxWidth: '380px',
                }}
              >
                {[
                  { id: 'free', text: '100% Free' },
                  { id: 'a11y', text: '♿ Accessibility First' },
                  { id: 'ai', text: 'Computer vision' },
                ].map(({ id, text }) => (
                  <div
                    key={id}
                    style={{
                      flex: '1 1 0',
                      minWidth: 0,
                      padding: '10px 6px',
                      borderRadius: '12px',
                      background: 'rgba(255,255,255,0.88)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '0.5px solid rgba(255,255,255,0.65)',
                      boxShadow: '0 4px 16px rgba(91,33,182,0.06)',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: NAVY,
                        lineHeight: 1.25,
                        letterSpacing: '0.01em',
                      }}
                    >
                      {text}
                    </div>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={goActive}
                style={{
                  width: '100%',
                  maxWidth: '380px',
                  height: '52px',
                  background: '#0f0a2e',
                  border: 'none',
                  borderRadius: '16px',
                  color: '#fdfcff',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(15,10,46,.25)',
                  letterSpacing: '.2px',
                }}
              >
                Get Started →
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === 'active' && (
        <div className="sixth-sense-bg" style={{ ...shell, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, marginBottom: '12px', paddingTop: 'min(42dvh, 300px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.65)', border: '0.5px solid rgba(196,181,255,0.5)', borderRadius: '20px', padding: '5px 12px' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isPaused ? '#6b7280' : '#22c55e', animation: isPaused ? 'none' : 'blink 1.5s ease-in-out infinite' }} />
                <span style={{ fontSize: '12px', fontWeight: 500, color: PURPLE }}>
                  {isPaused ? 'Paused' : 'Listening...'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', color: '#7c6fa0' }}>Auto</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoUpdate}
                  onClick={() => setAutoUpdate((v) => !v)}
                  style={{ position: 'relative', width: '36px', height: '20px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: autoUpdate ? PURPLE : '#c4b5fd', padding: 0, transition: 'background .15s' }}
                >
                  <span style={{ position: 'absolute', top: '3px', left: autoUpdate ? '19px' : '3px', width: '14px', height: '14px', borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                </button>
              </div>

              <button
                type="button"
                aria-label="Emergency contacts"
                onClick={() => setScreen('contacts')}
                style={{ width: '34px', height: '34px', background: 'rgba(255,255,255,0.65)', border: '0.5px solid rgba(196,181,255,0.5)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0h-.29c.28.62.29 1.26.29 1.91V19h6v-1.5c0-1.47-2.97-2.5-6-2.5z" fill="#7c6fa0"/></svg>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', flexShrink: 0, paddingTop: '280px' }}>
              <div
                role="status"
                aria-live="polite"
                style={{ width: '100%', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)', border: '0.5px solid rgba(196,181,255,0.4)', borderRadius: '16px', padding: '14px 16px' }}
              >
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#9d7ef5', letterSpacing: '.8px', marginBottom: '5px' }}>KAYLA SAYS</div>
                <div style={{ fontSize: '15px', color: NAVY, lineHeight: 1.5 }}>{narration}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: 'auto', paddingTop: '16px', flexShrink: 0 }}>
              <button type="button" onClick={() => analyzeFrameRef.current?.({ updateNarration: true, speechSource: 'triggered' })} style={{ height: '48px', fontSize: '14px', fontWeight: 600, color: ASK_TEXT, background: 'rgba(255,255,255,0.6)', border: '0.5px solid #c4b5fd', borderRadius: '14px', cursor: 'pointer' }}>Ask</button>
              <button type="button" onClick={() => { if (isPaused) { setIsPaused(false); queueMicrotask(() => analyzeFrameRef.current?.({ updateNarration: true, speechSource: 'triggered' })); } else { setIsPaused(true); stopSpeaking(); } }} style={{ height: '48px', fontSize: '14px', fontWeight: 600, color: '#fdfcff', background: '#dc2626', border: 'none', borderRadius: '14px', cursor: 'pointer' }}>{isPaused ? 'Resume' : 'Pause'}</button>
              <button type="button" onClick={() => setScreen('sos')} style={{ height: '48px', fontSize: '14px', fontWeight: 600, color: '#fdfcff', background: '#0f0a2e', border: 'none', borderRadius: '14px', cursor: 'pointer' }}>SOS</button>
            </div>
          </div>
      )}

      {screen === 'contacts' && (
        <div className="sixth-sense-bg" style={shell}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <button type="button" aria-label="Back to active screen" onClick={() => setScreen('active')} style={{ flexShrink: 0, width: '40px', height: '40px', border: '0.5px solid rgba(196,181,255,0.4)', borderRadius: '10px', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)', color: NAVY, fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>←</button>
            <h1 style={{ margin: 0, flex: 1, fontSize: '20px', fontWeight: 700, color: NAVY, textAlign: 'center' }}>Emergency Contacts</h1>
            <span style={{ width: '40px', flexShrink: 0 }} aria-hidden />
          </div>
          {contactsLoading ? (
            <p style={{ color: '#7c6fa0', textAlign: 'center', margin: '24px 0' }}>Loading…</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto', marginBottom: '16px' }}>
              {contactsList.map((c, index) => (
                <li key={`${c.name}-${c.phone}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)', border: '0.5px solid rgba(196,181,255,0.4)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: 600, color: NAVY }}>{c.name}</div>
                    <div style={{ fontSize: '14px', color: '#7c6fa0', marginTop: '4px' }}>{c.phone}</div>
                  </div>
                  <button type="button" aria-label={`Delete ${c.name}`} onClick={async () => {
                    try {
                      const res = await fetch(`${CONTACTS_API_URL}/${index}`, { method: 'DELETE' });
                      const data = await res.json().catch(() => ({}));
                      if (res.ok && Array.isArray(data.contacts)) setContactsList(data.contacts.slice(0, 4));
                    } catch { }
                  }} style={{ flexShrink: 0, padding: '8px 12px', fontSize: '13px', fontWeight: 600, color: '#fdfcff', background: '#dc2626', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Delete</button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={async (e) => {
            e.preventDefault();
            setContactsFormError('');
            const name = newContactName.trim();
            const phone = newContactPhone.trim();
            if (!name || !phone) { setContactsFormError('Name and phone are required.'); return; }
            try {
              const res = await fetch(CONTACTS_API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone }) });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) { setContactsFormError(data.error || 'Could not add contact.'); return; }
              if (Array.isArray(data.contacts)) setContactsList(data.contacts.slice(0, 4));
              setNewContactName('');
              setNewContactPhone('');
            } catch { setContactsFormError('Network error.'); }
          }} style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '0.5px solid rgba(196,181,255,0.4)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {contactsFormError ? <p style={{ margin: 0, fontSize: '13px', color: '#f87171' }}>{contactsFormError}</p> : null}
            <input type="text" placeholder="Name" value={newContactName} onChange={(e) => setNewContactName(e.target.value)} autoComplete="name" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: '16px', borderRadius: '10px', border: '0.5px solid rgba(196,181,255,0.4)', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)', color: NAVY }} />
            <input type="tel" placeholder="Phone Number" value={newContactPhone} onChange={(e) => setNewContactPhone(e.target.value)} autoComplete="tel" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: '16px', borderRadius: '10px', border: '0.5px solid rgba(196,181,255,0.4)', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)', color: NAVY }} />
            <button type="submit" style={{ padding: '14px 16px', fontSize: '15px', fontWeight: 600, color: '#fdfcff', background: '#0f0a2e', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>Add</button>
          </form>
        </div>
      )}

      {screen === 'sos' && (
        <div className="sixth-sense-bg" style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '24px 24px 40px', fontFamily: '-apple-system, system-ui, sans-serif', color: NAVY }}>
          <div aria-hidden style={{ fontSize: '64px', animation: 'sixthSenseSosPulse 1.2s ease-in-out infinite' }}>📞</div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#dc2626', textAlign: 'center' }}>Calling 911</h1>
          <div aria-live="polite" style={{ fontSize: '64px', fontWeight: 800, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
            {sosSecondsLeft != null ? sosSecondsLeft : COUNTDOWN_SECONDS}
          </div>
          <button type="button" onClick={cancelCountdownAndGoActive} style={{ width: '180px', height: '180px', background: '#dc2626', border: 'none', borderRadius: '50%', color: '#fdfcff', fontSize: '20px', fontWeight: 800, cursor: 'pointer', letterSpacing: '1px', boxShadow: '0 8px 32px rgba(220,38,38,0.4)' }}>
            CANCEL
          </button>
          <div style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)', border: '0.5px solid rgba(196,181,255,0.4)', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', color: NAVY, textAlign: 'center' }}>
            Say "Hey Kayla cancel" to stop
          </div>
        </div>
      )}

      {screen === 'help' && (
        <div className="sixth-sense-bg" style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px 24px 40px', fontFamily: '-apple-system, system-ui, sans-serif', color: NAVY }}>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: NAVY, textAlign: 'center', maxWidth: '280px', lineHeight: 1.3 }}>Contacting Emergency Contacts</h2>
          <div aria-live="polite" style={{ fontSize: '64px', fontWeight: 800, color: '#dc2626', fontVariantNumeric: 'tabular-nums' }}>
            {helpSecondsLeft != null ? helpSecondsLeft : COUNTDOWN_SECONDS}
          </div>
          {helpContactsLoading ? (
            <p style={{ color: '#7c6fa0', margin: 0 }}>Loading contacts…</p>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto' }}>
              {helpContactsList.map((c, index) => (
                <li key={`${c.name}-${index}`} style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)', border: '0.5px solid rgba(196,181,255,0.4)' }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: NAVY }}>{c.name}</div>
                  <div style={{ fontSize: '13px', color: '#7c6fa0', marginTop: '2px' }}>{c.phone}</div>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={cancelCountdownAndGoActive} style={{ width: '180px', height: '180px', background: '#dc2626', border: 'none', borderRadius: '50%', color: '#fdfcff', fontSize: '20px', fontWeight: 800, cursor: 'pointer', letterSpacing: '1px', boxShadow: '0 8px 32px rgba(220,38,38,0.4)' }}>
            CANCEL
          </button>
          <div style={{ background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)', border: '0.5px solid rgba(196,181,255,0.4)', borderRadius: '12px', padding: '10px 16px', fontSize: '13px', color: NAVY, textAlign: 'center' }}>
            Say "Hey Kayla cancel" to stop
          </div>
        </div>
      )}
    </>
  );
}