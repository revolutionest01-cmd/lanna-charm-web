import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, DollarSign, Image as ImageIcon, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomStatsProps {
  stats: {
    totalRooms: number;
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    totalImages: number;
  };
  language?: string;
}

export const RoomStats = ({ stats, language = "th" }: RoomStatsProps) => {
  const statCards = [
    {
      icon: Home,
      label:
        language === "th"
          ? "ห้องพักทั้งหมด"
          : "Total Rooms",
      value: stats.totalRooms.toString(),
      color: "blue",
    },
    {
      icon: DollarSign,
      label:
        language === "th"
          ? "ราคาเฉลี่ย"
          : "Average Price",
      value: `฿${stats.averagePrice.toLocaleString()}`,
      color: "green",
    },
    {
      icon: BarChart3,
      label:
        language === "th"
          ? "ช่วงราคา"
          : "Price Range",
      value: `฿${stats.minPrice.toLocaleString()} - ฿${stats.maxPrice.toLocaleString()}`,
      color: "purple",
    },
    {
      icon: ImageIcon,
      label:
        language === "th"
          ? "รูปภาพทั้งหมด"
          : "Total Images",
      value: stats.totalImages.toString(),
      color: "orange",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 border-blue-200",
    green: "bg-green-500/10 text-green-600 border-green-200",
    purple: "bg-purple-500/10 text-purple-600 border-purple-200",
    orange: "bg-orange-500/10 text-orange-600 border-orange-200",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, idx) => {
        const Icon = card.icon;
        const colorClass = colorClasses[card.color as keyof typeof colorClasses];

        return (
          <Card key={idx} className="border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-foreground">
                  {card.label}
                </CardTitle>
                <div
                  className={cn(
                    "p-2 rounded-lg border",
                    colorClass
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {card.value}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RoomStats;
