package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

const (
	uploadDir = "./data"           // katalog na pliki
	secret    = "token" // zmień na swój
)

// Middleware do autoryzacji
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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
	fmt.Fprintf(w, `["%s"]`, strings.Join(result, `","`))
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

func main() {
	os.MkdirAll(uploadDir, 0755)

	http.HandleFunc("/files", authMiddleware(listFiles))
	http.HandleFunc("/upload", authMiddleware(uploadFile))
	http.HandleFunc("/download/", authMiddleware(downloadFile))
	http.HandleFunc("/files/", authMiddleware(deleteFile))

	fmt.Println("Server running at http://0.0.0.0:8080")
	http.ListenAndServe(":8080", nil)
}
