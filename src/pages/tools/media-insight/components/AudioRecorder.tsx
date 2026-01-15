/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, AlertCircle } from "lucide-react";
import { AuraButton, AuraCard } from "@/components/aura";
import { AudioData } from "../types";

interface AudioRecorderProps {
  onAudioCaptured: (audioData: AudioData) => void;
  disabled?: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAudioCaptured,
  disabled,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64 = base64String.split(",")[1];

          onAudioCaptured({
            blob,
            base64,
            mimeType: "audio/webm",
          });
        };

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Timer
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError(
        "Could not access microphone. Please ensure permissions are granted."
      );
    }
  }, [onAudioCaptured]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setDuration(0);
    }
  }, [isRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AuraCard
      variant="bordered"
      padding="lg"
      className="flex flex-col items-center justify-center border-dashed border-2 bg-white/80 backdrop-blur-sm"
    >
      <div
        className={`relative flex items-center justify-center w-24 h-24 mb-6 rounded-full transition-all duration-300 ${isRecording ? "bg-red-500/10" : "bg-brand-accent/10"}`}
      >
        {isRecording && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20 animate-ping"></span>
        )}
        {isRecording ? (
          <div className="text-red-500">
            <Mic size={40} className="animate-pulse" />
          </div>
        ) : (
          <div className="text-brand-accent">
            <Mic size={40} />
          </div>
        )}
      </div>

      <div className="text-center mb-6">
        {isRecording ? (
          <div>
            <h3 className="text-lg font-semibold text-aura-text-primary">
              Recording...
            </h3>
            <p className="text-3xl font-mono text-aura-text-secondary mt-2">
              {formatTime(duration)}
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold text-aura-text-primary">
              Start Recording
            </h3>
            <p className="text-aura-text-secondary text-sm mt-1">
              Click the button to begin
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-4 text-sm">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}

      {!isRecording ? (
        <AuraButton
          onClick={startRecording}
          disabled={disabled}
          className="w-full max-w-xs"
        >
          Start Recording
        </AuraButton>
      ) : (
        <AuraButton
          onClick={stopRecording}
          variant="danger"
          icon={<Square size={16} fill="currentColor" />}
          className="w-full max-w-xs"
        >
          Stop Recording
        </AuraButton>
      )}
    </AuraCard>
  );
};

export default AudioRecorder;
