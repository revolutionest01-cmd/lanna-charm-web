import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Predefined amenities with Thai and English labels + emoji
const PREDEFINED_AMENITIES = [
  { id: "wifi", th: "WiFi", en: "WiFi", icon: "📶" },
  { id: "aircon", th: "แอร์", en: "Air Conditioning", icon: "❄️" },
  { id: "tv", th: "ทีวี", en: "TV", icon: "📺" },
  { id: "fridge", th: "ตู้เย็น", en: "Refrigerator", icon: "🧊" },
  { id: "bathroom", th: "ห้องน้ำส่วนตัว", en: "Private Bathroom", icon: "🚿" },
  { id: "towel", th: "ผ้าเช็ดตัว", en: "Towel", icon: "🛁" },
  { id: "water", th: "น้ำดื่ม", en: "Drinking Water", icon: "💧" },
  { id: "parking", th: "ที่จอดรถ", en: "Parking", icon: "🅿️" },
  { id: "fan", th: "พัดลม", en: "Fan", icon: "🌀" },
  { id: "projector", th: "โปรเจคเตอร์", en: "Projector", icon: "📽️" },
  { id: "whiteboard", th: "กระดานขาว", en: "Whiteboard", icon: "📋" },
  { id: "karaoke", th: "คาราโอเกะ", en: "Karaoke", icon: "🎤" },
  { id: "speaker", th: "ลำโพง", en: "Speaker", icon: "🔊" },
  { id: "breakfast", th: "อาหารเช้า", en: "Breakfast", icon: "🍳" },
  { id: "bed", th: "เตียง", en: "Bed", icon: "🛏️" },
  { id: "sofa", th: "โซฟา", en: "Sofa", icon: "🪑" },
  { id: "key", th: "กุญแจ", en: "Key Card", icon: "🔑" },
] as const;

interface AmenitiesCheckboxGroupProps {
  valueTh: string;
  valueEn: string;
  onChangeTh: (value: string) => void;
  onChangeEn: (value: string) => void;
  disabled?: boolean;
  language?: string;
}

export const AmenitiesCheckboxGroup = ({
  valueTh,
  valueEn,
  onChangeTh,
  onChangeEn,
  disabled = false,
  language = "th",
}: AmenitiesCheckboxGroupProps) => {
  const [customTh, setCustomTh] = useState("");
  const [customEn, setCustomEn] = useState("");

  // Parse current values into sets for checking
  const parseToSet = (str: string) =>
    new Set(
      str
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    );

  const selectedTh = parseToSet(valueTh);
  const selectedEn = parseToSet(valueEn);

  // Check if a predefined amenity is selected (match by Thai label)
  const isChecked = (amenity: (typeof PREDEFINED_AMENITIES)[number]) =>
    selectedTh.has(amenity.th);

  const handleToggle = (amenity: (typeof PREDEFINED_AMENITIES)[number], checked: boolean) => {
    const newTh = new Set(selectedTh);
    const newEn = new Set(selectedEn);

    if (checked) {
      newTh.add(amenity.th);
      newEn.add(amenity.en);
    } else {
      newTh.delete(amenity.th);
      newEn.delete(amenity.en);
    }

    onChangeTh(Array.from(newTh).join(", "));
    onChangeEn(Array.from(newEn).join(", "));
  };

  const handleAddCustom = () => {
    if (!customTh.trim()) return;

    const newTh = new Set(selectedTh);
    const newEn = new Set(selectedEn);
    newTh.add(customTh.trim());
    newEn.add(customEn.trim() || customTh.trim());

    onChangeTh(Array.from(newTh).join(", "));
    onChangeEn(Array.from(newEn).join(", "));
    setCustomTh("");
    setCustomEn("");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PREDEFINED_AMENITIES.map((amenity) => (
          <label
            key={amenity.id}
            className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all
              ${
                isChecked(amenity)
                  ? "bg-primary/10 border-primary/40"
                  : "bg-background border-border hover:border-primary/30"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            <Checkbox
              checked={isChecked(amenity)}
              onCheckedChange={(checked) => handleToggle(amenity, !!checked)}
              disabled={disabled}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <span className="text-sm">
              {amenity.icon} {language === "th" ? amenity.th : amenity.en}
            </span>
          </label>
        ))}
      </div>

      {/* Custom amenity input */}
      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">
            {language === "th" ? "เพิ่มรายการเอง (ไทย)" : "Add custom (Thai)"}
          </label>
          <Input
            value={customTh}
            onChange={(e) => setCustomTh(e.target.value)}
            placeholder={language === "th" ? "เช่น สระว่ายน้ำ" : "e.g. สระว่ายน้ำ"}
            className="bg-white text-foreground h-9"
            disabled={disabled}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustom())}
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">
            {language === "th" ? "เพิ่มรายการเอง (อังกฤษ)" : "Add custom (English)"}
          </label>
          <Input
            value={customEn}
            onChange={(e) => setCustomEn(e.target.value)}
            placeholder={language === "th" ? "e.g. Swimming Pool" : "e.g. Swimming Pool"}
            className="bg-white text-foreground h-9"
            disabled={disabled}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddCustom())}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddCustom}
          disabled={disabled || !customTh.trim()}
          className="h-9 px-3"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Show current selected items summary */}
      {valueTh && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-md p-2">
          <span className="font-medium">{language === "th" ? "รายการที่เลือก:" : "Selected:"}</span>{" "}
          {valueTh}
        </div>
      )}
    </div>
  );
};
