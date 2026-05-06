import { useRef, useState, useCallback, useEffect } from "react";
import jsQR from "jsqr";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  errors: string[];
}

interface DecodeAttempt {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  scale: number;
}

function decodeQRCodeFromImage(img: HTMLImageElement): string | null {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const attempts: DecodeAttempt[] = [
    { sx: 0, sy: 0, sw: img.width, sh: img.height, scale: 1 },
    { sx: 0, sy: 0, sw: img.width, sh: img.height, scale: 2 },
    {
      sx: img.width * 0.08,
      sy: img.height * 0.22,
      sw: img.width * 0.84,
      sh: img.height * 0.56,
      scale: 2,
    },
    {
      sx: img.width * 0.12,
      sy: img.height * 0.25,
      sw: img.width * 0.76,
      sh: img.height * 0.5,
      scale: 3,
    },
  ];

  for (const attempt of attempts) {
    canvas.width = Math.round(attempt.sw * attempt.scale);
    canvas.height = Math.round(attempt.sh * attempt.scale);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      img,
      attempt.sx,
      attempt.sy,
      attempt.sw,
      attempt.sh,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height, {
      inversionAttempts: "attemptBoth",
    });

    if (code?.data) return code.data.trim();
  }

  return null;
}

export function QRISInput({ value, onChange, onReset, errors }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number>(0);
  const [scanning, setScanning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const decodeImageFile = useCallback(
    (file: File) => {
      setInputError(null);
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const data = decodeQRCodeFromImage(img);

        if (data) {
          onChange(data);
        } else {
          onChange("");
          setInputError("QR code not found in image. Please try another image.");
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        onChange("");
        setInputError("Failed to read image file.");
      };

      img.src = objectUrl;
    },
    [onChange],
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) decodeImageFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      decodeImageFile(file);
    }
  };

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            decodeImageFile(file);
            return;
          }
        }
      }
    },
    [decodeImageFile],
  );

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [handlePaste]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    cancelAnimationFrame(animationRef.current);
    setScanning(false);
  }, []);

  const startCamera = async () => {
    setInputError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
    } catch {
      setInputError("Camera access denied or unavailable.");
      return;
    }

    streamRef.current = stream;
    setScanning(true);

    const video = videoRef.current;
    if (!video) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setScanning(false);
      return;
    }

    video.srcObject = stream;
    await video.play();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scan = () => {
      if (!streamRef.current) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (code) {
          onChange(code.data);
          stopCamera();
          return;
        }
      }
      animationRef.current = requestAnimationFrame(scan);
    };
    scan();
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    setInputError(null);
  }, [value, errors]);

  const allErrors = inputError ? [...errors, inputError] : errors;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-bold uppercase tracking-wide">
        QRIS String
      </label>

      {/* Text Input */}
      <div
        className={`relative border-3 transition-all ${
          dragOver
            ? "border-brutal-cyan bg-brutal-cyan/10 shadow-brutal-lg -translate-x-[1px] -translate-y-[1px]"
            : allErrors.length > 0
              ? "border-brutal-pink bg-brutal-pink/5 shadow-brutal"
              : value
                ? "border-brutal-lime bg-brutal-lime/5 shadow-brutal"
                : "border-black dark:border-white shadow-brutal dark:shadow-brutal-white"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste QRIS string here, or drag & drop a QR image..."
          rows={3}
          className="w-full px-4 py-3 bg-transparent text-sm font-mono resize-none focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />

        {value && (
          <button
            onClick={onReset}
            className="absolute top-2 right-2 border-3 border-black dark:border-white bg-brutal-pink p-1 shadow-brutal-sm hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all"
            aria-label="Clear"
          >
            <svg
              className="w-4 h-4 text-black"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Error messages */}
      {allErrors.length > 0 && (
        <div className="border-3 border-black dark:border-white bg-brutal-pink p-3 shadow-brutal dark:shadow-brutal-white">
          <ul className="text-sm font-bold text-black space-y-1">
            {allErrors.map((err, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0">&#x2717;</span>
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="brutal-btn flex-1 flex items-center justify-center gap-2 text-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          Upload Image
        </button>

        <button
          onClick={scanning ? stopCamera : startCamera}
          className={`flex-1 flex items-center justify-center gap-2 text-sm font-bold border-3 border-black shadow-brutal transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-brutal-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
            scanning
              ? "bg-brutal-pink text-black"
              : "bg-white dark:bg-brutal-dark dark:border-white dark:shadow-brutal-white dark:hover:shadow-brutal-white-sm dark:text-white"
          } px-4 py-2.5`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
            />
          </svg>
          {scanning ? "Stop Camera" : "Scan Camera"}
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Camera view */}
      {scanning && (
        <div className="relative border-3 border-black dark:border-white overflow-hidden shadow-brutal dark:shadow-brutal-white">
          <video ref={videoRef} className="w-full" playsInline muted />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-3 border-brutal-yellow" />
          </div>
          <div className="absolute bottom-3 left-0 right-0 text-center">
            <span className="bg-black text-white text-sm font-bold px-3 py-1 border-3 border-brutal-yellow">
              Point camera at a QRIS code
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
