import { useEffect, useState } from "react";

/** Which source the player ended up using, for tests and for diagnostics. */
export type AdaptiveSourceKind = "hls-native" | "hls-mse" | "progressive" | "none";

interface Options {
  /** HLS playlist, when the video has been transcoded. */
  streamUrl?: string;
  /** Progressive file, always used as the fallback. */
  fileUrl?: string;
}

/**
 * How long an HLS attempt gets to produce anything at all.
 *
 * Long enough that a slow connection fetching playlists and an init segment is
 * not cut off, short enough that a visitor is not left watching a spinner for a
 * stream their browser was never going to play.
 */
const HLS_STALL_TIMEOUT_MS = 12_000;

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
 *
 * Every HLS attempt is provisional. Both HLS paths can fail in ways the other
 * cannot -- hls.js reports a fatal error, while native HLS just fires `error`
 * on the element, and `canPlayType` is not a promise that playback will work:
 * Chrome on Android answers "maybe" for the HLS type and then cannot play it.
 * A stream can also stall silently, so a watchdog covers the case where
 * nothing arrives and nothing errors either. Whatever the shape of the
 * failure, the outcome is the same: take the progressive file, which is the
 * source that worked before any of this existed.
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
    // Whether the fallback has already happened. Distinct from the watchdog
    // being disarmed: bytes arriving means "do not time out", not "this source
    // is sound", and a stream can start flowing and still fail to decode.
    let usingFile = false;
    let destroyHls: (() => void) | undefined;
    let watchdog: ReturnType<typeof setTimeout> | undefined;

    const clearWatchdog = () => {
      if (watchdog !== undefined) {
        clearTimeout(watchdog);
        watchdog = undefined;
      }
    };

    const playTheFile = () => {
      if (fileUrl) {
        video.src = fileUrl;
        video.load();
        setKind("progressive");
      } else {
        video.removeAttribute("src");
        setKind("none");
      }
    };

    /** Abandon the stream for the file. Only the first caller wins. */
    const fallBackToFile = () => {
      if (cancelled || usingFile) {
        return;
      }
      usingFile = true;
      clearWatchdog();
      video.removeEventListener("error", fallBackToFile);
      video.removeEventListener("loadedmetadata", holdOn);
      video.removeEventListener("progress", holdOn);
      destroyHls?.();
      destroyHls = undefined;
      playTheFile();
    };

    /** The stream is producing something, so stop counting against it. */
    const holdOn = () => {
      clearWatchdog();
    };

    const armWatchdog = () => {
      clearWatchdog();
      watchdog = setTimeout(() => {
        watchdog = undefined;
        if (video.readyState === 0) {
          fallBackToFile();
        }
      }, HLS_STALL_TIMEOUT_MS);
    };

    const cleanUp = () => {
      cancelled = true;
      clearWatchdog();
      video.removeEventListener("error", fallBackToFile);
      video.removeEventListener("loadedmetadata", holdOn);
      video.removeEventListener("progress", holdOn);
      destroyHls?.();
    };

    if (!streamUrl) {
      usingFile = true;
      playTheFile();
      return cleanUp;
    }

    if (supportsNativeHls(video)) {
      // Nothing here reports failure except the element itself, so listen for
      // it. Without this a Safari visitor whose browser will not take the
      // playlist gets an error panel and no second chance.
      video.addEventListener("error", fallBackToFile);
      video.addEventListener("loadedmetadata", holdOn);
      video.addEventListener("progress", holdOn);
      video.src = streamUrl;
      video.load();
      setKind("hls-native");
      armWatchdog();
      return cleanUp;
    }

    void import("hls.js/light")
      .then(({ default: Hls }) => {
        if (cancelled || usingFile) return;

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
          fallBackToFile();
        });

        // A loaded fragment proves the whole chain works -- playlists, byte
        // ranges, CORS -- so the watchdog has nothing left to guard.
        hls.on(Hls.Events.FRAG_LOADED, holdOn);

        hls.loadSource(streamUrl);
        hls.attachMedia(video);
        setKind("hls-mse");
        armWatchdog();
      })
      .catch((error) => {
        console.warn("Could not load hls.js, falling back to the file", error);
        fallBackToFile();
      });

    return cleanUp;
  }, [video, streamUrl, fileUrl]);

  return kind;
}
