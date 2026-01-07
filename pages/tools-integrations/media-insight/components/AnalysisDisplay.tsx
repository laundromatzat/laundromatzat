/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  AnalysisResult,
  Emotion,
  AudioAnalysisResult,
  ImageAnalysisResult,
  VideoAnalysisResult,
} from "../types";
import {
  User,
  Clock,
  Globe,
  Languages,
  Smile,
  Frown,
  AlertCircle,
  Meh,
  Image as ImageIcon,
  Video,
  Type as TypeIcon,
} from "lucide-react";

interface AnalysisDisplayProps {
  data: AnalysisResult;
}

const AudioView: React.FC<{ data: AudioAnalysisResult }> = ({ data }) => {
  const getEmotionBadge = (emotion?: Emotion) => {
    if (!emotion) return null;

    switch (emotion) {
      case Emotion.Happy:
        return (
          <div className="flex items-center bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100">
            <Smile size={14} className="mr-1.5" />
            {emotion}
          </div>
        );
      case Emotion.Sad:
        return (
          <div className="flex items-center bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100">
            <Frown size={14} className="mr-1.5" />
            {emotion}
          </div>
        );
      case Emotion.Angry:
        return (
          <div className="flex items-center bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100">
            <AlertCircle size={14} className="mr-1.5" />
            {emotion}
          </div>
        );
      case Emotion.Neutral:
      default:
        return (
          <div className="flex items-center bg-brand-secondary/20 text-aura-text-secondary px-2 py-1 rounded border border-brand-secondary/30">
            <Meh size={14} className="mr-1.5" />
            {emotion}
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {data.segments.map((segment, index) => (
        <div
          key={index}
          className="bg-white/80 backdrop-blur-sm border border-brand-secondary/40 rounded-xl p-5 hover:shadow-md transition-all duration-300"
        >
          <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-aura-text-secondary">
            <div className="flex items-center font-semibold text-brand-accent bg-brand-accent/10 px-2 py-1 rounded">
              <User size={14} className="mr-1.5" />
              {segment.speaker}
            </div>
            <div className="flex items-center bg-brand-secondary/10 px-2 py-1 rounded">
              <Clock size={14} className="mr-1.5" />
              {segment.timestamp}
            </div>
            <div className="flex items-center bg-brand-secondary/10 px-2 py-1 rounded">
              <Globe size={14} className="mr-1.5" />
              {segment.language}
            </div>
            {segment.emotion && getEmotionBadge(segment.emotion)}
          </div>

          <p className="text-aura-text-primary leading-relaxed whitespace-pre-wrap">
            {segment.content}
          </p>

          {segment.translation && (
            <div className="mt-4 pt-3 border-t border-brand-secondary/30 bg-brand-secondary/5 -mx-5 -mb-5 px-5 pb-5 rounded-b-xl">
              <div className="flex items-center text-xs font-semibold text-brand-accent mb-1.5 uppercase tracking-wide pt-2">
                <Languages size={14} className="mr-1.5" />
                English Translation
              </div>
              <p className="text-aura-text-secondary italic leading-relaxed">
                {segment.translation}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ImageView: React.FC<{ data: ImageAnalysisResult }> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white/80 backdrop-blur-sm border border-brand-secondary/40 rounded-xl p-6 h-full">
        <h3 className="flex items-center text-lg font-semibold text-aura-text-primary mb-4">
          <ImageIcon size={20} className="mr-2 text-brand-accent" />
          Visual Elements
        </h3>
        <ul className="space-y-2">
          {data.visualElements?.map((el, i) => (
            <li key={i} className="flex items-start text-aura-text-primary">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-accent mt-2 mr-3 flex-shrink-0" />
              {el}
            </li>
          )) || (
            <p className="text-aura-text-secondary italic">
              No specific elements detected.
            </p>
          )}
        </ul>
        {data.mood && (
          <div className="mt-6 pt-4 border-t border-brand-secondary/30">
            <span className="text-sm font-medium text-aura-text-secondary uppercase tracking-wider">
              Mood / Atmosphere
            </span>
            <p className="mt-1 text-lg font-medium text-brand-accent capitalize">
              {data.mood}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white/80 backdrop-blur-sm border border-brand-secondary/40 rounded-xl p-6 h-full">
        <h3 className="flex items-center text-lg font-semibold text-aura-text-primary mb-4">
          <TypeIcon size={20} className="mr-2 text-brand-accent" />
          Detected Text
        </h3>
        {data.detectedText ? (
          <div className="bg-brand-secondary/5 p-4 rounded-lg border border-brand-secondary/30 font-mono text-sm text-aura-text-primary whitespace-pre-wrap leading-relaxed">
            {data.detectedText}
          </div>
        ) : (
          <p className="text-aura-text-secondary italic">
            No legible text found in the image.
          </p>
        )}
      </div>
    </div>
  );
};

const VideoView: React.FC<{ data: VideoAnalysisResult }> = ({ data }) => {
  return (
    <div className="space-y-4">
      {data.segments.map((segment, index) => (
        <div
          key={index}
          className="bg-white/80 backdrop-blur-sm border border-brand-secondary/40 rounded-xl p-5 hover:shadow-md transition-all duration-300"
        >
          <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-aura-text-secondary">
            <div className="flex items-center bg-brand-accent/10 text-brand-accent px-2 py-1 rounded font-mono">
              <Clock size={14} className="mr-1.5" />
              {segment.timestamp}
            </div>
            {segment.speaker && (
              <div className="flex items-center bg-brand-secondary/10 px-2 py-1 rounded">
                <User size={14} className="mr-1.5" />
                {segment.speaker}
              </div>
            )}
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-aura-text-secondary mb-1">
                Visual Action
              </h4>
              <p className="text-aura-text-primary mb-4">
                {segment.description}
              </p>

              {segment.transcript && (
                <div className="bg-brand-secondary/5 p-3 rounded-lg border border-brand-secondary/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-aura-text-secondary mb-1">
                    Transcript
                  </h4>
                  <p className="text-aura-text-primary italic">
                    "{segment.transcript}"
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ data }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary Section */}
      <div className="bg-gradient-to-br from-brand-accent/5 to-white/80 backdrop-blur-sm border border-brand-accent/20 rounded-2xl p-6 shadow-sm transition-colors duration-300">
        <h2 className="text-lg font-semibold text-brand-accent mb-3 flex items-center">
          {data.type === "video" ? (
            <Video size={20} className="mr-2" />
          ) : data.type === "image" ? (
            <ImageIcon size={20} className="mr-2" />
          ) : (
            <Languages size={20} className="mr-2" />
          )}
          Overview
        </h2>
        <p className="text-aura-text-primary leading-relaxed">{data.summary}</p>
      </div>

      {/* Detail Views */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-aura-text-primary px-1">
          {data.type === "image" ? "Detailed Analysis" : "Timeline"}
        </h2>

        {data.type === "audio" && (
          <AudioView data={data as AudioAnalysisResult} />
        )}
        {data.type === "image" && (
          <ImageView data={data as ImageAnalysisResult} />
        )}
        {data.type === "video" && (
          <VideoView data={data as VideoAnalysisResult} />
        )}
      </div>
    </div>
  );
};

export default AnalysisDisplay;
