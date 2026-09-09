import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, MicOff, Bus, Phone } from "lucide-react";
import { HorariosCard, HorarioTransporteData } from "./components/HorariosCard";

// ─── Types ────────────────────────────────────────────────────────────────────

type Sender = "user" | "bot";

interface Message {
  id: number;
  from: Sender;
  text: string;
  time: string;
  read?: boolean;
  showHorarios?: boolean;
  horariosData?: HorarioTransporteData;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowTime(): string {
  return new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

// ─── Quick Actions ────────────────────────────────────────────────────────────

const quickActions = [
  { label: "🚌 Rutas de buses", q: "¿Cuáles son las rutas de buses?" },
  { label: "💰 Tarifa del bus", q: "¿Cuánto cuesta el pasaje de bus?" },
  { label: "🎫 Pase libre adulto mayor", q: "¿Cómo obtengo el pase libre?" },
  { label: "🕐 Horarios de buses", q: "¿Cuáles son los horarios de los buses?" },
  { label: "🚕 Números de radio taxi", q: "¿Cuáles son los números de radio taxi?" },
  { label: "💰 Tarifa de radio taxi", q: "¿Cuánto cuesta un radio taxi?" },
  { label: "🛡️ Viajar seguro en taxi", q: "¿Cómo viajar seguro en radio taxi?" },
  { label: "♿ Buses accesibles", q: "¿Qué buses son accesibles para adulto mayor?" },
];

// ─── Format text (*bold* → <strong>) ─────────────────────────────────────────

function FormattedText({ text }: { text: string }) {
  return (
    <>
      {text.split("\n").map((line, i, arr) => {
        const parts = line.split(/\*([^*]+)\*/g);
        return (
          <span key={i}>
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
            {i < arr.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

const WELCOME: Message = {
  id: 0,
  from: "bot",
  text: "¡Hola! 👋 Soy su asistente de transporte público.\n\nPuedo ayudarle con información sobre:\n\n🚌 *Buses* – rutas, tarifas, horarios, pase libre\n🚕 *Radio Taxi* – números, precios, seguridad\n\nEscriba su consulta o pulse el micrófono para hablar. También puede tocar una de las opciones de abajo.",
  time: nowTime(),
};

let _nextId = 1;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showQuick, setShowQuick] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const speechSupported =
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setShowQuick(false);

    const userMsg: Message = {
      id: _nextId++,
      from: "user",
      text: text.trim(),
      time: nowTime(),
      read: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    const isScheduleQuery =
      /horario|primera salida|ultima salida|última salida|primer bus|ultimo bus|último bus|a que hora|a qué hora/i.test(
        text
      );

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          clientTime: new Date().toISOString(),
        }),
      });

      let botResponseText = "Hubo un error de conexión con el asistente.";
      let showHorarios = false;
      let horariosData = undefined;

      if (response.ok) {
        const data = await response.json();
        showHorarios = Boolean(data.showHorarios || isScheduleQuery);
        horariosData = data.horarios;

        if (isScheduleQuery) {
          botResponseText = "Aquí tiene los horarios de operación de las micros:";
        } else {
          botResponseText = data.text;
        }
      } else if (isScheduleQuery) {
        botResponseText = "Aquí tiene los horarios de operación de las micros:";
        showHorarios = true;
      }

      const botMsg: Message = {
        id: _nextId++,
        from: "bot",
        text: botResponseText,
        time: nowTime(),
        showHorarios,
        horariosData,
      };

      setMessages((prev) =>
        [...prev.map((m) => (m.id === userMsg.id ? { ...m, read: true } : m)), botMsg]
      );
    } catch (error) {
      console.error("Error fetching bot response:", error);
      let botResponseText = "Lo siento, tuve un problema de conexión. 😌📡";
      let showHorarios = false;

      if (isScheduleQuery) {
        botResponseText = "Aquí tiene los horarios de operación de las micros:";
        showHorarios = true;
      }

      const botMsg: Message = {
        id: _nextId++,
        from: "bot",
        text: botResponseText,
        time: nowTime(),
        showHorarios,
      };
      setMessages((prev) =>
        [...prev.map((m) => (m.id === userMsg.id ? { ...m, read: true } : m)), botMsg]
      );
    } finally {
      setIsTyping(false);
    }
  }, []);

  const handleSend = () => { sendMessage(inputText); inputRef.current?.focus(); };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (ev: any) => {
      const text = ev.results[0][0].transcript;
      setIsListening(false);
      sendMessage(text);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [sendMessage]);

  const stopListening = () => { recognitionRef.current?.stop(); setIsListening(false); };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ fontFamily: "'Atkinson Hyperlegible', sans-serif" }}
    >
      {/* ── Header ── */}
      <header
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0 shadow-md"
        style={{ backgroundColor: "#128C7E" }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: "#075E54" }}
        >
          <Bus size={22} color="white" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-xl font-black text-white leading-tight truncate"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Asistente Transporte
          </p>
          <p className="text-sm leading-none" style={{ color: "#B2DFDB" }}>
            {isTyping ? "escribiendo..." : "en línea"}
          </p>
        </div>
        <Phone size={20} color="white" opacity={0.8} />
      </header>

      {/* ── Chat area ── */}
      <div
        className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1"
        style={{
          backgroundColor: "#E5DDD5",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      >
        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 mb-1 ${msg.from === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* Bot avatar */}
            {msg.from === "bot" && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-0.5"
                style={{ backgroundColor: "#128C7E" }}
              >
                <Bus size={15} color="white" strokeWidth={2.5} />
              </div>
            )}

            {/* Bubble */}
            <div
              className="relative px-4 py-3 shadow-sm"
              style={{
                backgroundColor: msg.from === "user" ? "#DCF8C6" : "#FFFFFF",
                borderRadius: msg.from === "user"
                  ? "18px 4px 18px 18px"
                  : "4px 18px 18px 18px",
                maxWidth: msg.showHorarios ? "95%" : "84%",
                minWidth: 80,
              }}
            >
              <p
                className="leading-relaxed whitespace-pre-wrap break-words"
                style={{ fontSize: 18, color: "#111B21" }}
              >
                <FormattedText text={msg.text} />
              </p>

              {msg.showHorarios && (
                <div className="mt-2 w-full">
                  <HorariosCard data={msg.horariosData} />
                </div>
              )}

              <div className="flex items-center justify-end gap-1 mt-1.5">
                <span style={{ fontSize: 12, color: "#8696A0" }}>{msg.time}</span>
                {msg.from === "user" && (
                  <span
                    style={{
                      fontSize: 13,
                      color: msg.read ? "#53BDEB" : "#8696A0",
                      fontWeight: "bold",
                    }}
                  >
                    {msg.read ? "✓✓" : "✓"}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-end gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#128C7E" }}
            >
              <Bus size={15} color="white" strokeWidth={2.5} />
            </div>
            <div
              className="px-5 py-4 shadow-sm"
              style={{ backgroundColor: "#FFFFFF", borderRadius: "4px 18px 18px 18px" }}
            >
              <div className="flex gap-1.5 items-center">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="block rounded-full"
                    style={{
                      width: 9,
                      height: 9,
                      backgroundColor: "#8696A0",
                      animation: "wa-bounce 1.2s ease-in-out infinite",
                      animationDelay: `${i * 0.2}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick action chips */}
        {showQuick && (
          <div className="mt-4 mb-2">
            <p
              className="text-center text-sm font-bold mb-3"
              style={{ color: "#5C6870" }}
            >
              Preguntas frecuentes
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickActions.map((a) => (
                <button
                  key={a.q}
                  onClick={() => sendMessage(a.q)}
                  className="px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 shadow-sm"
                  style={{
                    backgroundColor: "white",
                    color: "#128C7E",
                    border: "1.5px solid #128C7E",
                    fontFamily: "'Nunito', sans-serif",
                    fontSize: 15,
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
        style={{ backgroundColor: "#F0F2F5", borderTop: "1px solid #D1D7DB" }}
      >
        {/* Text input */}
        <div
          className="flex-1 flex items-center px-4 rounded-full"
          style={{ backgroundColor: "white", border: "1px solid #D1D7DB", minHeight: 52 }}
        >
          <input
            ref={inputRef}
            type="text"
            value={isListening ? "🎙 Escuchando..." : inputText}
            onChange={(e) => !isListening && setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escriba su consulta aquí..."
            readOnly={isListening}
            className="flex-1 bg-transparent outline-none py-2"
            style={{
              fontSize: 17,
              color: isListening ? "#128C7E" : "#111B21",
              fontFamily: "'Atkinson Hyperlegible', sans-serif",
            }}
          />
        </div>

        {/* Mic */}
        {speechSupported && (
          <button
            onClick={isListening ? stopListening : startListening}
            className="rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{
              width: 52,
              height: 52,
              backgroundColor: isListening ? "#DC2626" : "#128C7E",
              boxShadow: isListening
                ? "0 0 0 6px rgba(220,38,38,0.2)"
                : "0 2px 8px rgba(18,140,126,0.3)",
            }}
          >
            {isListening
              ? <MicOff size={24} color="white" strokeWidth={2} />
              : <Mic size={24} color="white" strokeWidth={2} />
            }
          </button>
        )}

        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!inputText.trim() || isListening}
          className="rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
          style={{
            width: 52,
            height: 52,
            backgroundColor: inputText.trim() && !isListening ? "#25D366" : "#C8C8C8",
            boxShadow: inputText.trim() && !isListening
              ? "0 2px 8px rgba(37,211,102,0.35)"
              : "none",
          }}
        >
          <Send size={22} color="white" strokeWidth={2.5} />
        </button>
      </div>

      <style>{`
        @keyframes wa-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
