import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: string;
  className?: string;
}

const ConfidenceBadge = ({ confidence, className }: ConfidenceBadgeProps) => {
  let color = "";
  
  switch (confidence.toLowerCase()) {
    case "high":
    case "high confidence":
      color = "bg-[#2C5282]/10 text-[#2C5282]";
      break;
    case "medium":
    case "medium confidence":
      color = "bg-[#ECC94B]/10 text-[#ECC94B]";
      break;
    case "low":
    case "low confidence":
      color = "bg-[#F56565]/10 text-[#F56565]";
      break;
    default:
      color = "bg-gray-100 text-gray-500";
      break;
  }

  return (
    <span className={cn("text-xs py-1 px-2 rounded-full", color, className)}>
      {confidence}
    </span>
  );
};

export default ConfidenceBadge;
