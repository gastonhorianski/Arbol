export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
        background:
          "radial-gradient(circle at 20% 20%, #dfece4 0%, transparent 45%), radial-gradient(circle at 80% 0%, #f0e6d8 0%, transparent 40%), #f7f6f2",
        color: "#1a1f1c",
        fontFamily: "Georgia, 'Times New Roman', serif",
      }}
    >
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <p
          style={{
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontSize: 12,
            color: "#1f5c45",
            marginBottom: 12,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Knowledge Graph
        </p>
        <h1 style={{ fontSize: "clamp(2.5rem, 8vw, 4.5rem)", margin: 0, lineHeight: 1.05 }}>
          Árbol
        </h1>
        <p style={{ marginTop: 16, fontSize: 18, lineHeight: 1.5, color: "#4a554e" }}>
          Mapa de relaciones entre políticos, familiares, empresas y subsidios.
          Día 0 listo: GitHub + Vercel + Supabase.
        </p>
      </div>
    </main>
  );
}
