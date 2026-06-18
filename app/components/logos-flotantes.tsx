import Image from "next/image";

type Plat = "aliexpress" | "shein" | "temu" | "ebay";

const items: {
  left: number;
  size: number;
  dur: number;
  delay: number;
  drift: number;
  plat: Plat;
}[] = [
  { left: 6,  size: 44, dur: 20, delay: 0,  drift: 6,  plat: "aliexpress" },
  { left: 20, size: 36, dur: 24, delay: 3,  drift: -5, plat: "shein"      },
  { left: 34, size: 40, dur: 21, delay: 5,  drift: 8,  plat: "temu"       },
  { left: 50, size: 42, dur: 18, delay: 2,  drift: -7, plat: "ebay"       },
  { left: 65, size: 38, dur: 27, delay: 7,  drift: 5,  plat: "aliexpress" },
  { left: 80, size: 40, dur: 22, delay: 1,  drift: -6, plat: "shein"      },
  { left: 90, size: 34, dur: 25, delay: 9,  drift: 4,  plat: "temu"       },
  { left: 12, size: 38, dur: 23, delay: 11, drift: -4, plat: "ebay"       },
  { left: 42, size: 36, dur: 20, delay: 14, drift: 7,  plat: "aliexpress" },
  { left: 58, size: 34, dur: 26, delay: 4,  drift: -6, plat: "shein"      },
  { left: 72, size: 42, dur: 19, delay: 6,  drift: 5,  plat: "temu"       },
  { left: 85, size: 36, dur: 24, delay: 12, drift: -4, plat: "ebay"       },
  { left: 28, size: 40, dur: 22, delay: 8,  drift: 6,  plat: "shein"      },
  { left: 48, size: 34, dur: 28, delay: 15, drift: -5, plat: "aliexpress" },
  { left: 76, size: 38, dur: 21, delay: 10, drift: 4,  plat: "temu"       },
  { left: 3,  size: 36, dur: 25, delay: 13, drift: -7, plat: "ebay"       },
];

const LOGO_SRC: Record<Plat, string> = {
  aliexpress: "/plataforms/aliexpress.png",
  shein:      "/plataforms/Shein.png",
  temu:       "/plataforms/temu.png",
  ebay:       "/plataforms/ebay.png",
};

export default function LogosFlotantes() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {items.map((item, i) => (
        <span
          key={i}
          className="badge-plataforma"
          style={
            {
              left: `${item.left}%`,
              animationDuration: `${item.dur}s`,
              animationDelay: `${item.delay}s`,
              "--drift-badge": `${item.drift}vw`,
            } as React.CSSProperties
          }
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: item.size,
              height: item.size,
              borderRadius: "24%",
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            <Image
              src={LOGO_SRC[item.plat]}
              alt={item.plat}
              width={item.size}
              height={item.size}
              style={{ objectFit: "contain", width: "80%", height: "80%" }}
            />
          </span>
        </span>
      ))}
    </div>
  );
}
