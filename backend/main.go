package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"syscall"
)

const (
	uploadDir = "./data"           // katalog na pliki
	secret    = "password" // zmień na swój
)

// Middleware do autoryzacji
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Add CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		
		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token != secret {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}
		next(w, r)
	}
}

// Lista plików
func listFiles(w http.ResponseWriter, r *http.Request) {
	files, err := os.ReadDir(uploadDir)
	if err != nil {
		http.Error(w, "Cannot list files", http.StatusInternalServerError)
		return
	}
	var result []string
	for _, f := range files {
		result = append(result, f.Name())
	}
	w.Header().Set("Content-Type", "application/json")
	
	if len(result) == 0 {
		fmt.Fprint(w, "[]")
	} else {
		fmt.Fprintf(w, `["%s"]`, strings.Join(result, `","`))
	}
}

// Upload
func uploadFile(w http.ResponseWriter, r *http.Request) {
	r.ParseMultipartForm(10 << 20) // max 10MB
	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "Invalid upload", http.StatusBadRequest)
		return
	}
	defer file.Close()

	dst, err := os.Create(filepath.Join(uploadDir, handler.Filename))
	if err != nil {
		http.Error(w, "Cannot save file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()
	io.Copy(dst, file)

	fmt.Fprintf(w, "Uploaded %s\n", handler.Filename)
}

// Pobieranie
func downloadFile(w http.ResponseWriter, r *http.Request) {
	filename := strings.TrimPrefix(r.URL.Path, "/download/")
	http.ServeFile(w, r, filepath.Join(uploadDir, filename))
}

// Usuwanie
func deleteFile(w http.ResponseWriter, r *http.Request) {
	filename := strings.TrimPrefix(r.URL.Path, "/files/")
	err := os.Remove(filepath.Join(uploadDir, filename))
	if err != nil {
		http.Error(w, "Cannot delete file", http.StatusInternalServerError)
		return
	}
	fmt.Fprintf(w, "Deleted %s\n", filename)
}

// Disk usage info
type DiskUsage struct {
	TotalBytes     uint64  `json:"totalBytes"`
	FreeBytes      uint64  `json:"freeBytes"`
	UsedBytes      uint64  `json:"usedBytes"`
	TotalGB        float64 `json:"totalGB"`
	FreeGB         float64 `json:"freeGB"`
	UsedGB         float64 `json:"usedGB"`
	UsedPercentage float64 `json:"usedPercentage"`
}

func getDiskUsage(w http.ResponseWriter, r *http.Request) {
	var stat syscall.Statfs_t
	err := syscall.Statfs(".", &stat)
	if err != nil {
		http.Error(w, "Cannot get disk usage", http.StatusInternalServerError)
		return
	}

	// Calculate disk usage
	totalBytes := stat.Blocks * uint64(stat.Bsize)
	freeBytes := stat.Bavail * uint64(stat.Bsize)
	usedBytes := totalBytes - freeBytes

	diskUsage := DiskUsage{
		TotalBytes:     totalBytes,
		FreeBytes:      freeBytes,
		UsedBytes:      usedBytes,
		TotalGB:        float64(totalBytes) / (1024 * 1024 * 1024),
		FreeGB:         float64(freeBytes) / (1024 * 1024 * 1024),
		UsedGB:         float64(usedBytes) / (1024 * 1024 * 1024),
		UsedPercentage: float64(usedBytes) / float64(totalBytes) * 100,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(diskUsage)
}

func main() {
	os.MkdirAll(uploadDir, 0755)

	http.HandleFunc("/files", authMiddleware(listFiles))
	http.HandleFunc("/upload", authMiddleware(uploadFile))
	http.HandleFunc("/download/", authMiddleware(downloadFile))
	http.HandleFunc("/files/", authMiddleware(deleteFile))
	http.HandleFunc("/disk-usage", authMiddleware(getDiskUsage))

	fmt.Println("Server running at http://0.0.0.0:8080")
	http.ListenAndServe(":8080", nil)
}
