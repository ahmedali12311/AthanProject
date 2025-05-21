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

// Errors specific to adhkar operations
var (
	ErrAdhkarNotFound      = errors.New("الذكر غير موجود")
	ErrAdhkarAlreadyExists = errors.New("الذكر موجود بالفعل")
)

// Adhkar represents a record in the adhkar table
type Adhkar struct {
	ID         int       `db:"id" json:"id"`
	Text       string    `db:"text" json:"text"`
	Source     string    `db:"source" json:"source"`
	Repeat     int       `db:"repeat" json:"repeat"`
	CategoryID int       `db:"category_id" json:"category_id"`
	Category   string    `db:"category_name" json:"category_name,omitempty"` // Name from join with adhkar_categories
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
	UpdatedAt  time.Time `db:"updated_at" json:"updated_at"`
}

// AdhkarDB handles database operations for the adhkar table
type AdhkarDB struct {
	db *sqlx.DB
}

// InsertAdhkar inserts a new dhikr into the adhkar table
func (a *AdhkarDB) InsertAdhkar(adhkar *Adhkar) error {
	query, args, err := QB.Insert("adhkar").
		Columns("text", "source", "repeat", "category_id").
		Values(adhkar.Text, adhkar.Source, adhkar.Repeat, adhkar.CategoryID).
		Suffix("RETURNING id, created_at, updated_at").
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = a.db.QueryRowx(query, args...).Scan(&adhkar.ID, &adhkar.CreatedAt, &adhkar.UpdatedAt)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // PostgreSQL unique_violation error code
				return ErrAdhkarAlreadyExists
			} else if pqErr.Code == "23503" { // Foreign key violation
				return ErrAdhkarCategoryNotFound
			}
		}
		return fmt.Errorf("خطأ في إضافة الذكر: %v", err)
	}

	return nil
}

// GetAdhkarByID retrieves a dhikr by its ID
func (a *AdhkarDB) GetAdhkarByID(id int) (*Adhkar, error) {
	var adhkar Adhkar
	query, args, err := QB.Select(
		"a.id", "a.text", "a.source", "a.repeat",
		"a.category_id", "ac.name AS category_name",
		"a.created_at", "a.updated_at").
		From("adhkar a").
		Join("adhkar_categories ac ON a.category_id = ac.id").
		Where(squirrel.Eq{"a.id": id}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = a.db.Get(&adhkar, query, args...)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrAdhkarNotFound
		}
		return nil, fmt.Errorf("خطأ في جلب بيانات الذكر: %v", err)
	}

	return &adhkar, nil
}

// UpdateAdhkar updates an existing dhikr
func (a *AdhkarDB) UpdateAdhkar(adhkar *Adhkar) error {
	query, args, err := QB.Update("adhkar").
		Set("text", adhkar.Text).
		Set("source", adhkar.Source).
		Set("repeat", adhkar.Repeat).
		Set("category_id", adhkar.CategoryID).
		Set("updated_at", time.Now()).
		Where(squirrel.Eq{"id": adhkar.ID}).
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	result, err := a.db.Exec(query, args...)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23503" { // Foreign key violation
				return ErrAdhkarCategoryNotFound
			}
		}
		return fmt.Errorf("خطأ في تحديث الذكر: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من الصفوف المتأثرة: %v", err)
	}
	if rowsAffected == 0 {
		return ErrAdhkarNotFound
	}

	return nil
}

// DeleteAdhkar deletes a dhikr by its ID
func (a *AdhkarDB) DeleteAdhkar(id int) error {
	query, args, err := QB.Delete("adhkar").
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء استعلام الحذف: %v", err)
	}

	result, err := a.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("خطأ في حذف الذكر: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من الصفوف المتأثرة: %v", err)
	}
	if rowsAffected == 0 {
		return ErrAdhkarNotFound
	}

	return nil
}

// ListAdhkar lists all adhkar with pagination and filtering
func (a *AdhkarDB) ListAdhkar(queryParams url.Values) ([]Adhkar, *utils.Meta, error) {
	var adhkar []Adhkar

	// Columns to select with joins
	columns := []string{
		"a.id", "a.text", "a.source", "a.repeat",
		"a.category_id", "ac.name AS category_name",
		"a.created_at", "a.updated_at",
	}

	// Columns available for searching
	searchCols := []string{"a.text", "a.source", "ac.name"}

	// Joins
	joins := []string{"adhkar_categories ac ON a.category_id = ac.id"}

	// Build the query using a utility function
	meta, err := utils.BuildQuery(
		&adhkar,
		"adhkar a",
		joins,
		columns,
		searchCols,
		queryParams,
		nil, // No additional filters
	)
	if err != nil {
		return nil, nil, fmt.Errorf("خطأ في جلب قائمة الأذكار: %v", err)
	}

	return adhkar, meta, nil
}

// GetAdhkarByCategoryID retrieves adhkar filtered by category_id
func (a *AdhkarDB) GetAdhkarByCategoryID(categoryID int, queryParams url.Values) ([]Adhkar, *utils.Meta, error) {
	var adhkar []Adhkar

	// Columns to select with joins
	columns := []string{
		"a.id", "a.text", "a.source", "a.repeat",
		"a.category_id", "ac.name AS category_name",
		"a.created_at", "a.updated_at",
	}

	// Columns available for searching
	searchCols := []string{"a.text", "a.source"}

	// Joins
	joins := []string{"adhkar_categories ac ON a.category_id = ac.id"}

	// Set the category_id in the queryParams to use the built-in filter mechanism
	newQueryParams := url.Values{}
	for k, v := range queryParams {
		newQueryParams[k] = v
	}

	// Add the category_id filter to queryParams
	if newQueryParams.Get("filters") == "" {
		newQueryParams.Set("filters", fmt.Sprintf("category_id:%d", categoryID))
	} else {
		// Append to existing filters
		newQueryParams.Set("filters", newQueryParams.Get("filters")+fmt.Sprintf(",category_id:%d", categoryID))
	}

	// Build the query using a utility function
	meta, err := utils.BuildQuery(
		&adhkar,
		"adhkar a",
		joins,
		columns,
		searchCols,
		newQueryParams,
		nil, // No additional raw SQL filters needed
	)
	if err != nil {
		return nil, nil, fmt.Errorf("خطأ في جلب الأذكار حسب التصنيف: %v", err)
	}

	return adhkar, meta, nil
}
