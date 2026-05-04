"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Share2, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ReferralData {
  code: string;
  referralCount: number;
  rewardPerReferral: number;
  shareUrl: string;
}

export function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);
  const [applyCode, setApplyCode] = useState("");
  const [applyStatus, setApplyStatus] = useState<string | null>(null);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  const copyCode = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = data.shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const share = async () => {
    if (!data) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on AIAH",
          text: `Use my code ${data.code} to get ${data.rewardPerReferral} free coins on AIAH!`,
          url: data.shareUrl,
        });
      } catch {
        copyCode();
      }
    } else {
      copyCode();
    }
  };

  const handleApply = async () => {
    if (!applyCode.trim()) return;
    setApplyStatus(null);
    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: applyCode.trim() }),
      });
      const result = await res.json();
      if (res.ok) {
        setApplyStatus(result.message);
        setApplyCode("");
      } else {
        setApplyStatus(result.error || "Failed");
      }
    } catch {
      setApplyStatus("Network error");
    }
  };

  if (!data) {
    return (
      <div className="h-32 animate-pulse rounded-xl bg-stone-200/50 dark:bg-stone-800/30" />
    );
  }

  return (
    <div className="space-y-4">
      {/* Your referral code */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200/50 dark:border-emerald-800/30">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="h-4 w-4 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            Invite friends, earn coins
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 bg-white dark:bg-stone-800 rounded-lg px-3 py-2 font-mono text-sm font-bold text-center tracking-wider">
            {data.code}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyCode}
            className="h-9 rounded-lg"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="sm"
            onClick={share}
            className="h-9 rounded-lg"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {data.referralCount} friend{data.referralCount !== 1 ? "s" : ""} joined
          </div>
          <span>{data.rewardPerReferral} coins per invite</span>
        </div>
      </div>

      {/* Apply a code */}
      <button
        onClick={() => setShowApply(!showApply)}
        className="text-xs text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 underline"
      >
        Have a friend&apos;s code?
      </button>

      {showApply && (
        <div className="flex gap-2">
          <Input
            value={applyCode}
            onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
            placeholder="Enter code..."
            className="text-xs h-8 rounded-lg font-mono uppercase"
            maxLength={10}
            onKeyDown={(e) => e.key === "Enter" && handleApply()}
          />
          <Button size="sm" onClick={handleApply} className="h-8 rounded-lg text-xs">
            Apply
          </Button>
        </div>
      )}

      {applyStatus && (
        <p className={`text-xs ${applyStatus.includes("coins") ? "text-emerald-500" : "text-rose-500"}`}>
          {applyStatus}
        </p>
      )}
    </div>
  );
}
