import { useEffect, useState } from "react";

/** Which source the player ended up using, for tests and for diagnostics. */
export type AdaptiveSourceKind = "hls-native" | "hls-mse" | "progressive" | "none";

interface Options {
  /** HLS playlist, when the video has been transcoded. */
  streamUrl?: string;
  /** Progressive file, always used as the fallback. */
  fileUrl?: string;
}

function supportsNativeHls(video: HTMLVideoElement): boolean {
  // Safari and iOS play HLS directly; every other browser needs MSE.
  return video.canPlayType("application/vnd.apple.mpegurl") !== "";
}

/**
 * Points a <video> element at the best source it can play.
 *
 * Order of preference:
 *  1. the HLS playlist natively (Safari, iOS — no JS payload at all),
 *  2. the HLS playlist through hls.js, imported only when it is actually
 *     needed so the library never lands in the main bundle,
 *  3. the progressive file, which is also the recovery path if HLS fails.
 *
 * Videos that have not been transcoded yet simply take path 3, so this is safe
 * to ship before any `streamUrl` exists in projects.json.
 */
export function useAdaptiveVideoSource(
  video: HTMLVideoElement | null,
  { streamUrl, fileUrl }: Options,
): AdaptiveSourceKind {
  const [kind, setKind] = useState<AdaptiveSourceKind>("none");

  useEffect(() => {
    if (!video) {
      return;
    }

    let cancelled = false;
    let destroyHls: (() => void) | undefined;

    const fallBackToFile = () => {
      if (cancelled) return;
      if (fileUrl) {
        video.src = fileUrl;
        video.load();
        setKind("progressive");
      } else {
        video.removeAttribute("src");
        setKind("none");
      }
    };

    if (!streamUrl) {
      fallBackToFile();
      return () => {
        cancelled = true;
      };
    }

    if (supportsNativeHls(video)) {
      video.src = streamUrl;
      video.load();
      setKind("hls-native");
      return () => {
        cancelled = true;
      };
    }

    void import("hls.js/light")
      .then(({ default: Hls }) => {
        if (cancelled) return;

        if (!Hls.isSupported()) {
          fallBackToFile();
          return;
        }

        const hls = new Hls({ enableWorker: true });
        destroyHls = () => hls.destroy();

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) {
            return;
          }
          // A fatal HLS error means this visitor is not getting adaptive
          // playback; the full-size file is worse but it does play.
          console.warn("HLS playback failed, falling back to the file", data.details);
          hls.destroy();
          destroyHls = undefined;
          fallBackToFile();
        });

        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        setKind("hls-mse");
      })
      .catch((error) => {
        console.warn("Could not load hls.js, falling back to the file", error);
        fallBackToFile();
      });

    return () => {
      cancelled = true;
      destroyHls?.();
    };
  }, [video, streamUrl, fileUrl]);

  return kind;
}
