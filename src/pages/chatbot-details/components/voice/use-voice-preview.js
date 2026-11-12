import { useState } from "react";
import { toast } from "sonner";

import { useLazyVoicePreviewQuery } from "@/features/chatbot/chatbotApiSlice";
import { getApiErrorMessage } from "@/lib/get-api-error-message";
import useAudioPreview from "./use-audio-preview";

// Plays a prebuilt voice's greeting. A voice with no stored preview_url gets
// one generated on first request (a few seconds), so a loading state is
// exposed per voice.
const useVoicePreview = () => {
  const audio = useAudioPreview();
  const [fetchPreview] = useLazyVoicePreviewQuery();
  const [loadingName, setLoadingName] = useState(null);

  const toggle = async (voice) => {
    if (!voice?.name) return;
    if (audio.playingKey === voice.name) {
      audio.stop();
      return;
    }

    try {
      let url = voice.previewUrl;
      if (!url) {
        setLoadingName(voice.name);
        url = (await fetchPreview(voice.name, true).unwrap()).previewUrl;
      }
      if (!url) throw new Error("No preview");
      await audio.play(voice.name, url);
    } catch (error) {
      toast.error(
        error?.status === 503
          ? `The ${voice.name} preview isn't available right now — try again shortly.`
          : getApiErrorMessage(error, `Couldn't play the ${voice.name} preview`),
      );
    } finally {
      setLoadingName(null);
    }
  };

  return {
    toggle,
    stop: audio.stop,
    isPlaying: (name) => audio.playingKey === name,
    isLoading: (name) => loadingName === name,
  };
};

export default useVoicePreview;
