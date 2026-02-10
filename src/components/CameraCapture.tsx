import { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface CameraCaptureProps {
    onCapture: (file: File) => void;
    onCancel: () => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 600;

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const stopStream = useCallback(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }, []);

    const startCamera = useCallback(() => {
        if (!navigator.mediaDevices?.getUserMedia) {
            toast({ title: 'Camera not supported', description: 'Your browser does not support camera access.', variant: 'destructive' });
            onCancel();
            return () => {};
        }

        let cancelled = false;

        // Stop any existing stream before acquiring a new one
        stopStream();
        setReady(false);
        setError(null);

        let attempt = 0;

        const tryAcquire = () => {
            if (cancelled) return;

            navigator.mediaDevices.getUserMedia({ video: true })
                .then((stream) => {
                    if (cancelled) {
                        stream.getTracks().forEach((t) => t.stop());
                        return;
                    }
                    streamRef.current = stream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play().catch(() => {});
                        setReady(true);
                    }
                })
                .catch((err) => {
                    if (cancelled) return;

                    // Permission denied — no point retrying
                    if (err?.name === 'NotAllowedError') {
                        toast({ title: 'Camera access denied', description: 'Please allow camera permission and try again.', variant: 'destructive' });
                        onCancel();
                        return;
                    }

                    // Device busy / hardware error — retry after a delay
                    attempt++;
                    if (attempt < MAX_RETRIES) {
                        setTimeout(tryAcquire, RETRY_DELAY_MS);
                    } else {
                        setError('Could not access camera. Make sure no other app is using it.');
                    }
                });
        };

        tryAcquire();

        return () => {
            cancelled = true;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stopStream]);

    useEffect(() => {
        // Defer so React StrictMode's mount-unmount-remount cycle completes first.
        // The first mount's timeout is cleared in cleanup; only the final mount
        // actually acquires the camera.
        const timeoutId = setTimeout(() => {
            cancelRef.current = startCamera();
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            cancelRef.current();
            stopStream();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cancelRef = useRef<() => void>(() => {});

    const handleRetry = () => {
        cancelRef.current();
        stopStream();
        cancelRef.current = startCamera();
    };

    const handleCapture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(video, 0, 0);
        stopStream();

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    const file = new File([blob], `camera-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file);
                }
            },
            'image/jpeg',
            0.9,
        );
    };

    const handleCancel = () => {
        cancelRef.current();
        stopStream();
        onCancel();
    };

    return (
        <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-32 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                {error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 p-1 text-center">
                        <Camera className="h-5 w-5 text-red-400 mb-1" />
                        <span className="text-[9px] text-red-300 leading-tight">{error}</span>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        {!ready && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                <span className="text-[10px] text-white">Loading...</span>
                            </div>
                        )}
                    </>
                )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-1">
                {error ? (
                    <Button type="button" size="sm" onClick={handleRetry} className="h-7 text-xs px-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        <RefreshCw className="h-3 w-3 mr-1" /> Retry
                    </Button>
                ) : (
                    <Button type="button" size="sm" onClick={handleCapture} disabled={!ready} className="h-7 text-xs px-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                        <Camera className="h-3 w-3 mr-1" /> Capture
                    </Button>
                )}
                <Button type="button" variant="outline" size="sm" onClick={handleCancel} className="h-7 text-xs px-2">
                    <X className="h-3 w-3 mr-1" /> Cancel
                </Button>
            </div>
        </div>
    );
}
