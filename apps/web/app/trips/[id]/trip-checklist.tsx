"use client";

import { useState } from "react";
import { setChecklistTickAction } from "./actions";

const groups = [
  {
    title: "Things to do in December",
    sections: [
      {
        id: "money",
        title: "Money & insurance",
        detail: "Before the trip",
        items: [
          ["m-cash", "Buy 25,000 THB cash", "20,000 is the immigration minimum. Compare exchange rates before you buy."],
          ["m-ins", "Buy travel insurance", "Cover the full trip dates. Keep the policy PDF on your phone."],
        ],
      },
      {
        id: "entry",
        title: "Entry & phone",
        detail: "Sort before Dec 22",
        items: [
          ["e-tdac", "Thailand Digital Arrival Card (TDAC)", "Mandatory, one per person. Free at tdac.immigration.go.th. Submit within 72 hours before arrival, so Dec 20–22."],
          ["e-sim", "Mobile data: eSIM, Thai SIM, or Indian roaming pack", "Needed for Grab, maps, and messaging from the moment you land."],
          ["e-apps", "Apps: Grab, Bolt, InDrive (Phuket), Bangkok Metro, LINE, Google Translate (Thai), Splitkaro/Splitwise", "Download Google Maps offline areas for Bangkok, Chiang Mai, Phuket, and Krabi."],
          ["e-card", "Add a 0% forex markup card if you have one", ""],
          ["e-shots", "Screenshot every booking to the gallery", "Return flight and hotel bookings too. Insurance and ferries as well, not only an open app."],
          ["e-email", "Email confirmations to yourself", "Backup for patchy island signal."],
        ],
      },
    ],
  },
  {
    title: "Things to pack",
    sections: [
      {
        id: "docs",
        title: "Documents",
        detail: "Phone covers the rest",
        items: [
          ["d-passport", "Passport", "6+ months validity from Dec 22."],
          ["d-copy", "Passport photocopy — print", "Kept separate from the passport itself."],
        ],
      },
      {
        id: "bags",
        title: "Bags",
        detail: "Small bag travels, big bag waits at DMK until Jan 1",
        items: [
          ["b-big", "Big bag → AIRPORTELs storage at DMK", "Dropped Dec 25, collected Jan 1. Leave room for Chatuchak shopping."],
          ["b-sling", "Sling or small day bag", "Passport, cash, phone — stays on you."],
          ["b-dry", "Dry bag or ziplocs", "Ferries, longtails, boat days. Dry swimwear before packing on Jan 1."],
          ["b-pouch", "Waterproof phone pouch", "Longtails and ferries."],
          ["b-wet", "Wet bag: swimwear + quick-dry towel", "Boat and beach days, Dec 29 – Jan 1."],
        ],
      },
      {
        id: "clothes",
        title: "Clothes & shoes",
        detail: "Hot and humid, cooler evenings in Chiang Mai",
        items: [
          ["c-sun", "Cap/hat + sunglasses", "Boat and beach days, Dec 29 – Jan 1."],
          ["c-cover", "Long trousers + covered top", "Shoulders and knees covered for the Grand Palace (Dec 23) and Chiang Rai temples (Dec 26)."],
          ["c-flip", "Flip-flops / chappals", "Showers, beach, hotel."],
          ["c-night", "Jan 1 night-out outfit + closed shoes", "Tichuca dress code: closed shoes, no flip-flops, no sleeveless or sportswear."],
        ],
      },
      {
        id: "health",
        title: "Health",
        detail: "Keep in the cabin bag",
        items: [
          ["h-meds", "Basic meds", "ORS, anti-diarrhoeal, paracetamol. Motion-sickness tablets for ferries and the Chiang Rai drive."],
          ["h-sun", "Reef-safe sunscreen", "Needed Dec 29 – Jan 1. Regular sunscreen is banned in Thai marine parks."],
          ["h-toil", "Toothpaste + mosquito repellent", "100 ml or less of each in the cabin bag."],
        ],
      },
      {
        id: "kit",
        title: "Money & tech",
        detail: "Cash first, card as backup",
        items: [
          ["k-cash", "25,000 THB cash — in the sling", "Carry it. 20,000 is the immigration minimum."],
          ["k-notes", "Small notes for boats and markets", "Longtails and street stalls won't break a 1,000."],
          ["k-power", "Power bank", "Cabin bag only, never checked."],
          ["k-adapter", "International travel adapter", "Thai sockets are mostly types A, B, C, and O, 220V."],
        ],
      },
    ],
  },
  {
    title: "Good to know",
    sections: [
      {
        id: "know",
        title: "Before you go",
        detail: "For everyone",
        items: [
          ["g-vape", "Vapes and e-cigarettes are illegal in Thailand", "Including bringing them in. Leave them at home."],
          ["g-sos", "Save emergency contacts", "Tourist Police 1155. Indian Embassy Bangkok. Travel insurance helpline."],
        ],
      },
    ],
  },
] as const;

export function TripChecklist({
  tripId,
  initialDone,
}: {
  tripId: string;
  initialDone: string[];
}) {
  const [done, setDone] = useState<string[]>(initialDone);
  const [open, setOpen] = useState<string>("money");

  const total = groups.reduce((sum, group) => sum + group.sections.reduce((n, section) => n + section.items.length, 0), 0);

  async function toggle(id: string) {
    const checked = !done.includes(id);
    setDone((current) =>
      checked ? [...current, id] : current.filter((item) => item !== id),
    );
    try {
      await setChecklistTickAction(tripId, id, checked);
    } catch {
      setDone((current) =>
        checked ? current.filter((item) => item !== id) : [...current, id],
      );
    }
  }

  return (
    <div>
      <p className="text-sm text-stone-500">
        {done.length} of {total} done. Saved to your account for this trip.
      </p>
      {groups.map((group) => (
        <div key={group.title}>
          <h3 className="mt-8 text-xs font-semibold uppercase tracking-widest text-stone-500">
            {group.title}
          </h3>
          {group.sections.map((section) => {
            const finished = section.items.filter((item) => done.includes(item[0])).length;
            const expanded = open === section.id;
            return (
              <div key={section.id} className="border-b border-stone-200 dark:border-stone-800">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? "" : section.id)}
                  className="flex w-full items-baseline justify-between gap-3 py-3 text-left"
                >
                  <span className="text-sm font-medium">{section.title}</span>
                  <span className="text-xs text-stone-500">
                    {finished}/{section.items.length}
                  </span>
                </button>
                {expanded ? (
                  <div className="pb-3">
                    <p className="text-sm text-stone-500">{section.detail}</p>
                    <ul className="mt-2">
                      {section.items.map(([id, label, note]) => (
                        <li key={id}>
                          <label className="flex gap-3 py-2">
                            <input
                              type="checkbox"
                              checked={done.includes(id)}
                              onChange={() => toggle(id)}
                              className="mt-1"
                            />
                            <span>
                              <span className={`block text-sm ${done.includes(id) ? "text-stone-400 line-through" : ""}`}>
                                {label}
                              </span>
                              {note ? (
                                <span className="mt-0.5 block text-sm text-stone-500">{note}</span>
                              ) : null}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
