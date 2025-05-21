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

// Errors specific to adhkar category operations
var (
	ErrAdhkarCategoryNotFound      = errors.New("تصنيف الأذكار غير موجود")
	ErrAdhkarCategoryAlreadyExists = errors.New("تصنيف الأذكار موجود بالفعل")
	ErrAdhkarCategoryInUse         = errors.New("لا يمكن حذف التصنيف لأنه مستخدم في أذكار")
)

// AdhkarCategory represents a record in the adhkar_categories table
type AdhkarCategory struct {
	ID          int       `db:"id" json:"id"`
	Name        string    `db:"name" json:"name"`
	Description string    `db:"description" json:"description,omitempty"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

// AdhkarCategoryDB handles database operations for the adhkar_categories table
type AdhkarCategoryDB struct {
	db *sqlx.DB
}

// InsertAdhkarCategory inserts a new adhkar category into the adhkar_categories table
func (a *AdhkarCategoryDB) InsertAdhkarCategory(category *AdhkarCategory) error {
	query, args, err := QB.Insert("adhkar_categories").
		Columns("name", "description").
		Values(category.Name, category.Description).
		Suffix("RETURNING id, created_at, updated_at").
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = a.db.QueryRowx(query, args...).Scan(&category.ID, &category.CreatedAt, &category.UpdatedAt)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // PostgreSQL unique_violation error code
				return ErrAdhkarCategoryAlreadyExists
			}
		}
		return fmt.Errorf("خطأ في إضافة تصنيف الأذكار: %v", err)
	}

	return nil
}

// GetAdhkarCategoryByID retrieves an adhkar category by its ID
func (a *AdhkarCategoryDB) GetAdhkarCategoryByID(id int) (*AdhkarCategory, error) {
	var category AdhkarCategory
	query, args, err := QB.Select("id", "name", "description", "created_at", "updated_at").
		From("adhkar_categories").
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = a.db.Get(&category, query, args...)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrAdhkarCategoryNotFound
		}
		return nil, fmt.Errorf("خطأ في جلب بيانات تصنيف الأذكار: %v", err)
	}

	return &category, nil
}

// GetAdhkarCategoryByName retrieves an adhkar category by its name
func (a *AdhkarCategoryDB) GetAdhkarCategoryByName(name string) (*AdhkarCategory, error) {
	var category AdhkarCategory
	query, args, err := QB.Select("id", "name", "description", "created_at", "updated_at").
		From("adhkar_categories").
		Where(squirrel.Eq{"name": name}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = a.db.Get(&category, query, args...)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrAdhkarCategoryNotFound
		}
		return nil, fmt.Errorf("خطأ في جلب بيانات تصنيف الأذكار: %v", err)
	}

	return &category, nil
}

// UpdateAdhkarCategory updates an existing adhkar category
func (a *AdhkarCategoryDB) UpdateAdhkarCategory(category *AdhkarCategory) error {
	query, args, err := QB.Update("adhkar_categories").
		Set("name", category.Name).
		Set("description", category.Description).
		Set("updated_at", time.Now()).
		Where(squirrel.Eq{"id": category.ID}).
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	result, err := a.db.Exec(query, args...)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // unique_violation
				return ErrAdhkarCategoryAlreadyExists
			}
		}
		return fmt.Errorf("خطأ في تحديث تصنيف الأذكار: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من الصفوف المتأثرة: %v", err)
	}
	if rowsAffected == 0 {
		return ErrAdhkarCategoryNotFound
	}

	return nil
}

// DeleteAdhkarCategory deletes an adhkar category by its ID if it's not referenced by any adhkar
func (a *AdhkarCategoryDB) DeleteAdhkarCategory(id int) error {
	// First check if the category is in use
	var count int
	checkQuery := "SELECT COUNT(*) FROM adhkar WHERE category_id = $1"
	err := a.db.Get(&count, checkQuery, id)
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من استخدام التصنيف: %v", err)
	}

	if count > 0 {
		return ErrAdhkarCategoryInUse
	}

	// If not in use, proceed with deletion
	query, args, err := QB.Delete("adhkar_categories").
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء استعلام الحذف: %v", err)
	}

	result, err := a.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("خطأ في حذف تصنيف الأذكار: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من الصفوف المتأثرة: %v", err)
	}
	if rowsAffected == 0 {
		return ErrAdhkarCategoryNotFound
	}

	return nil
}

// ListAdhkarCategories lists all adhkar categories with pagination and filtering
func (a *AdhkarCategoryDB) ListAdhkarCategories(queryParams url.Values) ([]AdhkarCategory, *utils.Meta, error) {
	var categories []AdhkarCategory

	// Columns to select from the adhkar_categories table
	columns := []string{"id", "name", "description", "created_at", "updated_at"}

	// Columns available for searching
	searchCols := []string{"name", "description"}

	// Build the query using a utility function
	meta, err := utils.BuildQuery(
		&categories,
		"adhkar_categories",
		nil, // No joins needed
		columns,
		searchCols,
		queryParams,
		nil, // No additional filters
	)
	if err != nil {
		return nil, nil, fmt.Errorf("خطأ في جلب قائمة تصنيفات الأذكار: %v", err)
	}

	return categories, meta, nil
}
