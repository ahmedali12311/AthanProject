package data

import (
	"database/sql"
	"errors"
	"fmt"
	"net/url"
	"time"

	"project/utils"

	"github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

// Errors specific to hadith operations
var (
	ErrHadithNotFound      = errors.New("الحديث غير موجود")
	ErrHadithAlreadyExists = errors.New("الحديث موجود بالفعل")
)

// Hadith represents a record in the hadiths table
type Hadith struct {
	ID        int       `db:"id" json:"id"`
	Text      string    `db:"text" json:"text"`
	Source    string    `db:"source" json:"source"`
	Topic     string    `db:"topic" json:"topic"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

// HadithDB handles database operations for the hadiths table
type HadithDB struct {
	db *sqlx.DB
}

// InsertHadith inserts a new hadith into the hadiths table
func (h *HadithDB) InsertHadith(hadith *Hadith) error {
	query, args, err := QB.Insert("hadiths").
		Columns("text", "source", "topic").
		Values(hadith.Text, hadith.Source, hadith.Topic).
		Suffix("RETURNING id, created_at, updated_at").
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = h.db.QueryRowx(query, args...).Scan(&hadith.ID, &hadith.CreatedAt, &hadith.UpdatedAt)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // PostgreSQL unique_violation error code
				return ErrHadithAlreadyExists
			}
		}
		return fmt.Errorf("خطأ في إضافة الحديث: %v", err)
	}

	return nil
}

// GetHadithByID retrieves a hadith by its ID
func (h *HadithDB) GetHadithByID(id int) (*Hadith, error) {
	var hadith Hadith
	query, args, err := QB.Select("id", "text", "source", "topic", "created_at", "updated_at").
		From("hadiths").
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = h.db.Get(&hadith, query, args...)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrHadithNotFound
		}
		return nil, fmt.Errorf("خطأ في جلب بيانات الحديث: %v", err)
	}

	return &hadith, nil
}

// UpdateHadith updates an existing hadith
func (h *HadithDB) UpdateHadith(hadith *Hadith) error {
	query, args, err := QB.Update("hadiths").
		Set("text", hadith.Text).
		Set("source", hadith.Source).
		Set("topic", hadith.Topic).
		Set("updated_at", time.Now()).
		Where(squirrel.Eq{"id": hadith.ID}).
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	result, err := h.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("خطأ في تحديث الحديث: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من الصفوف المتأثرة: %v", err)
	}
	if rowsAffected == 0 {
		return ErrHadithNotFound
	}

	return nil
}

// DeleteHadith deletes a hadith by its ID
func (h *HadithDB) DeleteHadith(id int) error {
	query, args, err := QB.Delete("hadiths").
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء استعلام الحذف: %v", err)
	}

	result, err := h.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("خطأ في حذف الحديث: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من الصفوف المتأثرة: %v", err)
	}
	if rowsAffected == 0 {
		return ErrHadithNotFound
	}

	return nil
}

// ListHadiths lists all hadiths with pagination and filtering
func (h *HadithDB) ListHadiths(queryParams url.Values) ([]Hadith, *utils.Meta, error) {
	var hadiths []Hadith

	// Columns to select from the hadiths table
	columns := []string{"id", "text", "source", "topic", "created_at", "updated_at"}

	// Columns available for searching
	searchCols := []string{"text", "source", "topic"}

	// Build the query using a utility function
	meta, err := utils.BuildQuery(
		&hadiths,
		"hadiths",
		nil, // No joins needed
		columns,
		searchCols,
		queryParams,
		nil, // No additional filters
	)
	if err != nil {
		return nil, nil, fmt.Errorf("خطأ في جلب قائمة الأحاديث: %v", err)
	}

	return hadiths, meta, nil
}

// GetHadithsByTopic retrieves hadiths filtered by topic
func (h *HadithDB) GetHadithsByTopic(topic string, queryParams url.Values) ([]Hadith, *utils.Meta, error) {
	var hadiths []Hadith

	// Columns to select from the hadiths table
	columns := []string{"id", "text", "source", "topic", "created_at", "updated_at"}

	// Columns available for searching
	searchCols := []string{"text", "source"}

	// Set the topic in the queryParams to use the built-in filter mechanism
	// This is safer than raw SQL strings
	newQueryParams := url.Values{}
	for k, v := range queryParams {
		newQueryParams[k] = v
	}

	// Add the topic filter to queryParams
	if newQueryParams.Get("filters") == "" {
		newQueryParams.Set("filters", fmt.Sprintf("topic:%s", topic))
	} else {
		// Append to existing filters
		newQueryParams.Set("filters", newQueryParams.Get("filters")+fmt.Sprintf(",topic:%s", topic))
	}

	// Build the query using a utility function
	meta, err := utils.BuildQuery(
		&hadiths,
		"hadiths",
		nil, // No joins needed
		columns,
		searchCols,
		newQueryParams,
		nil, // No additional raw SQL filters needed
	)
	if err != nil {
		return nil, nil, fmt.Errorf("خطأ في جلب الأحاديث حسب الموضوع: %v", err)
	}

	return hadiths, meta, nil
}
