import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { logoutAtom } from "@/store/auth";
import { CheckCircle, LogOut } from "lucide-react";

export function Dashboard() {
  const [, logout] = useAtom(logoutAtom);

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center space-x-2">
          <CheckCircle className="h-6 w-6 text-green-500" />
          <CardTitle className="text-2xl font-bold text-green-600">Authenticated</CardTitle>
        </div>
        <CardDescription>You have successfully authenticated to the application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Access Granted
          </Badge>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Welcome to the secure area of the application
        </div>

        <Button onClick={() => logout()} variant="outline" className="w-full">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </CardContent>
    </Card>
  );
}
