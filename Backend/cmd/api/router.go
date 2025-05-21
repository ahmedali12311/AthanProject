package main

import (
	"net/http"
	"time"

	"github.com/go-michi/michi"
)

func (app *application) Router() *michi.Router {
	r := michi.NewRouter()
	r.Use(app.logRequest)
	r.Use(app.recoverPanic)
	r.Use(secureHeaders)
	r.Use(app.ErrorHandlerMiddleware)
	rateLimiter := NewRateLimiter(RateLimiterConfig{
		Skipper: func(r *http.Request) bool {
			return false
		},
		Rate:      600,
		Burst:     100,
		ExpiresIn: 1 * time.Minute,
		IdentifierExtractor: func(r *http.Request) (string, error) {
			return r.RemoteAddr, nil
		},
		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			http.Error(w, http.StatusText(http.StatusForbidden), http.StatusForbidden)
		},
		DenyHandler: func(w http.ResponseWriter, r *http.Request, identifier string, err error) {
			http.Error(w, http.StatusText(http.StatusTooManyRequests), http.StatusTooManyRequests)
		},
	})

	r.Use(rateLimiter.Limit)

	// Serve static files from web/static
	r.Handle("/static/", http.StripPrefix("/static/", http.FileServer(http.Dir("web/static"))))
	// Serve Firebase service worker
	r.Handle("/firebase-messaging-sw.js", http.FileServer(http.Dir("web")))
	// Serve uploads
	r.Handle("/Uploads/", http.StripPrefix("/Uploads/", http.FileServer(http.Dir("Uploads"))))

	r.Route("/", func(sub *michi.Router) {
		// Serve index.html for the root path
		sub.HandleFunc("GET ", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.ServeFile(w, r, "web/index.html")
		}))

		// User endpoints
		sub.HandleFunc("GET users", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.ListUsersHandler))))
		sub.HandleFunc("GET users/{id}", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.GetUserHandler))))
		sub.HandleFunc("POST login", http.HandlerFunc(app.SigninHandler))
		sub.HandleFunc("POST signup", app.PassTokenMiddleware(app.SignupHandler))
		sub.HandleFunc("PUT user/{id}", app.AuthMiddleware(http.HandlerFunc(app.UpdateUserHandler)))
		sub.HandleFunc("PUT me", app.AuthMiddleware(http.HandlerFunc(app.UpdateUserHandler)))
		sub.HandleFunc("DELETE roles/revoke", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.RevokeRoleHandler))))
		sub.HandleFunc("GET roles/{id}", app.GetUserRolesHandler)
		sub.HandleFunc("GET me", app.AuthMiddleware(http.HandlerFunc(app.MeHandler)))

		// PrayerTimes endpoints
		sub.HandleFunc("GET prayer-times", (app.GetPrayerTimesHandler))                                                                    // Public access
		sub.HandleFunc("GET prayer-times/list", http.HandlerFunc(app.ListPrayerTimesHandler))                                              // Public access
		sub.HandleFunc("GET prayer-times/search", http.HandlerFunc(app.SearchPrayerTimesHandler))                                          // Public access
		sub.HandleFunc("POST prayer-times", http.HandlerFunc(app.CreatePrayerTimesHandler))                                                // Admin only
		sub.HandleFunc("PUT prayer-times", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.UpdatePrayerTimesHandler))))    // Admin only
		sub.HandleFunc("DELETE prayer-times", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.DeletePrayerTimesHandler)))) // Admin only

		// Sections endpoints
		sub.HandleFunc("GET sections", http.HandlerFunc(app.GetSectionHandler))                                                    // Public access
		sub.HandleFunc("GET sections/list", http.HandlerFunc(app.ListSectionsHandler))                                             // Public access
		sub.HandleFunc("POST sections", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.CreateSectionHandler))))   // Admin only
		sub.HandleFunc("PUT sections", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.UpdateSectionHandler))))    // Admin only
		sub.HandleFunc("DELETE sections", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.DeleteSectionHandler)))) // Admin only

		// Hadiths endpoints
		sub.HandleFunc("GET hadiths", http.HandlerFunc(app.GetHadithHandler))                                                    // Public access
		sub.HandleFunc("GET hadiths/list", http.HandlerFunc(app.ListHadithsHandler))                                             // Public access
		sub.HandleFunc("GET hadiths/topic", http.HandlerFunc(app.GetHadithsByTopicHandler))                                      // Public access
		sub.HandleFunc("POST hadiths", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.CreateHadithHandler))))   // Admin only
		sub.HandleFunc("PUT hadiths", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.UpdateHadithHandler))))    // Admin only
		sub.HandleFunc("DELETE hadiths", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.DeleteHadithHandler)))) // Admin only

		// Adhkar endpoints
		sub.HandleFunc("GET adhkar", http.HandlerFunc(app.GetAdhkarHandler))                                                    // Public access
		sub.HandleFunc("GET adhkar/list", http.HandlerFunc(app.ListAdhkarHandler))                                              // Public access
		sub.HandleFunc("GET adhkar/category", http.HandlerFunc(app.GetAdhkarByCategoryIDHandler))                               // Public access
		sub.HandleFunc("POST adhkar", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.CreateAdhkarHandler))))   // Admin only
		sub.HandleFunc("PUT adhkar", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.UpdateAdhkarHandler))))    // Admin only
		sub.HandleFunc("DELETE adhkar", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.DeleteAdhkarHandler)))) // Admin only

		// Adhkar Categories endpoints
		sub.HandleFunc("GET adhkar-categories", http.HandlerFunc(app.GetAdhkarCategoryHandler))                                                    // Public access
		sub.HandleFunc("GET adhkar-categories/list", http.HandlerFunc(app.ListAdhkarCategoriesHandler))                                            // Public access
		sub.HandleFunc("POST adhkar-categories", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.CreateAdhkarCategoryHandler))))   // Admin only
		sub.HandleFunc("PUT adhkar-categories", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.UpdateAdhkarCategoryHandler))))    // Admin only
		sub.HandleFunc("DELETE adhkar-categories", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.DeleteAdhkarCategoryHandler)))) // Admin only

		// Special Topics endpoints
		sub.HandleFunc("GET special-topics", http.HandlerFunc(app.GetSpecialTopicANUARYHandler))                                              // Public access
		sub.HandleFunc("GET special-topics/list", http.HandlerFunc(app.ListSpecialTopicsHandler))                                             // Public access
		sub.HandleFunc("GET special-topics/topic", http.HandlerFunc(app.GetSpecialTopicsByTopicHandler))                                      // Public access
		sub.HandleFunc("POST special-topics", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.CreateSpecialTopicHandler))))   // Admin only
		sub.HandleFunc("PUT special-topics", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.UpdateSpecialTopicHandler))))    // Admin only
		sub.HandleFunc("DELETE special-topics", app.AuthMiddleware(app.AdminOnlyMiddleware(http.HandlerFunc(app.DeleteSpecialTopicHandler)))) // Admin only

		sub.HandleFunc("POST subscribe", http.HandlerFunc(app.SubscribeToNotificationsHandler))
	})

	return r
}
