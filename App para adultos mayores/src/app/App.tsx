import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, MicOff, Bus, Phone } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Sender = "user" | "bot";

interface Message {
  id: number;
  from: Sender;
  text: string;
  time: string;
  read?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowTime(): string {
  return new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

// ─── Bot knowledge base ───────────────────────────────────────────────────────

const knowledge: { keywords: string[]; response: string }[] = [
  {
    keywords: ["ruta", "rutas", "línea", "líneas", "adónde va", "donde va", "recorrido"],
    response:
      "🚌 *Recorridos de buses disponibles:*\n\n📍 *Línea 1* – Terminal ↔ Hospital Central\n📍 *Línea 3* – Mercado Central ↔ Villa Norte\n📍 *Línea 7* – Plaza de Armas ↔ Estadio Municipal\n📍 *Línea 12* – Universidad ↔ Aeropuerto\n📍 *Línea 15* – Centro ↔ Sector Sur\n\nDígame desde qué sector necesita viajar y le indico qué línea tomar.",
  },
  {
    keywords: ["tarifa", "precio", "costo", "pasaje", "cuánto vale", "cuanto vale", "cuánto cuesta el bus", "pagar bus"],
    response:
      "💰 *Tarifas de buses:*\n\n👴 *Adulto Mayor* con Pase Libre → *$0 (gratuito)*\n🎓 *Estudiante* → $280\n👤 *Adulto general* → $800\n\n⏰ En horario valle (fuera de hora punta) hay un 15% de descuento adicional para todos.\n\n¿Desea saber cómo obtener su Pase Libre gratuito?",
  },
  {
    keywords: ["pase libre", "pase", "gratuito", "gratis", "beneficio", "adulto mayor"],
    response:
      "🎫 *Pase Libre para Adulto Mayor:*\n\nCon este pase viaja *sin costo* en todos los buses de la ciudad.\n\n*Cómo obtenerlo:*\n1️⃣ Vaya al municipio con su carnet de identidad vigente.\n2️⃣ Solicite el formulario de Pase Libre en la ventanilla.\n3️⃣ Adjunte una foto carné y fotocopia de su carnet.\n4️⃣ Espere entre 15 y 30 días hábiles.\n5️⃣ Recibe su pase en su domicilio.\n\n✅ No tiene costo tramitarlo.",
  },
  {
    keywords: ["paradero", "parada", "dónde espero", "donde espero", "dónde tomo", "dónde subo"],
    response:
      "📍 *Cómo encontrar su paradero:*\n\n🔵 Los paraderos tienen un letrero con el número de línea.\n🔵 Espere siempre en la vereda, nunca en la calzada.\n🔵 Levante la mano para que el conductor vea que subirá.\n🔵 El bus se detiene solo si ve a alguien esperando.\n\n💡 Si no conoce el paradero más cercano, pregúntele a un vecino o comerciante del sector.",
  },
  {
    keywords: ["horario", "cuando pasa", "cuándo pasa", "frecuencia", "a qué hora", "primer bus", "último bus"],
    response:
      "🕐 *Horarios de buses:*\n\n🌅 *Primer bus:* 6:00 hrs\n🌙 *Último bus:* 22:30 hrs\n\n⚡ *Hora punta* (buses más frecuentes):\n• Mañana: 7:00 – 9:00 hrs\n• Tarde: 17:00 – 20:00 hrs\n\n😌 *Fuera de hora punta* va más cómodo y hay menos gente.\n\nLe recomendamos viajar entre las 10:00 y las 16:00 para mayor tranquilidad.",
  },
  {
    keywords: ["asiento", "preferencial", "derecho", "prioridad"],
    response:
      "🪑 *Asiento preferencial en buses:*\n\nComo adulto mayor, *tiene derecho por ley* al asiento preferencial.\n\n✅ Los asientos delanteros están reservados para usted.\n✅ Si están ocupados, puede pedirle cortésmente al pasajero que le ceda el lugar.\n✅ El conductor puede intervenir si alguien se niega.\n✅ No necesita justificar por qué lo necesita.\n\n⚠️ Si alguien le falta el respeto, anote el número del bus y denuncie a la empresa.",
  },
  {
    keywords: ["radio taxi", "radiotaxi", "taxi", "llamar taxi", "pedir taxi", "número taxi"],
    response:
      "🚕 *Radio Taxis de confianza:*\n\n📞 *Radio Taxi Central* → 222 333 444\n📞 *Radio Taxi Seguro* → 222 555 666\n📞 *Radio Taxi Express* → 222 777 888\n📞 *Radio Taxi 24 Horas* → 222 999 000\n\n*Al llamar, diga:*\n• Su nombre completo\n• Su dirección exacta\n• A dónde necesita ir\n\n⚠️ Anote siempre la *patente* y el *nombre del conductor* antes de subir.",
  },
  {
    keywords: ["precio taxi", "cuánto cuesta taxi", "cuanto cuesta taxi", "tarifa taxi", "cobran taxi", "valor taxi"],
    response:
      "💰 *Tarifas de Radio Taxi:*\n\n🏁 *Bajada de bandera:* $1.500\n📏 *Por kilómetro:* $550\n⏱️ *Por minuto de espera:* $200\n\n*Ejemplos orientativos:*\n• Dentro del barrio → ~$2.500\n• Centro a Hospital → ~$3.500\n• Centro a Aeropuerto → ~$8.000\n\n💡 Siempre pregunte el precio estimado *antes de subir* al taxi.",
  },
  {
    keywords: ["seguro", "seguridad", "confiable", "estafa", "peligro", "precaución"],
    response:
      "🛡️ *Cómo viajar seguro en Radio Taxi:*\n\n✅ Llame siempre a empresas conocidas de radio taxi.\n✅ Anote la patente del auto y el nombre del conductor.\n✅ Avise a un familiar a dónde va y cuándo llegará.\n✅ Lleve el dinero justo o pregunte si aceptan tarjeta.\n✅ Viaje con el celular cargado.\n\n❌ *Nunca* suba a un taxi que le ofrezca el viaje directamente en la calle.",
  },
  {
    keywords: ["accesible", "rampa", "silla de ruedas", "bastón", "discapacidad", "movilidad"],
    response:
      "♿ *Transporte accesible para adultos mayores:*\n\n🚌 *Buses accesibles:*\n• Busque el símbolo de silla de ruedas en el bus.\n• Tienen rampa y espacio especial.\n• Suba por la puerta delantera e indique que necesita la rampa.\n\n🚕 *Radio Taxi accesible:*\n• Al llamar, pida expresamente un taxi adaptado.\n• Algunos tienen rampa para silla de ruedas.\n• Confirme el precio antes del viaje.",
  },
];

function getBotResponse(text: string): string {
  const lower = text.toLowerCase();
  for (const item of knowledge) {
    if (item.keywords.some((k) => lower.includes(k))) return item.response;
  }
  return (
    "Lo siento, no encontré información sobre eso. 😊\n\nPuede preguntarme sobre:\n\n🚌 *Buses*\n• Rutas y recorridos\n• Tarifas y pase libre\n• Horarios y paraderos\n• Asientos preferenciales\n\n🚕 *Radio Taxi*\n• Números de contacto\n• Tarifas\n• Consejos de seguridad"
  );
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

  const sendMessage = useCallback((text: string) => {
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

    const delay = 1200 + Math.random() * 700;
    setTimeout(() => {
      const botMsg: Message = {
        id: _nextId++,
        from: "bot",
        text: getBotResponse(text),
        time: nowTime(),
      };
      setMessages((prev) =>
        [...prev.map((m) => (m.id === userMsg.id ? { ...m, read: true } : m)), botMsg]
      );
      setIsTyping(false);
    }, delay);
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
                maxWidth: "78%",
                minWidth: 80,
              }}
            >
              <p
                className="leading-relaxed whitespace-pre-wrap break-words"
                style={{ fontSize: 17, color: "#111B21" }}
              >
                <FormattedText text={msg.text} />
              </p>
              <div className="flex items-center justify-end gap-1 mt-1.5">
                <span style={{ fontSize: 11, color: "#8696A0" }}>{msg.time}</span>
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
