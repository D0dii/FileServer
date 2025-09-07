import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { listFiles, uploadFile, deleteFile, downloadFile } from "@/api/files";
import { Upload, Download, Trash2, File, Loader2 } from "lucide-react";

export function FileManager() {
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Query to fetch files
  const {
    data: files,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["files"],
    queryFn: listFiles,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadFile,
    onSuccess: (data) => {
      setUploadSuccess(data);
      setUploadError("");
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["disk-usage"] });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error) => {
      setUploadError(error.message);
      setUploadSuccess("");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      queryClient.invalidateQueries({ queryKey: ["disk-usage"] });
    },
    onError: (error) => {
      console.error("Delete failed:", error);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleDelete = (filename: string) => {
    if (confirm(`Are you sure you want to delete ${filename}?`)) {
      deleteMutation.mutate(filename);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const blob = await downloadFile(filename);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading files...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl">
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertDescription>Failed to load files: {error.message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-5 w-5" />
          File Manager
        </CardTitle>
        <CardDescription>Upload, download, and manage your files</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              disabled={uploadMutation.isPending}
              className="flex-1"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
              className="shrink-0"
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload
            </Button>
          </div>

          {uploadError && (
            <Alert variant="destructive">
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          {uploadSuccess && (
            <Alert>
              <AlertDescription className="text-green-600">{uploadSuccess}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Files List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Files</h3>
            <Badge variant="outline">{files?.length || 0} files</Badge>
          </div>

          {files && files.length > 0 ? (
            <div className="grid gap-2">
              {files.map((filename) => (
                <div
                  key={filename}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{filename}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownload(filename)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(filename)}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No files uploaded yet. Upload your first file to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
