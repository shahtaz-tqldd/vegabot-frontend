import { useCallback, useEffect, useRef, useState } from "react";

// One shared <audio> element so only a single clip plays at a time. `key`
// identifies what's playing (a voice name / id) for the UI.
const useAudioPreview = () => {
  const audioRef = useRef(null);
  const [playingKey, setPlayingKey] = useState(null);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    setPlayingKey(null);
  }, []);

  const play = useCallback(
    async (key, url) => {
      if (!url) return;
      if (!audioRef.current) audioRef.current = new Audio();

      const audio = audioRef.current;
      audio.pause();
      audio.src = url;
      audio.onended = () => setPlayingKey(null);
      audio.onerror = () => setPlayingKey(null);
      setPlayingKey(key);

      try {
        await audio.play();
      } catch (error) {
        setPlayingKey(null);
        throw error;
      }
    },
    [],
  );

  const toggle = useCallback(
    (key, url) => {
      if (playingKey === key) {
        stop();
        return Promise.resolve();
      }
      return play(key, url);
    },
    [playingKey, play, stop],
  );

  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  return { playingKey, play, stop, toggle };
};

export default useAudioPreview;
