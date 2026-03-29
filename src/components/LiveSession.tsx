import { useEffect, useRef, useState } from "react";
import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { AudioProcessor, AudioPlayer } from "../lib/audio";
import { Character } from "./Character";
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type Level = "A2" | "B1";
type Mode = "conversation" | "pronunciation" | "shadowing";

const getSystemInstruction = (level: Level, mode: Mode) => `
You are a friendly male English tutor for Vietnamese learners. 
Your voice is calm and you speak EXTREMELY SLOWLY and CLEARLY.
Your accent is standard American English (US English).

CURRENT LEVEL: ${level}
CURRENT MODE: ${mode}

${mode === "shadowing" ? `
SHADOWING & IELTS GRADING MODE:
1. Your goal is to help the user practice shadowing and grade them like an IELTS examiner.
2. Provide a natural English sentence (A2: 5-8 words, B1: 8-12 words).
3. Speak the sentence very clearly and slowly, then wait for the user to repeat it exactly.
4. After they repeat it, provide a detailed evaluation and a score (0.0 to 9.0, like IELTS).
5. Grade based on these criteria:
   - Pronunciation: Accuracy of vowel and consonant sounds.
   - Fluency: Smoothness, rhythm, and lack of hesitation.
   - Intonation & Stress: Correct rising/falling tones and word stress.
6. Give specific feedback: "You missed the 's' in 'works'", "Your rhythm was a bit choppy", etc.
7. Be encouraging but professional, like a real IELTS speaking examiner.
8. Ask if they want to "Try again" or "Next sentence".
` : mode === "pronunciation" ? `
PRONUNCIATION COACH MODE:
1. Your primary goal is to help the user improve their American English pronunciation.
2. Give the user a short, useful sentence (3-6 words) to practice.
3. Listen carefully to their pronunciation.
4. If they make a mistake (even a small one), gently correct them. 
5. Explain specifically what they should change (e.g., "The 'th' sound in 'think' should be softer", "Make the 's' at the end of 'cats' more clear").
6. Speak the correct version very slowly and clearly, then ask them to try again.
7. Be very patient and encouraging.
` : `
CONVERSATION MODE:
1. Help the user practice natural English conversation.
2. If they make a major pronunciation mistake that makes them hard to understand, gently correct it and ask them to repeat.
3. Otherwise, focus on the flow of the conversation.
`}

- If A2: You must speak at an EXTREMELY slow pace, matching the style of "Slow English" listening practice videos (like the one at https://www.youtube.com/watch?v=gOMypAhVaXE). 
  * Pronounce every syllable distinctly and slowly.
  * Pause for 2 seconds between sentences to allow the learner to process.
  * Use very simple vocabulary and short, clear sentences.
  * Your goal is to be 100% understandable for a beginner.
- If B1: Use intermediate vocabulary, slightly more complex sentences, and a wider range of topics. Speak at a moderate, clear pace.

RULES:
1. Always speak English to the user.
2. If the user speaks Vietnamese, translate it to natural English at the ${level} level and ask them to repeat.
3. You can play games (like "Guess the Word", "20 Questions"), tell jokes, or do role-play (e.g., ordering food at a restaurant).
4. If the user asks for a game or a joke, provide one immediately.
5. Keep your responses encouraging and patient.
6. Use a friendly, supportive male persona.
`;

export const LiveSession = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [level, setLevel] = useState<Level>("A2");
  const [mode, setMode] = useState<Mode>("conversation");
  const [transcription, setTranscription] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const audioProcessor = useRef<AudioProcessor | null>(null);
  const audioPlayer = useRef<AudioPlayer | null>(null);
  const sessionRef = useRef<any>(null);

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      audioPlayer.current = new AudioPlayer();
      audioProcessor.current = new AudioProcessor();

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } }, // Male voice
          },
          systemInstruction: getSystemInstruction(level, mode),
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setError(null);
            audioProcessor.current?.start((base64Data) => {
              session.sendRealtimeInput({
                audio: { data: base64Data, mimeType: "audio/pcm;rate=16000" },
              });
            });
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              audioPlayer.current?.playChunk(base64Audio);
              setTimeout(() => setIsSpeaking(false), 500);
            }

            if (message.serverContent?.interrupted) {
              audioPlayer.current?.stop();
              setIsSpeaking(false);
            }

            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              const text = message.serverContent.modelTurn.parts[0].text;
              setTranscription(prev => [...prev, `AI: ${text}`].slice(-5));
            }
          },
          onclose: () => {
            setIsConnected(false);
            audioProcessor.current?.stop();
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error. Please try again.");
            setIsConnected(false);
          },
        },
      });

      sessionRef.current = session;
    } catch (err) {
      console.error("Failed to start session:", err);
      setError("Failed to start session. Check your microphone permissions.");
    }
  };

  const stopSession = () => {
    sessionRef.current?.close();
    audioProcessor.current?.stop();
    audioPlayer.current?.stop();
    setIsConnected(false);
    setIsSpeaking(false);
    setIsListening(false);
  };

  const sendActivity = (activity: string) => {
    if (sessionRef.current && isConnected) {
      sessionRef.current.sendRealtimeInput({
        text: activity
      });
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] p-8 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-800 uppercase tracking-tight">English Buddy AI</h2>
        <p className="text-slate-500">Practice speaking English with your male tutor</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setLevel("A2")}
            disabled={isConnected}
            className={`px-6 py-2 rounded-lg font-bold transition-all text-sm ${
              level === "A2" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
            } ${isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Level A2 (Easy)
          </button>
          <button
            onClick={() => setLevel("B1")}
            disabled={isConnected}
            className={`px-6 py-2 rounded-lg font-bold transition-all text-sm ${
              level === "B1" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
            } ${isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Level B1 (Medium)
          </button>
        </div>

        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button
            onClick={() => setMode("conversation")}
            disabled={isConnected}
            className={`px-4 py-2 rounded-lg font-bold transition-all text-xs ${
              mode === "conversation" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
            } ${isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Conversation
          </button>
          <button
            onClick={() => setMode("pronunciation")}
            disabled={isConnected}
            className={`px-4 py-2 rounded-lg font-bold transition-all text-xs ${
              mode === "pronunciation" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
            } ${isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Pronunciation
          </button>
          <button
            onClick={() => setMode("shadowing")}
            disabled={isConnected}
            className={`px-4 py-2 rounded-lg font-bold transition-all text-xs ${
              mode === "shadowing" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
            } ${isConnected ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Shadowing
          </button>
        </div>
      </div>

      <Character isSpeaking={isSpeaking} isListening={isConnected} />

      <div className="flex flex-col items-center space-y-4 w-full max-w-md">
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm border border-red-100"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-4">
          {!isConnected ? (
            <button
              onClick={startSession}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-full font-bold shadow-lg transition-all active:scale-95"
            >
              <Mic className="w-6 h-6" />
              Start Practice
            </button>
          ) : (
            <button
              onClick={stopSession}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-12 py-4 rounded-full font-bold shadow-lg transition-all active:scale-95"
            >
              <MicOff className="w-6 h-6" />
              End Session
            </button>
          )}
        </div>

        {isConnected && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <button 
              onClick={() => sendActivity("Let's play a game! Suggest one.")}
              className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors font-medium"
            >
              🎮 Play a Game
            </button>
            <button 
              onClick={() => sendActivity("Tell me a funny joke!")}
              className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors font-medium"
            >
              😂 Tell a Joke
            </button>
            <button 
              onClick={() => sendActivity("Let's do a role-play! You choose the scenario.")}
              className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors font-medium"
            >
              🎭 Role Play
            </button>
          </div>
        )}

        {isConnected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-blue-100 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold text-sm">
              <MessageCircle className="w-4 h-4" />
              Live Transcription
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto text-sm text-slate-600">
              {transcription.length === 0 ? (
                <p className="italic opacity-50">Listening for your voice...</p>
              ) : (
                transcription.map((line, i) => (
                  <p key={i} className={line.startsWith('AI:') ? 'font-medium text-blue-800' : ''}>
                    {line}
                  </p>
                ))
              )}
            </div>
          </motion.div>
        )}
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl text-center">
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="font-bold">1</span>
          </div>
          <h3 className="font-bold text-slate-800 mb-2">Speak English</h3>
          <p className="text-sm text-slate-500">Start talking about any topic you like. The AI will respond naturally.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="font-bold">2</span>
          </div>
          <h3 className="font-bold text-slate-800 mb-2">Stuck? Use Vietnamese</h3>
          <p className="text-sm text-slate-500">If you don't know a word, say it in Vietnamese. AI will translate it for you.</p>
        </div>
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-blue-200 transition-colors">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="font-bold">3</span>
          </div>
          <h3 className="font-bold text-slate-800 mb-2">Repeat & Learn</h3>
          <p className="text-sm text-slate-500">Listen to the AI's pronunciation and repeat the phrases to improve.</p>
        </div>
      </div>

    </div>
  );
};
