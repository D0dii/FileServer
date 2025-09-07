import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getDiskUsage } from "@/api/files";
import { HardDrive, Loader2 } from "lucide-react";

export function DiskUsage() {
  const {
    data: diskUsage,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["disk-usage"],
    queryFn: getDiskUsage,
    refetchInterval: parseInt(import.meta.env.VITE_DISK_USAGE_REFRESH_INTERVAL) || 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Loading disk usage...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-4">
          <Alert variant="destructive">
            <AlertDescription>Failed to load disk usage: {error.message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!diskUsage) return null;

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-600 bg-red-50 border-red-200";
    if (percentage >= 75) return "text-orange-600 bg-orange-50 border-orange-200";
    if (percentage >= 50) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <HardDrive className="h-5 w-5" />
          Disk Usage
        </CardTitle>
        <CardDescription>Server storage information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Usage</span>
          <Badge variant="outline" className={getUsageColor(diskUsage.usedPercentage)}>
            {diskUsage.usedPercentage.toFixed(1)}%
          </Badge>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              diskUsage.usedPercentage >= 90
                ? "bg-red-500"
                : diskUsage.usedPercentage >= 75
                ? "bg-orange-500"
                : diskUsage.usedPercentage >= 50
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            style={{ width: `${Math.min(diskUsage.usedPercentage, 100)}%` }}
          ></div>
        </div>

        {/* Storage details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Used</p>
            <p className="font-medium">{diskUsage.usedGB.toFixed(2)} GB</p>
          </div>
          <div>
            <p className="text-muted-foreground">Free</p>
            <p className="font-medium">{diskUsage.freeGB.toFixed(2)} GB</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Total</p>
            <p className="font-medium">{diskUsage.totalGB.toFixed(2)} GB</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
