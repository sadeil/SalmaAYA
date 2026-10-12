import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { RefreshCw, SwitchCamera } from "lucide-react";

// Wraps getUserMedia and exposes the underlying <video> via ref so the parent
// can hand it to MediaPipe's detectForVideo. The front camera is mirrored
// because users expect to see themselves "mirror-style"; the back camera is
// shown as-is. PoseCanvas reads `mirrored` from this ref to stay in sync.

function buildConstraintLadder(facingMode) {
  // Phones often reject exact resolutions or frame-rate caps, so we try
  // progressively looser constraints before giving up.
  return [
    {
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
    },
    { audio: false, video: { facingMode: { ideal: facingMode } } },
    { audio: false, video: true },
  ];
}

function describeCameraError(err) {
  if (typeof window !== "undefined" && window.isSecureContext === false) {
    return "The camera only works over HTTPS. Open the secure (https://) link of the app on your phone.";
  }
  switch (err?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "Camera permission was denied. Allow camera access for this site in your browser settings, then tap Try again.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No camera found on this device.";
    case "NotReadableError":
    case "AbortError":
      return "The camera is being used by another app. Close it and tap Try again.";
    default:
      return err?.message || "Could not start the camera.";
  }
}

export const CameraView = forwardRef(function CameraView(
  { onReady, onError, className = "" },
  ref,
) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [state, setState] = useState("idle"); // idle | requesting | ready | error
  const [errorMessage, setErrorMessage] = useState(null);
  const [facingMode, setFacingMode] = useState("user");
  const [canSwitch, setCanSwitch] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mirrored = facingMode === "user";

  useImperativeHandle(ref, () => ({
    get videoElement() {
      return videoRef.current;
    },
    get stream() {
      return streamRef.current;
    },
    get mirrored() {
      return mirrored;
    },
  }), [mirrored]);

  const stopStream = useCallback(() => {
    const stream = streamRef.current;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      setState("requesting");
      setErrorMessage(null);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error("Camera API is not available in this browser."), {
            name: window.isSecureContext === false ? "SecurityError" : "NotSupportedError",
          });
        }
        let stream = null;
        let lastError = null;
        for (const constraints of buildConstraintLadder(facingMode)) {
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            break;
          } catch (err) {
            lastError = err;
            // Permission problems won't be fixed by looser constraints.
            if (err.name === "NotAllowedError" || err.name === "SecurityError") break;
          }
        }
        if (!stream) throw lastError ?? new Error("Could not start the camera.");
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        // Safari needs an explicit play after metadata is ready.
        await new Promise((resolve) => {
          if (video.readyState >= 2) resolve();
          else video.onloadedmetadata = () => resolve();
        });
        await video.play();
        if (cancelled) return;
        setState("ready");
        onReady?.(video);

        // Only offer the flip button when there's more than one camera.
        // Labels/devices are only fully listed after permission is granted.
        navigator.mediaDevices.enumerateDevices?.()
          .then((devices) => {
            if (!cancelled) setCanSwitch(devices.filter((d) => d.kind === "videoinput").length > 1);
          })
          .catch(() => {});
      } catch (err) {
        if (cancelled) return;
        setErrorMessage(describeCameraError(err));
        setState("error");
        onError?.(err);
      }
    }
    start();
    return () => {
      cancelled = true;
      stopStream();
    };
    // Restart only when the camera direction changes or the user retries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode, attempt]);

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-ink ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="block h-full w-full object-cover"
        style={mirrored ? { transform: "scaleX(-1)" } : undefined}
      />
      {state === "ready" && canSwitch && (
        <button
          type="button"
          onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))}
          aria-label="Switch camera"
          className="pointer-events-auto absolute bottom-3 end-3 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-ink/55 text-white shadow-lg backdrop-blur-md transition hover:bg-ink/75 active:scale-95"
        >
          <SwitchCamera size={18} />
        </button>
      )}
      {state !== "ready" && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-ink/85 text-center text-white">
          {state !== "error" && (
            <div>
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              <p className="text-sm font-bold">Requesting camera access…</p>
            </div>
          )}
          {state === "error" && (
            <div className="max-w-sm px-6">
              <p className="text-sm font-extrabold text-rose-200">Camera unavailable</p>
              <p className="mt-2 text-xs leading-5 text-white/70">{errorMessage}</p>
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="pointer-events-auto mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-ink shadow-lg transition active:scale-95"
              >
                <RefreshCw size={14} /> Try again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
