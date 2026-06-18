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
  { left: 6,  size: 64, dur: 20, delay: 0,  drift: 6,  plat: "aliexpress" },
  { left: 20, size: 54, dur: 24, delay: 3,  drift: -5, plat: "shein"      },
  { left: 34, size: 60, dur: 21, delay: 5,  drift: 8,  plat: "temu"       },
  { left: 50, size: 62, dur: 18, delay: 2,  drift: -7, plat: "ebay"       },
  { left: 65, size: 56, dur: 27, delay: 7,  drift: 5,  plat: "aliexpress" },
  { left: 80, size: 60, dur: 22, delay: 1,  drift: -6, plat: "shein"      },
  { left: 90, size: 52, dur: 25, delay: 9,  drift: 4,  plat: "temu"       },
  { left: 12, size: 58, dur: 23, delay: 11, drift: -4, plat: "ebay"       },
  { left: 42, size: 54, dur: 20, delay: 14, drift: 7,  plat: "aliexpress" },
  { left: 58, size: 52, dur: 26, delay: 4,  drift: -6, plat: "shein"      },
  { left: 72, size: 62, dur: 19, delay: 6,  drift: 5,  plat: "temu"       },
  { left: 85, size: 54, dur: 24, delay: 12, drift: -4, plat: "ebay"       },
  { left: 28, size: 60, dur: 22, delay: 8,  drift: 6,  plat: "shein"      },
  { left: 48, size: 52, dur: 28, delay: 15, drift: -5, plat: "aliexpress" },
  { left: 76, size: 58, dur: 21, delay: 10, drift: 4,  plat: "temu"       },
  { left: 3,  size: 54, dur: 25, delay: 13, drift: -7, plat: "ebay"       },
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
          <Image
            src={LOGO_SRC[item.plat]}
            alt={item.plat}
            width={item.size}
            height={item.size}
            style={{ objectFit: "contain", width: item.size, height: item.size, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }}
          />
        </span>
      ))}
    </div>
  );
}
