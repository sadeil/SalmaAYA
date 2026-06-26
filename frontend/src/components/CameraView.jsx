import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

// Wraps getUserMedia and exposes the underlying <video> via ref so the parent
// can hand it to MediaPipe's detectForVideo. We mirror the feed horizontally
// because users expect to see themselves "mirror-style" and so does the
// canvas overlay.

const DEFAULT_CONSTRAINTS = {
  audio: false,
  video: {
    facingMode: "user",
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 30 },
  },
};

export const CameraView = forwardRef(function CameraView(
  { onReady, onError, mirror = true, className = "" },
  ref,
) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [state, setState] = useState("idle"); // idle | requesting | ready | error
  const [errorMessage, setErrorMessage] = useState(null);

  useImperativeHandle(ref, () => ({
    get videoElement() {
      return videoRef.current;
    },
    get stream() {
      return streamRef.current;
    },
  }));

  useEffect(() => {
    let cancelled = false;
    async function start() {
      setState("requesting");
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera API is not available in this browser.");
        }
        const stream = await navigator.mediaDevices.getUserMedia(DEFAULT_CONSTRAINTS);
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
      } catch (err) {
        if (cancelled) return;
        const msg =
          err.name === "NotAllowedError"
            ? "Camera permission was denied. Please allow access and reload."
            : err.name === "NotFoundError"
              ? "No camera found on this device."
              : err.message || "Could not start the camera.";
        setErrorMessage(msg);
        setState("error");
        onError?.(err);
      }
    }
    start();
    return () => {
      cancelled = true;
      const stream = streamRef.current;
      if (stream) stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // We intentionally only run this on mount/unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`relative overflow-hidden rounded-3xl bg-ink ${className}`}>
      <video
        ref={videoRef}
        playsInline
        muted
        className="block h-full w-full object-cover"
        style={mirror ? { transform: "scaleX(-1)" } : undefined}
      />
      {state !== "ready" && (
        <div className="absolute inset-0 grid place-items-center bg-ink/85 text-center text-white">
          {state === "requesting" && (
            <div>
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              <p className="text-sm font-bold">Requesting camera access…</p>
            </div>
          )}
          {state === "error" && (
            <div className="max-w-sm px-6">
              <p className="text-sm font-extrabold text-rose-200">Camera unavailable</p>
              <p className="mt-2 text-xs text-white/70">{errorMessage}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
