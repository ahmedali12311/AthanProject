package main

import (
	"context"
	"fmt"
	"net/http"
	"project/utils"
	"strings"
	"sync"
	"time"

	"github.com/dgrijalva/jwt-go"
	"github.com/google/uuid"
)

type contextKey string

const UserIDKey contextKey = "userID"
const UserRoleKey contextKey = "userRole"

func (app *application) AuthMiddleware(next http.Handler) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Upgrade") == "websocket" {
			tokenString := r.URL.Query().Get("token")
			if tokenString == "" {
				app.jwtErrorResponse(w, r, utils.ErrMissingToken)
				return
			}
			token, err := utils.ValidateToken(tokenString)
			if err != nil {
				app.jwtErrorResponse(w, r, utils.ErrInvalidToken)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok || !token.Valid {
				app.jwtErrorResponse(w, r, utils.ErrInvalidClaims)
				return
			}

			userID, okID := claims["id"].(string)
			if !okID {
				app.jwtErrorResponse(w, r, utils.ErrInvalidClaims)
				return
			}
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			r = r.WithContext(ctx)
		} else {
			var tokenString string
			cookie, err := r.Cookie("accessToken")
			if err != nil {
				authHeader := r.Header.Get("Authorization")
				if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
					tokenString = strings.TrimPrefix(authHeader, "Bearer ")
				} else {
					app.jwtErrorResponse(w, r, utils.ErrMissingToken)
					return
				}
			} else {
				tokenString = cookie.Value
			}

			token, err := utils.ValidateToken(tokenString)
			if err != nil {
				app.jwtErrorResponse(w, r, utils.ErrInvalidToken)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok || !token.Valid {
				app.jwtErrorResponse(w, r, utils.ErrInvalidClaims)
				return
			}

			if exp, ok := claims["exp"].(float64); ok {
				expTime := time.Unix(int64(exp), 0)
				if expTime.Before(time.Now()) {
					app.jwtErrorResponse(w, r, utils.ErrExpiredToken)
					return
				}
			} else {
				app.jwtErrorResponse(w, r, utils.ErrInvalidClaims)
				return
			}

			userID, okID := claims["id"].(string)
			if !okID {
				app.jwtErrorResponse(w, r, utils.ErrInvalidClaims)
				return
			}

			var userRoles []string
			userRolesInterface, okRoles := claims["user_role"].([]interface{})

			if okRoles && len(userRolesInterface) > 0 {
				userRoles = make([]string, 0, len(userRolesInterface))
				for _, role := range userRolesInterface {
					if roleStr, ok := role.(string); ok && roleStr != "NULL" && roleStr != "" {
						userRoles = append(userRoles, roleStr)
					}
				}
			}
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			ctx = context.WithValue(ctx, UserRoleKey, userRoles)
			r = r.WithContext(ctx)
		}

		next.ServeHTTP(w, r)
	})
}

func secureHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Security-Policy", "default-src 'self'; style-src 'self' fonts.googleapis.com; font-src fonts.gstatic.com")
		w.Header().Set("Referrer-Policy", "origin-when-cross-origin")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "deny")
		w.Header().Set("X-XSS-Protection", "0")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		w.Header().Set("Access-Control-Max-Age", "86400")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (app *application) logRequest(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		app.infoLog.Printf("%s - %s %s %s", r.RemoteAddr, r.Proto, r.Method,
			r.URL.RequestURI())
		next.ServeHTTP(w, r)
	})
}
func (app *application) recoverPanic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				w.Header().Set("Connection", "close")
				app.serverErrorResponse(w, r, fmt.Errorf("%s", err))
			}
		}()
		next.ServeHTTP(w, r)
	})
}
func (app *application) AdminOnlyMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userRoles, ok := r.Context().Value(UserRoleKey).([]string)
		if !ok {
			app.unauthorizedResponse(w, r)
			return
		}

		isAdmin := false
		for _, role := range userRoles {
			if role == "admin" {
				isAdmin = true
				break
			}
			if role == "user" {
			}
		}
		fmt.Print("False")

		if !isAdmin {
			app.forbiddenResponse(w, r)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (app *application) AdminOrSelfMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userRoles, ok := r.Context().Value(UserRoleKey).([]string)
		if !ok {
			app.unauthorizedResponse(w, r)
			return
		}

		currentUserID := uuid.MustParse(r.Context().Value(UserIDKey).(string))

		vars := r.PathValue("id")
		requestedUserID, err := uuid.Parse(vars)
		if err != nil {
			app.badRequestResponse(w, r, err)
			return
		}

		isAdmin := false
		for _, role := range userRoles {
			if role == "admin" {
				isAdmin = true
				break
			}
		}

		if !isAdmin && currentUserID != requestedUserID {
			app.forbiddenResponse(w, r)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (app *application) PassTokenMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Try to get token from multiple sources
		var tokenString string

		// Check cookie
		cookie, err := r.Cookie("accessToken")
		if err == nil {
			tokenString = cookie.Value
		}

		// If no cookie, check Authorization header
		if tokenString == "" {
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
				tokenString = strings.TrimPrefix(authHeader, "Bearer ")
			}
		}

		// If no token found, proceed without context
		if tokenString == "" {
			next.ServeHTTP(w, r)
			return
		}

		// Validate the token
		token, err := utils.ValidateToken(tokenString)
		if err != nil {
			// Log the token validation error (optional)
			app.infoLog.Printf("Token validation error: %v", err)
			next.ServeHTTP(w, r)
			return
		}

		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || !token.Valid {
			next.ServeHTTP(w, r)
			return
		}

		// Safely extract user ID
		userID, ok := claims["id"].(string)
		if !ok {
			next.ServeHTTP(w, r)
			return
		}

		// Extract user roles with robust type checking
		var userRoles []string
		if rolesInterface, ok := claims["user_role"].([]interface{}); ok {
			userRoles = make([]string, 0, len(rolesInterface))
			for _, role := range rolesInterface {
				if roleStr, ok := role.(string); ok {
					// Additional filtering for valid roles
					if roleStr != "" && roleStr != "NULL" {
						userRoles = append(userRoles, roleStr)
					}
				}
			}
		} else if roleSingleInterface, ok := claims["user_role"].(string); ok {
			// Handle case where user_role might be a single string
			if roleSingleInterface != "" && roleSingleInterface != "NULL" {
				userRoles = []string{roleSingleInterface}
			}
		}

		// Create a new context with user ID and roles
		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		ctx = context.WithValue(ctx, UserRoleKey, userRoles)

		// Create a new request with the updated context
		r = r.WithContext(ctx)

		// Call the next handler
		next.ServeHTTP(w, r)
	}
}

type RateLimiterConfig struct {
	Skipper             func(r *http.Request) bool
	Rate                int
	Burst               int
	ExpiresIn           time.Duration
	IdentifierExtractor func(r *http.Request) (string, error)
	ErrorHandler        func(w http.ResponseWriter, r *http.Request, err error)
	DenyHandler         func(w http.ResponseWriter, r *http.Request, identifier string, err error)
}

type RateLimiter struct {
	config   RateLimiterConfig
	visitors map[string]*Visitor
	mu       sync.Mutex
}

type Visitor struct {
	lastRequest time.Time
	requests    int
}

func NewRateLimiter(config RateLimiterConfig) *RateLimiter {
	return &RateLimiter{
		config:   config,
		visitors: make(map[string]*Visitor),
	}
}

func (rl *RateLimiter) Limit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if rl.config.Skipper != nil && rl.config.Skipper(r) {
			next.ServeHTTP(w, r)
			return
		}

		identifier, err := rl.config.IdentifierExtractor(r)
		if err != nil {
			rl.config.ErrorHandler(w, r, err)
			return
		}

		rl.mu.Lock()
		visitor, exists := rl.visitors[identifier]
		if !exists {
			visitor = &Visitor{
				lastRequest: time.Now(),
				requests:    0,
			}
			rl.visitors[identifier] = visitor
		}
		rl.mu.Unlock()

		now := time.Now()
		if now.Sub(visitor.lastRequest) > rl.config.ExpiresIn {
			visitor.requests = 0
		}

		if visitor.requests < rl.config.Burst {
			visitor.requests++
			visitor.lastRequest = now
			next.ServeHTTP(w, r)
		} else {
			rl.config.DenyHandler(w, r, identifier, nil)
		}
	})
}
