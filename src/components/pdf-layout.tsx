"use client";

import { ElternInfobogen, Finding } from "@/lib/types";

interface PdfLayoutProps {
  report: ElternInfobogen;
  anmerkungen: string;
}

const COLORS = {
  brand: "#005ca9",
  brandDark: "#004a87",
  sensorik: "#005ca9",
  sensorikBg: "#eff6ff",
  motorik: "#7c3aed",
  motorikBg: "#f5f3ff",
  kognition: "#059669",
  kognitionBg: "#ecfdf5",
  gray50: "#f9fafb",
  gray100: "#f3f4f6",
  gray200: "#e5e7eb",
  gray300: "#d1d5db",
  gray400: "#9ca3af",
  gray500: "#6b7280",
  gray600: "#4b5563",
  gray700: "#374151",
  gray800: "#1f2937",
  gray900: "#111827",
  white: "#ffffff",
  amber600: "#d97706",
  amberBg: "#fffbeb",
  greenBg: "#f0fdf4",
  green700: "#15803d",
};

function FindingCardPdf({
  finding,
  accentColor,
}: {
  finding: Finding;
  accentColor: string;
}) {
  return (
    <div
      data-pdf-block
      style={{
        borderRadius: "8px",
        backgroundColor: COLORS.white,
        marginBottom: "10px",
        overflow: "hidden",
        border: `1px solid ${COLORS.gray200}`,
        borderLeftWidth: "4px",
        borderLeftColor: accentColor,
      }}
    >
      {/* Beobachtung */}
      <div
        style={{
          padding: "10px 14px 6px 14px",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "14px", lineHeight: "1", marginTop: "2px", flexShrink: 0 }}>
          👁
        </span>
        <div>
          <div
            style={{
              fontSize: "9px",
              fontWeight: 600,
              color: accentColor,
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
              marginBottom: "2px",
            }}
          >
            Beobachtung
          </div>
          <div style={{ fontSize: "11px", color: COLORS.gray800, lineHeight: "1.5" }}>
            {finding.beobachtung}
          </div>
        </div>
      </div>

      {/* Bedeutung */}
      <div
        style={{
          padding: "6px 14px",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          backgroundColor: COLORS.amberBg,
        }}
      >
        <span style={{ fontSize: "14px", lineHeight: "1", marginTop: "2px", flexShrink: 0 }}>
          💡
        </span>
        <div>
          <div
            style={{
              fontSize: "9px",
              fontWeight: 600,
              color: COLORS.amber600,
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
              marginBottom: "2px",
            }}
          >
            Was bedeutet das?
          </div>
          <div style={{ fontSize: "11px", color: COLORS.gray800, lineHeight: "1.5" }}>
            {finding.bedeutung}
          </div>
        </div>
      </div>

      {/* Empfehlung */}
      <div
        style={{
          padding: "6px 14px 10px 14px",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          backgroundColor: COLORS.greenBg,
        }}
      >
        <span style={{ fontSize: "14px", lineHeight: "1", marginTop: "2px", flexShrink: 0 }}>
          💚
        </span>
        <div>
          <div
            style={{
              fontSize: "9px",
              fontWeight: 600,
              color: COLORS.green700,
              textTransform: "uppercase" as const,
              letterSpacing: "0.5px",
              marginBottom: "2px",
            }}
          >
            Was Sie tun können
          </div>
          <div style={{ fontSize: "11px", color: COLORS.gray800, lineHeight: "1.5" }}>
            {finding.empfehlung}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  emoji,
  bgColor,
}: {
  title: string;
  emoji: string;
  bgColor: string;
}) {
  return (
    <div
      data-pdf-block
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "12px",
        marginTop: "24px",
      }}
    >
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "8px",
          backgroundColor: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
        }}
      >
        {emoji}
      </div>
      <h2 style={{ fontSize: "16px", fontWeight: 700, color: COLORS.gray900, margin: 0 }}>
        {title}
      </h2>
      <div style={{ flex: 1, height: "2px", backgroundColor: bgColor, borderRadius: "1px" }} />
    </div>
  );
}

export function PdfLayout({ report, anmerkungen }: PdfLayoutProps) {
  const visibleSensorik = report.sensorik.findings.filter((f) => !f.hidden);
  const visibleMotorik = report.motorik.findings.filter((f) => !f.hidden);
  const visibleKognition = report.kognition.findings.filter((f) => !f.hidden);
  const hasHidden =
    report.sensorik.findings.some((f) => f.hidden) ||
    report.motorik.findings.some((f) => f.hidden) ||
    report.kognition.findings.some((f) => f.hidden);

  return (
    <div
      style={{
        width: "794px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: COLORS.gray800,
        backgroundColor: COLORS.white,
        lineHeight: "1.5",
        padding: "0 40px",
      }}
    >
      {/* ===== HEADER / COVER ===== */}
      <div data-pdf-block style={{ paddingTop: "36px" }}>
        {/* Logo + Institution */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "8px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.jpg"
            alt="Blindeninstitut"
            style={{ height: "40px", width: "auto" }}
            crossOrigin="anonymous"
          />
          <div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: COLORS.gray900 }}>
              Blindeninstitutsstiftung
            </div>
            <div style={{ fontSize: "10px", color: COLORS.gray500 }}>
              Stiftung des öffentlichen Rechts
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: "3px",
            background: `linear-gradient(to right, ${COLORS.brand}, ${COLORS.brand}88)`,
            borderRadius: "2px",
            margin: "12px 0 20px 0",
          }}
        />

        {/* Title */}
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: COLORS.brand, margin: "0 0 4px 0" }}>
          Infobogen für Eltern
        </h1>
        <p style={{ fontSize: "13px", color: COLORS.gray500, margin: "0 0 20px 0" }}>
          Ergebnisse der orthoptischen Überprüfung — verständlich erklärt
        </p>

        {/* Child info box */}
        <div
          style={{
            backgroundColor: COLORS.gray50,
            border: `1px solid ${COLORS.gray200}`,
            borderRadius: "10px",
            padding: "16px 20px",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", fontSize: "12px" }}>
            <div>
              <span style={{ color: COLORS.gray500 }}>Kind: </span>
              <span style={{ fontWeight: 600, color: COLORS.gray900 }}>{report.kindName}</span>
            </div>
            <div>
              <span style={{ color: COLORS.gray500 }}>Geburtsdatum: </span>
              <span style={{ fontWeight: 600, color: COLORS.gray900 }}>{report.geburtsdatum}</span>
            </div>
            <div>
              <span style={{ color: COLORS.gray500 }}>Untersuchung am: </span>
              <span style={{ fontWeight: 600, color: COLORS.gray900 }}>{report.untersuchungsdatum}</span>
            </div>
            <div>
              <span style={{ color: COLORS.gray500 }}>Orthoptistin: </span>
              <span style={{ fontWeight: 600, color: COLORS.gray900 }}>{report.orthoptistin}</span>
            </div>
          </div>

          {report.diagnosen.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <span style={{ fontSize: "11px", color: COLORS.gray500 }}>Diagnosen: </span>
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px", marginTop: "4px" }}>
                {report.diagnosen.map((d, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: "10px",
                      backgroundColor: COLORS.white,
                      border: `1px solid ${COLORS.gray300}`,
                      borderRadius: "4px",
                      padding: "2px 8px",
                      color: COLORS.gray700,
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== INTRO: Liebe Eltern ===== */}
      <div
        data-pdf-block
        style={{
          marginTop: "20px",
          backgroundColor: COLORS.sensorikBg,
          border: `1px solid ${COLORS.brand}22`,
          borderRadius: "10px",
          padding: "16px 20px",
        }}
      >
        <h3 style={{ fontSize: "13px", fontWeight: 700, color: COLORS.brand, margin: "0 0 6px 0" }}>
          Liebe Eltern,
        </h3>
        <p style={{ fontSize: "11px", color: COLORS.gray700, lineHeight: "1.7", margin: "0 0 8px 0" }}>
          dieser Infobogen fasst die Ergebnisse der orthoptischen Untersuchung Ihres Kindes
          in verständlicher Sprache zusammen. Zu jedem Befund finden Sie:
        </p>
        <div style={{ fontSize: "11px", color: COLORS.gray700, lineHeight: "1.8", paddingLeft: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px" }}>👁</span>
            <span><strong>Beobachtung</strong> — Was wurde bei der Untersuchung festgestellt?</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px" }}>💡</span>
            <span><strong>Was bedeutet das?</strong> — Wie wirkt sich das im Alltag Ihres Kindes aus?</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px" }}>💚</span>
            <span><strong>Was Sie tun können</strong> — Konkrete Tipps und Übungen für zu Hause</span>
          </div>
        </div>
        <p style={{ fontSize: "10px", color: COLORS.gray500, lineHeight: "1.6", margin: "8px 0 0 0" }}>
          Bei Fragen wenden Sie sich gerne an Ihre Frühförderin oder an uns (Kontaktdaten am Ende).
        </p>
      </div>

      {/* ===== SECTIONS ===== */}

      {/* Sensorik */}
      {visibleSensorik.length > 0 && (
        <>
          <SectionHeader title="Sensorik" emoji="👁" bgColor={COLORS.sensorikBg} />
          {visibleSensorik.map((f, i) => (
            <FindingCardPdf key={`s-${i}`} finding={f} accentColor={COLORS.sensorik} />
          ))}
        </>
      )}

      {/* Motorik */}
      {visibleMotorik.length > 0 && (
        <>
          <SectionHeader title="Motorik" emoji="🏃" bgColor={COLORS.motorikBg} />
          {visibleMotorik.map((f, i) => (
            <FindingCardPdf key={`m-${i}`} finding={f} accentColor={COLORS.motorik} />
          ))}
        </>
      )}

      {/* Kognition */}
      {visibleKognition.length > 0 && (
        <>
          <SectionHeader title="Kognition & Entwicklung" emoji="🧠" bgColor={COLORS.kognitionBg} />
          {visibleKognition.map((f, i) => (
            <FindingCardPdf key={`k-${i}`} finding={f} accentColor={COLORS.kognition} />
          ))}
        </>
      )}

      {/* Hidden findings note */}
      {hasHidden && (
        <p
          data-pdf-block
          style={{ fontSize: "11px", fontStyle: "italic", color: COLORS.gray500, marginTop: "16px" }}
        >
          Weitere Befunde wurden im persönlichen Gespräch besprochen.
        </p>
      )}

      {/* Anmerkungen */}
      {anmerkungen.trim() && (
        <div
          data-pdf-block
          style={{
            marginTop: "24px",
            backgroundColor: COLORS.gray50,
            border: `1px solid ${COLORS.gray200}`,
            borderRadius: "10px",
            padding: "16px 20px",
          }}
        >
          <h3 style={{ fontSize: "13px", fontWeight: 600, color: COLORS.gray900, margin: "0 0 8px 0" }}>
            Anmerkungen der Frühförderin
          </h3>
          <p
            style={{
              fontSize: "11px",
              color: COLORS.gray700,
              margin: 0,
              lineHeight: "1.6",
              whiteSpace: "pre-wrap" as const,
            }}
          >
            {anmerkungen}
          </p>
        </div>
      )}

      {/* ===== INSTITUTIONAL INFO ===== */}
      <div
        data-pdf-block
        style={{
          height: "2px",
          backgroundColor: COLORS.gray200,
          margin: "32px 0 0 0",
          borderRadius: "1px",
        }}
      />

      <div data-pdf-block style={{ marginTop: "24px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: COLORS.brand, margin: "0 0 10px 0" }}>
          Über das Blindeninstitut
        </h2>
        <p style={{ fontSize: "11px", color: COLORS.gray700, lineHeight: "1.7", margin: "0" }}>
          Die Blindeninstitutsstiftung begleitet seit über 170 Jahren blinde,
          sehbehinderte und taubblinde Menschen in verschiedenen Lebensphasen. Als
          Stiftung des öffentlichen Rechts sind wir an 7 Standorten in Bayern und
          Thüringen mit rund 2.500 Mitarbeitenden für Kinder, Jugendliche und
          Erwachsene da.
        </p>
      </div>

      {/* Frühförderung box */}
      <div
        data-pdf-block
        style={{
          marginTop: "16px",
          backgroundColor: COLORS.sensorikBg,
          border: `1px solid ${COLORS.brand}33`,
          borderRadius: "10px",
          padding: "16px 20px",
        }}
      >
        <h3 style={{ fontSize: "13px", fontWeight: 700, color: COLORS.brand, margin: "0 0 8px 0" }}>
          Frühförderung Sehen — Thüringen
        </h3>
        <p style={{ fontSize: "11px", color: COLORS.gray700, lineHeight: "1.6", margin: "0 0 12px 0" }}>
          Unsere mobile Frühförderung unterstützt Ihr Kind direkt zu Hause
          oder in der Kita — kostenlos und ohne Überweisung. Unser Team aus
          Pädagoginnen und einer Orthoptistin berät Sie individuell.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
          <div>
            <div style={{ fontWeight: 600, color: COLORS.gray900, marginBottom: "2px" }}>
              Standort Erfurt
            </div>
            <div style={{ color: COLORS.gray600 }}>Tel: 0361 43068311</div>
            <div style={{ color: COLORS.gray600 }}>Koenbergkstraße 3, 99084 Erfurt</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: COLORS.gray900, marginBottom: "2px" }}>
              Standort Schmalkalden
            </div>
            <div style={{ color: COLORS.gray600 }}>Tel: 03683 643-0</div>
            <div style={{ color: COLORS.gray600 }}>Notstraße 11, 98574 Schmalkalden</div>
          </div>
        </div>

        <div style={{ marginTop: "8px", fontSize: "11px", color: COLORS.gray600 }}>
          E-Mail: ff-thueringen@blindeninstitut.de
        </div>
      </div>

      {/* Links */}
      <div data-pdf-block style={{ marginTop: "16px", marginBottom: "8px" }}>
        <h3 style={{ fontSize: "13px", fontWeight: 600, color: COLORS.gray900, margin: "0 0 8px 0" }}>
          Weiterführende Informationen
        </h3>
        <div style={{ fontSize: "11px", color: COLORS.gray600, lineHeight: "1.8" }}>
          <div>
            <span style={{ color: COLORS.brand, fontWeight: 500 }}>www.blindeninstitut.de</span>
            <span style={{ color: COLORS.gray400 }}> — Startseite</span>
          </div>
          <div>
            <span style={{ color: COLORS.brand, fontWeight: 500 }}>
              www.blindeninstitut.de/de/angebote/fruehfoerderung-sehen
            </span>
            <span style={{ color: COLORS.gray400 }}> — Frühförderung Sehen</span>
          </div>
          <div>
            <span style={{ color: COLORS.brand, fontWeight: 500 }}>
              www.blindeninstitut.de/de/blindeninstitute/thueringen
            </span>
            <span style={{ color: COLORS.gray400 }}> — Blindeninstitut Thüringen</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div data-pdf-block>
        <div style={{ height: "2px", backgroundColor: COLORS.gray200, borderRadius: "1px", marginBottom: "12px" }} />
        <div style={{ textAlign: "center" as const, fontSize: "10px", color: COLORS.gray400, paddingBottom: "24px" }}>
          Erstellt mit Blindi | Blindeninstitutsstiftung | {new Date().toLocaleDateString("de-DE")}
        </div>
      </div>
    </div>
  );
}
