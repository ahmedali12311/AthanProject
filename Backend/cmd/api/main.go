package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"project/internal/data"

	"firebase.google.com/go/v4/messaging"
	"github.com/jmoiron/sqlx"
	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
	"github.com/robfig/cron/v3"
	"google.golang.org/api/option"
)

type config struct {
	port int
	env  string
	db   struct {
		dsn          string
		maxOpenConns int
		maxIdleConns int
		maxIdleTime  string
	}
	fcmCredentials string
}

type application struct {
	cfg     config
	log     *log.Logger
	Model   data.Model
	infoLog *log.Logger
	cron    *cron.Cron
	fcm     *messaging.Client
}

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	DATABASE_URL := os.Getenv("DATABASE_URL")
	FCM_CREDENTIALS := os.Getenv("FCM_CREDENTIALS")

	var cfg config
	flag.IntVar(&cfg.port, "Port", 8080, "Port of the server")
	flag.StringVar(&cfg.env, "Environment", "Development", "Development environment of the server")
	flag.StringVar(&cfg.db.dsn, "db-dsn", DATABASE_URL, "PostgreSQL DSN")
	flag.IntVar(&cfg.db.maxOpenConns, "db-max-open-conns", 25, "PostgreSQL max open connections")
	flag.IntVar(&cfg.db.maxIdleConns, "db-max-idle-conns", 25, "PostgreSQL max idle connections")
	flag.StringVar(&cfg.db.maxIdleTime, "db-max-idle-time", "15m", "PostgreSQL max connection idle time")
	flag.StringVar(&cfg.fcmCredentials, "fcm-credentials", FCM_CREDENTIALS, "Firebase credentials JSON path")
	flag.Parse()

	infoLog := log.New(os.Stdout, "INFO\t", log.Ldate|log.Ltime)
	logger := log.New(os.Stdout, "", log.Ldate|log.Ltime)

	db, err := openDB(&cfg)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Initialize Firebase
	ctx := context.Background()
	fbApp, err := firebase.NewApp(ctx, nil, option.WithCredentialsFile(cfg.fcmCredentials))
	if err != nil {
		logger.Fatalf("Failed to initialize Firebase: %v", err)
	}
	fcmClient, err := fbApp.Messaging(ctx)
	if err != nil {
		logger.Fatalf("Failed to initialize FCM: %v", err)
	}

	// Initialize cron
	cronScheduler := cron.New()

	model := data.NewModels(db)
	app := application{
		cfg:     cfg,
		log:     logger,
		Model:   model,
		infoLog: infoLog,
		cron:    cronScheduler,
		fcm:     fcmClient,
	}

	// Schedule prayer time checks
	_, err = cronScheduler.AddFunc("* * * * *", func() { // Every minute
		app.checkPrayerTimes(ctx)
	})
	if err != nil {
		logger.Fatalf("Failed to schedule cron job: %v", err)
	}
	cronScheduler.Start()

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.port),
		Handler:      app.Router(),
		IdleTimeout:  2 * time.Minute,
		ReadTimeout:  2 * time.Minute,
		WriteTimeout: 5 * time.Minute,
	}
	shutdownCh := make(chan os.Signal, 1)
	signal.Notify(shutdownCh, os.Interrupt, syscall.SIGTERM)

	done := make(chan bool, 1)

	go func() {
		sig := <-shutdownCh
		log.Printf("Received signal: %v. Initiating graceful shutdown.", sig)

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			log.Printf("Error during shutdown: %v", err)
		} else {
			log.Println("Server shutdown completed.")
		}
		app.cleanup()

		done <- true
	}()

	log.Printf("Starting %s server on %s", cfg.env, srv.Addr)
	err = srv.ListenAndServe()
	if err != http.ErrServerClosed {
		logger.Fatalf("Server error: %v", err)
	}
	<-done
	log.Println("Application stopped.")
}

func openDB(cfg *config) (*sqlx.DB, error) {
	connStr := cfg.db.dsn
	connStr += "&TimeZone=Africa/Tripoli"

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	db, err := sqlx.ConnectContext(ctx, "postgres", connStr)
	if err != nil {
		return nil, err
	}

	dur, err := time.ParseDuration(cfg.db.maxIdleTime)
	if err != nil {
		return nil, err
	}

	db.SetConnMaxIdleTime(dur)
	db.SetMaxIdleConns(cfg.db.maxIdleConns)
	db.SetMaxOpenConns(cfg.db.maxOpenConns)

	return db, nil
}

func (app *application) cleanup() {
	app.cron.Stop()
	log.Println("Performing cleanup tasks...")
}
