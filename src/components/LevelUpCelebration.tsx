import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RANK_TIERS, RANK_PERKS, getUnlockedPerks } from "@/lib/pointSystem";
import { X, Trophy, Sparkles, Gift } from "lucide-react";

interface LevelUpCelebrationProps {
  isOpen: boolean;
  fromRankId: number;
  toRankId: number;
  onClose: () => void;
  language: string;
}

const LevelUpCelebration = ({
  isOpen,
  fromRankId,
  toRankId,
  onClose,
  language,
}: LevelUpCelebrationProps) => {
  const [playSound, setPlaySound] = useState(true);
  const toRank = RANK_TIERS.find((r) => r.id === toRankId) || RANK_TIERS[0];
  const unlockedPerks = getUnlockedPerks(toRankId);
  const newPerks = getUnlockedPerks(toRankId).filter(
    (perk) => !getUnlockedPerks(fromRankId).includes(perk)
  );

  useEffect(() => {
    if (isOpen && playSound) {
      // เล่นเสียงฉลอง (สามารถปรับตามต้องการ)
      const audio = new Audio(
        "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA=="
      );
      audio.play().catch(() => {
        // Silently ignore if audio fails to play
      });
    }
  }, [isOpen, playSound]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Background Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Celebration Content */}
          <motion.div
            className="relative pointer-events-auto"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              duration: 0.4,
            }}
          >
            <Card className={`border-4 ${toRank.borderColor} shadow-2xl max-w-md w-full mx-4 bg-gradient-to-br ${toRank.color} overflow-hidden`}>
              {/* Confetti Animation Container */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full pointer-events-none"
                    style={{
                      background: [
                        "#fbbf24",
                        "#f59e0b",
                        "#ec4899",
                        "#8b5cf6",
                        "#3b82f6",
                      ][i % 5],
                    }}
                    initial={{
                      x: window.innerWidth / 2,
                      y: window.innerHeight / 2,
                      opacity: 1,
                    }}
                    animate={{
                      x: window.innerWidth / 2 + (Math.random() - 0.5) * 400,
                      y: window.innerHeight / 2 + (Math.random() - 0.5) * 400,
                      opacity: 0,
                      rotate: Math.random() * 360,
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.05,
                      ease: "easeOut",
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10 p-8 text-center space-y-6">
                {/* Trophy Icon Animation */}
                <motion.div
                  className="flex justify-center"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Trophy className="h-16 w-16 text-yellow-500" />
                </motion.div>

                {/* Congratulations Text */}
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold font-serif">
                    {language === "th" ? "ยินดีด้วย! 🎉" : "Congratulations! 🎉"}
                  </h2>
                  <p className="text-xl font-semibold">
                    {language === "th" ? "คุณได้เลื่อนขั้นเป็น" : "You've been promoted to"}
                  </p>
                </div>

                {/* New Rank Display */}
                <motion.div
                  className={`p-4 rounded-lg bg-white/10 border-2 ${toRank.borderColor} backdrop-blur-sm`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, delay: 0.2, repeat: Infinity }}
                >
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-5xl">{toRank.icon}</span>
                    <div className="text-left">
                      <p className="text-2xl font-bold">{toRank.name}</p>
                      <p className="text-sm text-muted-foreground">{toRank.nameEn}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Rank Description */}
                <p className="text-sm text-muted-foreground">
                  {language === "th" ? toRank.description : toRank.descriptionEn}
                </p>

                {/* New Perks Section */}
                {newPerks.length > 0 && (
                  <motion.div
                    className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center gap-2 justify-center font-semibold">
                      <Gift className="h-5 w-5" />
                      {language === "th" ? "สิทธิพิเศษใหม่ที่ปลดล็อก" : "New Perks Unlocked"}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {newPerks.map((permissionKey) => {
                        const perk = RANK_PERKS[permissionKey as keyof typeof RANK_PERKS];
                        if (!perk) return null;

                        return (
                          <motion.div
                            key={permissionKey}
                            className="p-2 rounded bg-white/10 border border-white/20 hover:bg-white/20 transition-colors"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 }}
                          >
                            <div className="text-2xl mb-1">{perk.icon}</div>
                            <p className="text-xs font-medium line-clamp-2">{perk.name}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* All Perks Counter */}
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {language === "th" ? "สิทธิพิเศษทั้งหมด" : "Total Perks"}
                  </p>
                  <div className="flex justify-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      {unlockedPerks.length} {language === "th" ? "รายการ" : "items"}
                    </Badge>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4 justify-center">
                  <Button
                    onClick={onClose}
                    variant="default"
                    className="gap-2"
                  >
                    {language === "th" ? "เข้าใจแล้ว!" : "Got it!"}{" "}
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>

                {/* Close Button */}
                <motion.button
                  onClick={onClose}
                  className="absolute top-2 right-2 p-2 hover:bg-white/10 rounded-full transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpCelebration;
