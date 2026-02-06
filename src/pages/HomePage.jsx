import { useEffect, useState } from "react";

// 🔴 REMOVE firebase imports completely
// import { logEvent } from "firebase/analytics";
// import { analytics } from "../firebase";

import SplashScreen from "./home/SplashScreen";
import TextImportModal from "../components/home/modals/TextImportModal";
import LoadingSplash from "../components/home/LoadingSplash";
import { useMatchRecorderContext } from "../data/MatchRecorderContext";
import { parseMatchText } from "../utils/matchFormat";
import { readJsonFile } from "../utils/fileJson";
import { readPaste } from "../utils/pasteService";
import { setPath } from "../utils/navigation";

function HomePage() {
  const recorder = useMatchRecorderContext();
  const { applyParsedMatchData } = recorder;

  const [showTextImport, setShowTextImport] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading match data...");

  const importFromText = () => {
    try {
      const parsedData = parseMatchText(textInput);
      const success = applyParsedMatchData(parsedData);
      if (!success) {
        alert("No valid match data found.");
        return;
      }

      setShowTextImport(false);
      setTextInput("");
    } catch (e) {
      alert("Error parsing match data: " + e.message);
    }
  };

  const importMatchFromJson = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await readJsonFile(file);
      applyParsedMatchData({
        startTime: data.startTime,
        duration: data.duration,
        events: data.events,
        notes: data.notes,
        teamNumber: data.teamNumber,
      });
    } catch {
      alert("Invalid JSON match file.");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const importFromQuery = async () => {
      const params = new URLSearchParams(window.location.search);
      const pasteKey = params.get("p");
      const encoded = params.get("mt");

      if (!pasteKey && !encoded) return;

      setIsLoadingFromUrl(true);
      const minDelay = new Promise((r) => setTimeout(r, 1200));

      try {
        let decoded;
        if (pasteKey) {
          const b64Payload = await readPaste(pasteKey);
          decoded = atob(b64Payload);
        } else {
          decoded = atob(decodeURIComponent(encoded));
        }

        if (cancelled) return;

        const parsedData = parseMatchText(decoded);
        await minDelay;

        if (!cancelled) {
          applyParsedMatchData(parsedData);
          setPath("/match", { replace: true });
        }
      } catch (e) {
        console.warn("Failed to import from URL", e);
        await minDelay;
      } finally {
        if (!cancelled) setIsLoadingFromUrl(false);
      }
    };

    importFromQuery();
    return () => (cancelled = true);
  }, [applyParsedMatchData]);

  if (isLoadingFromUrl) {
    return <LoadingSplash message={loadingMessage} />;
  }

  return (
    <div className="page">
      <div className="bg" aria-hidden />
      <div className="content min-h-screen p-6 max-w-7xl mx-auto flex flex-col items-center gap-10">
        <SplashScreen
          recorder={recorder}
          onImportJson={importMatchFromJson}
          onOpenTextImport={() => setShowTextImport(true)}
        />

        <TextImportModal
          open={showTextImport}
          textInput={textInput}
          setTextInput={setTextInput}
          onImport={importFromText}
          onClose={() => {
            setShowTextImport(false);
            setTextInput("");
          }}
        />
      </div>
    </div>
  );
}

export default HomePage;
