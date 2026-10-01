import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  Calendar,
  House,
  LayoutGrid,
  Menu as MenuIcon,
  Tag,
  Wallet,
} from "lucide-react";

/* ---------------------------------------------------------------- *
 * Tipos
 * ---------------------------------------------------------------- */

type Screen =
  | "splash"
  | "home"
  | "carteira"
  | "viewer"
  | "gerar-codigo"
  | "procuracao"
  | "agenda"
  | "caixa-postal"
  | "em-breve";

const SLIDES = [
  "https://i.imgur.com/dqEzlZy.jpeg",
  "https://i.imgur.com/3SMcbOg.jpeg",
  "https://i.imgur.com/j4pCukh.jpeg",
  "https://i.imgur.com/ZaUCBDv.jpeg",
];

const ZOOM_IMAGES = [
  "https://i.imgur.com/0p8W36O.png",
  "https://i.imgur.com/F5Nx6Ag.jpeg",
  "https://i.imgur.com/S9mJYF4.png",
  "https://i.imgur.com/2jFEdpL.png",
];

const invisibleBtn: CSSProperties = {
  background: "transparent",
  border: "none",
  padding: 0,
  cursor: "pointer",
};

/* ---------------------------------------------------------------- *
 * InnerHeader
 * ---------------------------------------------------------------- */

function InnerHeader({ onBack }: { onBack: () => void }) {
  const letter: CSSProperties = {
    fontWeight: 700,
    letterSpacing: "-0.04em",
    fontSize: 22,
    WebkitTextStroke: "0.4px white",
  };
  return (
    <div
      style={{
        background: "white",
        display: "flex",
        alignItems: "center",
        padding: 16,
        borderBottom: "1px solid #f3f4f6",
      }}
    >
      <button aria-label="Voltar" onClick={onBack} style={{ ...invisibleBtn }}>
        <ArrowLeft size={22} color="#1351B4" />
      </button>
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          marginRight: 24,
          filter: "drop-shadow(0 0 1px white)",
        }}
      >
        <span style={{ ...letter, color: "#1351B4" }}>g</span>
        <span style={{ ...letter, color: "#FFCD07" }}>o</span>
        <span style={{ ...letter, color: "#168821" }}>v</span>
        <span style={{ ...letter, color: "#1351B4" }}>.</span>
        <span style={{ ...letter, color: "#1351B4" }}>b</span>
        <span style={{ ...letter, color: "#FFCD07" }}>r</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * App
 * ---------------------------------------------------------------- */

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("splash");
  const [prevScreen, setPrevScreen] = useState<Screen | null>(null);
  const [emBreveTitle, setEmBreveTitle] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);

  const [zoomOpen, setZoomOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastTouchDistance = useRef(0);
  const lastTouchMid = useRef({ x: 0, y: 0 });
  const lastPanTouch = useRef({ x: 0, y: 0 });

  const MIN_SCALE = 1;
  const MAX_SCALE = 5;

  const currentLayerRef = useRef<HTMLDivElement | null>(null);
  const prevLayerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* -------------------- navegação com animação -------------------- */

  const navigate = (to: Screen, back = false) => {
    if (to === currentScreen) return;
    setPrevScreen(currentScreen);
    setCurrentScreen(to);
    requestAnimationFrame(() => {
      const cur = currentLayerRef.current;
      const prev = prevLayerRef.current;
      if (cur) {
        cur.classList.remove("scr-in-fwd", "scr-in-back");
        void cur.offsetWidth;
        cur.classList.add(back ? "scr-in-back" : "scr-in-fwd");
      }
      if (prev) {
        prev.classList.remove("scr-out-fwd", "scr-out-back");
        void prev.offsetWidth;
        prev.classList.add(back ? "scr-out-back" : "scr-out-fwd");
      }
    });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPrevScreen(null), 300);
  };

  const goEmBreve = (title: string) => {
    setEmBreveTitle(title);
    navigate("em-breve");
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (currentScreen === "viewer") {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [currentScreen]);

  /* -------------------------- zoom logic -------------------------- */

  function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
  }

  function zoomAt(cursorX: number, cursorY: number, zoomFactor: number) {
    const newScale = clamp(scale * zoomFactor, MIN_SCALE, MAX_SCALE);
    if (newScale === MIN_SCALE) {
      setScale(1);
      setPanX(0);
      setPanY(0);
      return;
    }
    const newPanX = cursorX - (cursorX - panX) * (newScale / scale);
    const newPanY = cursorY - (cursorY - panY) * (newScale / scale);
    setScale(newScale);
    setPanX(newPanX);
    setPanY(newPanY);
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    zoomAt(cursorX, cursorY, zoomFactor);
  }

  function getDistance(t1: React.Touch, t2: React.Touch) {
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
  }

  function getMidpoint(t1: React.Touch, t2: React.Touch, rect: DOMRect) {
    return {
      x: (t1.clientX + t2.clientX) / 2 - rect.left,
      y: (t1.clientY + t2.clientY) / 2 - rect.top,
    };
  }

  function handleTouchStart(e: React.TouchEvent) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    if (e.touches.length === 2 && t1 && t2) {
      lastTouchDistance.current = getDistance(t1, t2);
      lastTouchMid.current = getMidpoint(t1, t2, rect);
    } else if (e.touches.length === 1 && t1 && scale > 1) {
      lastPanTouch.current = { x: t1.clientX, y: t1.clientY };
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    if (e.touches.length === 2 && t1 && t2) {
      const newDistance = getDistance(t1, t2);
      const mid = getMidpoint(t1, t2, rect);
      const zoomFactor = newDistance / lastTouchDistance.current;
      zoomAt(mid.x, mid.y, zoomFactor);
      lastTouchDistance.current = newDistance;
      lastTouchMid.current = mid;
    } else if (e.touches.length === 1 && t1 && scale > 1) {
      const dx = t1.clientX - lastPanTouch.current.x;
      const dy = t1.clientY - lastPanTouch.current.y;
      setPanX((prev) => prev + dx);
      setPanY((prev) => prev + dy);
      lastPanTouch.current = { x: t1.clientX, y: t1.clientY };
    }
  }

  function resetZoom() {
    setScale(1);
    setPanX(0);
    setPanY(0);
  }

  const openZoom = () => {
    resetZoom();
    setZoomOpen(true);
  };

  /* -------------------------- ações sheet -------------------------- */

  const baixarDocumento = () => {
    const src = SLIDES[currentSlide];
    if (!src) return;
    const a = document.createElement("a");
    a.href = src;
    a.download = "";
    a.click();
    setShowOptions(false);
  };

  const compartilhar = async () => {
    const url = SLIDES[currentSlide];
    if (!url) return;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* usuário cancelou ou API indisponível */
    }
    setShowOptions(false);
  };

  /* ----------------------------- telas ----------------------------- */

  const renderScreen = (screen: Screen) => {
    switch (screen) {
      case "splash":
        return <SplashScreen onEnter={() => navigate("home")} />;
      case "home":
        return <HomeScreen navigate={navigate} goEmBreve={goEmBreve} />;
      case "carteira":
        return (
          <CarteiraScreen
            onOpenViewer={() => navigate("viewer")}
            onAddDoc={() => setShowAddDoc(true)}
          />
        );
      case "viewer":
        return (
          <ViewerScreen
            currentSlide={currentSlide}
            setCurrentSlide={setCurrentSlide}
            onClose={() => navigate("carteira", true)}
            onZoom={openZoom}
            onOptions={() => setShowOptions(true)}
          />
        );
      case "gerar-codigo":
        return <GerarCodigoScreen onBack={() => navigate("home", true)} />;
      case "procuracao":
        return <ProcuracaoScreen onBack={() => navigate("home", true)} />;
      case "agenda":
        return <AgendaScreen onBack={() => navigate("home", true)} />;
      case "caixa-postal":
        return <CaixaPostalScreen onBack={() => navigate("home", true)} />;
      case "em-breve":
        return <EmBreveScreen title={emBreveTitle} onBack={() => navigate("home", true)} />;
    }
  };

  const layerStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    background: "white",
    overflowY: "auto",
  };

  const navItemColor = (s: Screen) => (currentScreen === s ? "#1351B4" : "#9ca3af");

  return (
    <div
      style={{
        margin: "0 auto",
        maxWidth: 430,
        height: "100vh",
        background: "white",
        overflow: "hidden",
        boxShadow: "0 0 24px rgba(0,0,0,0.12)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes scrInFwd { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes scrOutFwd { from { transform: translateX(0); } to { transform: translateX(-100%); } }
        @keyframes scrInBack { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes scrOutBack { from { transform: translateX(0); } to { transform: translateX(100%); } }
        .scr-in-fwd { animation: scrInFwd 280ms cubic-bezier(0.4, 0, 0.2, 1) both; }
        .scr-out-fwd { animation: scrOutFwd 280ms cubic-bezier(0.4, 0, 0.2, 1) both; }
        .scr-in-back { animation: scrInBack 280ms cubic-bezier(0.4, 0, 0.2, 1) both; }
        .scr-out-back { animation: scrOutBack 280ms cubic-bezier(0.4, 0, 0.2, 1) both; }
        .gov-input:focus { outline: none; border-color: #1351B4; }
      `}</style>

      <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
        {prevScreen && (
          <div ref={prevLayerRef} style={{ ...layerStyle, overflow: prevScreen === "viewer" ? "hidden" : "auto", zIndex: 1 }}>
            {renderScreen(prevScreen)}
          </div>
        )}
        <div ref={currentLayerRef} style={{ ...layerStyle, overflow: currentScreen === "viewer" ? "hidden" : "auto", zIndex: 2 }}>
          {renderScreen(currentScreen)}
        </div>

        {showOptions && (
          <div
            onClick={() => setShowOptions(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 100,
              display: "flex",
              alignItems: "flex-end",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                background: "white",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                padding: "12px 0",
              }}
            >
              <button
                onClick={baixarDocumento}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  padding: 16,
                  color: "#1351B4",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Baixar documento
              </button>
              <button
                onClick={compartilhar}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderTop: "1px solid #eee",
                  padding: 16,
                  color: "#1351B4",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Compartilhar
              </button>
              <button
                onClick={() => setShowOptions(false)}
                style={{
                  width: "100%",
                  background: "transparent",
                  border: "none",
                  borderTop: "1px solid #eee",
                  padding: 16,
                  color: "#666",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {showAddDoc && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 150,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 16,
                padding: 24,
                maxWidth: 360,
                width: "100%",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Wallet size={24} color="#1351B4" />
              </div>
              <p
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#111",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                Adicionar documento
              </p>
              <p style={{ color: "#6b7280", textAlign: "center", marginBottom: 24 }}>
                Nenhum documento disponível para adicionar.
              </p>
              <button
                onClick={() => setShowAddDoc(false)}
                style={{
                  width: "100%",
                  background: "#1351B4",
                  color: "white",
                  fontWeight: 700,
                  padding: 12,
                  borderRadius: 50,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>

      {currentScreen !== "splash" && !zoomOpen && (
        <div
          style={{
            height: 72,
            background: "white",
            borderTop: "1px solid #f3f4f6",
            display: "flex",
            justifyContent: "space-around",
            alignItems: "flex-end",
            paddingBottom: 8,
            paddingTop: 4,
            zIndex: 50,
          }}
        >
          <NavItem
            label="Início"
            color={navItemColor("home")}
            active={currentScreen === "home"}
            icon={<House size={22} color={navItemColor("home")} />}
            onClick={() => navigate("home", true)}
          />
          <NavItem
            label="Dados"
            color="#9ca3af"
            active={false}
            icon={<Tag size={22} color="#9ca3af" />}
            onClick={() => goEmBreve("Dados")}
          />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                background: "#168821",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LayoutGrid size={24} color="white" />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af" }}>QR Code</span>
          </div>
          <NavItem
            label="Carteira"
            color={navItemColor("carteira")}
            active={currentScreen === "carteira"}
            icon={<Wallet size={22} color={navItemColor("carteira")} />}
            onClick={() => navigate("carteira")}
          />
          <NavItem
            label="Menu"
            color="#9ca3af"
            active={false}
            icon={<MenuIcon size={22} color="#9ca3af" />}
            onClick={() => goEmBreve("Menu")}
          />
        </div>
      )}

      {zoomOpen && (
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          style={{
            position: "fixed",
            inset: 0,
            background: "black",
            zIndex: 200,
            overflow: "hidden",
            touchAction: "none",
          }}
        >
          <img
            src={ZOOM_IMAGES[currentSlide]}
            alt="Documento ampliado"
            style={{
              width: "100%",
              height: "100vh",
              objectFit: "contain",
              display: "block",
              transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
              transformOrigin: "0 0",
              transition: "none",
              willChange: "transform",
            }}
          />
          <button
            onClick={() => {
              resetZoom();
              setZoomOpen(false);
            }}
            style={{
              position: "fixed",
              top: 12,
              right: 12,
              width: 44,
              height: 44,
              background: "rgba(0,0,0,0.5)",
              border: "none",
              borderRadius: "50%",
              color: "white",
              fontSize: 22,
              zIndex: 201,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Bottom nav item
 * ---------------------------------------------------------------- */

function NavItem({
  label,
  icon,
  color,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        ...invisibleBtn,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      {icon}
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{label}</span>
      {active && (
        <span
          style={{ width: 4, height: 4, borderRadius: "50%", background: "#1351B4" }}
        />
      )}
    </button>
  );
}

/* ---------------------------------------------------------------- *
 * Telas
 * ---------------------------------------------------------------- */

function SplashScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <img
        src="https://i.imgur.com/B58dPwJ.jpeg"
        alt="Tela inicial gov.br"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 24 }}>
        <button
          onClick={onEnter}
          style={{
            background: "transparent",
            color: "transparent",
            border: "none",
            width: "100%",
            padding: 16,
            borderRadius: 50,
            cursor: "pointer",
          }}
        >
          Entrar
        </button>
        <p style={{ color: "white", textAlign: "center", fontSize: 13 }}>
          Clique para criar ou acessar sua conta gov.br
        </p>
        <p style={{ color: "white", textAlign: "center" }}>🛡️ Gerar código de acesso</p>
        <p style={{ color: "white", textAlign: "center" }}>▦ Ler QR code</p>
        <p style={{ color: "white", textAlign: "right", fontSize: 12 }}>3.8.3</p>
      </div>
      <button
        aria-label="Entrar ou criar conta gov.br"
        onClick={onEnter}
        style={{
          position: "absolute",
          left: "11%",
          top: "74%",
          width: "74%",
          height: "3%",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          zIndex: 20,
        }}
      />
    </div>
  );
}

function HomeScreen({
  navigate,
  goEmBreve,
}: {
  navigate: (to: Screen, back?: boolean) => void;
  goEmBreve: (title: string) => void;
}) {
  const imgStyle: CSSProperties = { width: "100%", height: "auto", display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0, padding: 0 }}>
      <div style={{ position: "relative" }}>
        <img src="https://i.imgur.com/0JaeKBV.jpeg" alt="Serviços gov.br" style={imgStyle} />
        <button
          aria-label="Abrir carteira de documentos"
          onClick={() => navigate("carteira")}
          style={{
            position: "absolute",
            top: "92%",
            left: "4%",
            width: "89%",
            height: "7.3%",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            zIndex: 20,
          }}
        />
      </div>
      <div style={{ position: "relative" }}>
        <img src="https://i.imgur.com/MU449ST.jpeg" alt="Mais serviços gov.br" style={imgStyle} />
      </div>
    </div>
  );
}

function CarteiraScreen({
  onOpenViewer,
  onAddDoc,
}: {
  onOpenViewer: () => void;
  onAddDoc: () => void;
}) {
  return (
    <div style={{ height: "calc(100vh - 72px)", position: "relative", overflow: "hidden" }}>
      <img
        src="https://i.imgur.com/bfvUjgJ.jpeg"
        alt="Carteira de documentos"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "top",
          display: "block",
        }}
      />
      <button
        aria-label="Abrir documento"
        onClick={onOpenViewer}
        style={{
          ...invisibleBtn,
          position: "absolute",
          top: "18%",
          left: "5%",
          width: "90%",
          height: "28%",
        }}
      />
      <button
        aria-label="Adicionar documento"
        onClick={onAddDoc}
        style={{
          ...invisibleBtn,
          position: "absolute",
          bottom: "4%",
          left: "5%",
          width: "90%",
          height: "8%",
        }}
      />
    </div>
  );
}

function ViewerScreen({
  currentSlide,
  setCurrentSlide,
  onClose,
  onZoom,
  onOptions,
}: {
  currentSlide: number;
  setCurrentSlide: (n: number) => void;
  onClose: () => void;
  onZoom: () => void;
  onOptions: () => void;
}) {
  const slideRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = slideRef.current;
    if (!el) return;

    let start: { x: number; y: number } | null = null;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) start = { x: t.clientX, y: t.clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!start || !t) return;
      const dx = Math.abs(t.clientX - start.x);
      const dy = Math.abs(t.clientY - start.y);
      if (dy > dx) e.preventDefault();
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return (
    <div
      ref={slideRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        touchAction: "pan-x",
      }}
    >
      <img
        src={SLIDES[currentSlide]}
        alt={`Documento ${currentSlide + 1}`}
        style={{ width: "100%", flex: 1, objectFit: "fill", display: "block" }}
      />
      <button
        aria-label="Fechar"
        onClick={onClose}
        style={{
          ...invisibleBtn,
          position: "absolute",
          top: 0,
          right: 0,
          width: "15%",
          height: "7%",
          zIndex: 20,
        }}
      />
      <button
        aria-label="Ampliar"
        onClick={onZoom}
        style={{
          ...invisibleBtn,
          position: "absolute",
          left: "2%",
          bottom: 90,
          width: 56,
          height: 56,
          zIndex: 2,
        }}
      />
      <button
        aria-label="Opções"
        onClick={onOptions}
        style={{
          ...invisibleBtn,
          position: "absolute",
          right: "2%",
          bottom: 90,
          width: 56,
          height: 56,
          zIndex: 2,
        }}
      />
      {currentSlide > 0 && (
        <button
          aria-label="Anterior"
          onClick={() => setCurrentSlide(currentSlide - 1)}
          style={{
            ...invisibleBtn,
            position: "absolute",
            left: "22%",
            bottom: 90,
            width: 44,
            height: 56,
            zIndex: 3,
          }}
        />
      )}
      {currentSlide < 3 && (
        <button
          aria-label="Próximo"
          onClick={() => setCurrentSlide(currentSlide + 1)}
          style={{
            ...invisibleBtn,
            position: "absolute",
            right: "22%",
            bottom: 90,
            width: 44,
            height: 56,
            zIndex: 3,
          }}
        />
      )}
    </div>
  );
}

function GerarCodigoScreen({ onBack }: { onBack: () => void }) {
  const [valor, setValor] = useState("");
  return (
    <div>
      <InnerHeader onBack={onBack} />
      <div style={{ padding: 16 }}>
        <label
          htmlFor="identificador"
          style={{
            display: "block",
            fontSize: 13,
            fontWeight: 500,
            color: "#374151",
            marginBottom: 8,
          }}
        >
          Identificador
        </label>
        <input
          id="identificador"
          className="gov-input"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          style={{
            width: "100%",
            border: "1px solid #d1d5db",
            borderRadius: 8,
            padding: 12,
            fontSize: 15,
          }}
        />
        <button
          style={{
            background: "#1351B4",
            color: "white",
            fontWeight: 700,
            padding: 12,
            borderRadius: 50,
            border: "none",
            width: "100%",
            marginTop: 16,
            cursor: "pointer",
          }}
        >
          Gerar
        </button>
      </div>
    </div>
  );
}

function ProcuracaoScreen({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <InnerHeader onBack={onBack} />
      <p style={{ color: "#9ca3af", textAlign: "center", paddingTop: 80 }}>
        Nenhuma procuração encontrada.
      </p>
    </div>
  );
}

function AgendaScreen({ onBack }: { onBack: () => void }) {
  const itens = [
    { titulo: "Renovação CNH", data: "15 Jun 09:00", local: "Detran Sede" },
    { titulo: "Consulta Médica", data: "18 Jun 14:30", local: "Posto Central" },
  ];
  return (
    <div>
      <InnerHeader onBack={onBack} />
      <div style={{ padding: 16 }}>
        <h1 style={{ color: "#1351B4", fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
          Agenda gov.br
        </h1>
        {itens.map((i) => (
          <div
            key={i.titulo}
            style={{
              border: "1px solid #f3f4f6",
              borderRadius: 12,
              padding: 16,
              background: "#f9fafb",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={18} color="#1351B4" />
              <span style={{ fontWeight: 700, color: "#1351B4" }}>{i.titulo}</span>
            </div>
            <p style={{ fontSize: 13, color: "#6b7280" }}>{i.data}</p>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{i.local}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaixaPostalScreen({ onBack }: { onBack: () => void }) {
  const itens = [
    { de: "Receita Federal", data: "Hoje", assunto: "Sua declaração foi processada" },
    { de: "Justiça Eleitoral", data: "Ontem", assunto: "Título de eleitor digital" },
    { de: "Ministério da Saúde", data: "2 dias atrás", assunto: "Campanha de Vacinação" },
  ];
  return (
    <div>
      <InnerHeader onBack={onBack} />
      <div style={{ padding: 16 }}>
        <h1 style={{ color: "#1351B4", fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
          Caixa Postal
        </h1>
        {itens.map((i) => (
          <div key={i.de} style={{ borderBottom: "1px solid #f3f4f6", padding: "16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontWeight: 700, color: "#1351B4" }}>{i.de}</span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>{i.data}</span>
            </div>
            <p style={{ fontSize: 13, color: "#6b7280" }}>{i.assunto}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmBreveScreen({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div>
      <InnerHeader onBack={onBack} />
      <div style={{ paddingTop: 80, textAlign: "center" }}>
        <h1 style={{ color: "#1351B4", fontSize: 20, fontWeight: 700 }}>{title}</h1>
        <p style={{ color: "#9ca3af" }}>Em breve disponível.</p>
      </div>
    </div>
  );
}
