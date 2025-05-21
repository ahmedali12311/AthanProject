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

// Errors specific to special topic operations
var (
	ErrSpecialTopicNotFound      = errors.New("الموضوع الخاص غير موجود")
	ErrSpecialTopicAlreadyExists = errors.New("الموضوع الخاص موجود بالفعل")
)

// SpecialTopic represents a record in the special_topics table
type SpecialTopic struct {
	ID        int       `db:"id" json:"id"`
	Topic     string    `db:"topic" json:"topic"`
	Content   string    `db:"content" json:"content"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

// SpecialTopicDB handles database operations for the special_topics table
type SpecialTopicDB struct {
	db *sqlx.DB
}

// InsertSpecialTopic inserts a new special topic into the special_topics table
func (s *SpecialTopicDB) InsertSpecialTopic(topic *SpecialTopic) error {
	query, args, err := QB.Insert("special_topics").
		Columns("topic", "content").
		Values(topic.Topic, topic.Content).
		Suffix("RETURNING id, created_at, updated_at").
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = s.db.QueryRowx(query, args...).Scan(&topic.ID, &topic.CreatedAt, &topic.UpdatedAt)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // PostgreSQL unique_violation error code
				return ErrSpecialTopicAlreadyExists
			}
		}
		return fmt.Errorf("خطأ في إضافة الموضوع الخاص: %v", err)
	}

	return nil
}

// GetSpecialTopicByID retrieves a special topic by its ID
func (s *SpecialTopicDB) GetSpecialTopicByID(id int) (*SpecialTopic, error) {
	var topic SpecialTopic
	query, args, err := QB.Select("id", "topic", "content", "created_at", "updated_at").
		From("special_topics").
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = s.db.Get(&topic, query, args...)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSpecialTopicNotFound
		}
		return nil, fmt.Errorf("خطأ في جلب بيانات الموضوع الخاص: %v", err)
	}

	return &topic, nil
}

// UpdateSpecialTopic updates an existing special topic
func (s *SpecialTopicDB) UpdateSpecialTopic(topic *SpecialTopic) error {
	query, args, err := QB.Update("special_topics").
		Set("topic", topic.Topic).
		Set("content", topic.Content).
		Set("updated_at", time.Now()).
		Where(squirrel.Eq{"id": topic.ID}).
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	result, err := s.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("خطأ في تحديث الموضوع الخاص: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من الصفوف المتأثرة: %v", err)
	}
	if rowsAffected == 0 {
		return ErrSpecialTopicNotFound
	}

	return nil
}

// DeleteSpecialTopic deletes a special topic by its ID
func (s *SpecialTopicDB) DeleteSpecialTopic(id int) error {
	query, args, err := QB.Delete("special_topics").
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء استعلام الحذف: %v", err)
	}

	result, err := s.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("خطأ في حذف الموضوع الخاص: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من الصفوف المتأثرة: %v", err)
	}
	if rowsAffected == 0 {
		return ErrSpecialTopicNotFound
	}

	return nil
}

// ListSpecialTopics lists all special topics with pagination and filtering
func (s *SpecialTopicDB) ListSpecialTopics(queryParams url.Values) ([]SpecialTopic, *utils.Meta, error) {
	var topics []SpecialTopic

	// Columns to select from the special_topics table
	columns := []string{"id", "topic", "content", "created_at", "updated_at"}

	// Columns available for searching
	searchCols := []string{"topic", "content"}

	// Build the query using a utility function
	meta, err := utils.BuildQuery(
		&topics,
		"special_topics",
		nil, // No joins needed
		columns,
		searchCols,
		queryParams,
		nil, // No additional filters
	)
	if err != nil {
		return nil, nil, fmt.Errorf("خطأ في جلب قائمة المواضيع الخاصة: %v", err)
	}

	return topics, meta, nil
}

// GetSpecialTopicsByTopic retrieves special topics filtered by topic keyword
func (s *SpecialTopicDB) GetSpecialTopicsByTopic(topicKeyword string, queryParams url.Values) ([]SpecialTopic, *utils.Meta, error) {
	var topics []SpecialTopic

	// Columns to select from the special_topics table
	columns := []string{"id", "topic", "content", "created_at", "updated_at"}

	// Columns available for searching
	searchCols := []string{"content"}

	// Set the topic in the queryParams to use the built-in filter mechanism
	newQueryParams := url.Values{}
	for k, v := range queryParams {
		newQueryParams[k] = v
	}

	// Add the topic filter to queryParams, using LIKE query for partial matches
	if newQueryParams.Get("search") == "" {
		newQueryParams.Set("search", topicKeyword)
	}

	// Use the topic field for search
	if newQueryParams.Get("searchFields") == "" {
		newQueryParams.Set("searchFields", "topic")
	}

	// Build the query using a utility function
	meta, err := utils.BuildQuery(
		&topics,
		"special_topics",
		nil, // No joins needed
		columns,
		searchCols,
		newQueryParams,
		nil, // No additional raw SQL filters needed
	)
	if err != nil {
		return nil, nil, fmt.Errorf("خطأ في جلب المواضيع الخاصة حسب الموضوع: %v", err)
	}

	return topics, meta, nil
}
