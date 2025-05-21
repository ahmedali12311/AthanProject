package data

import (
	"database/sql"
	"errors"
	"fmt"
	"net/url"

	"project/utils"

	"github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

// Section represents a record in the sections table
type Section struct {
	ID   int    `db:"id" json:"id"`
	Name string `db:"name" json:"name"`
}

// SectionsDB handles database operations for the sections table
type SectionsDB struct {
	db *sqlx.DB
}

// InsertSection inserts a new section into the sections table
func (s *SectionsDB) InsertSection(section *Section) error {
	query, args, err := QB.Insert("sections").
		Columns("name").
		Values(section.Name).
		Suffix("RETURNING id").
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = s.db.QueryRowx(query, args...).Scan(&section.ID)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // PostgreSQL unique_violation error code
				return ErrSectionAlreadyExists
			}
		}
		return fmt.Errorf("خطأ في إضافة القسم: %v", err)
	}

	return nil
}

// GetSectionByID retrieves a section by its ID
func (s *SectionsDB) GetSectionByID(id int) (*Section, error) {
	var section Section
	query, args, err := QB.Select("id", "name").
		From("sections").
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = s.db.Get(&section, query, args...)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSectionNotFound
		}
		return nil, fmt.Errorf("خطأ في جلب بيانات القسم: %v", err)
	}

	return &section, nil
}

// GetSectionByName retrieves a section by its name
func (s *SectionsDB) GetSectionByName(name string) (*Section, error) {
	var section Section
	query, args, err := QB.Select("id", "name").
		From("sections").
		Where(squirrel.Eq{"name": name}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = s.db.Get(&section, query, args...)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrSectionNotFound
		}
		return nil, fmt.Errorf("خطأ في جلب بيانات القسم: %v", err)
	}

	return &section, nil
}

// UpdateSection updates the name of an existing section
func (s *SectionsDB) UpdateSection(section *Section) error {
	query, args, err := QB.Update("sections").
		Set("name", section.Name).
		Where(squirrel.Eq{"id": section.ID}).
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	result, err := s.db.Exec(query, args...)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23505" { // unique_violation
				return ErrSectionAlreadyExists
			}
		}
		return fmt.Errorf("خطأ في تحديث القسم: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من الصفوف المتأثرة: %v", err)
	}
	if rowsAffected == 0 {
		return ErrSectionNotFound
	}

	return nil
}

// DeleteSection deletes a section by its ID, handling foreign key constraints
func (s *SectionsDB) DeleteSection(id int) error {
	query, args, err := QB.Delete("sections").
		Where(squirrel.Eq{"id": id}).
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء استعلام الحذف: %v", err)
	}

	result, err := s.db.Exec(query, args...)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code == "23503" { // PostgreSQL foreign_key_violation error code
				return errors.New("لا يمكن حذف القسم لأنه يحتوي على مواقيت صلاة مرتبطة")
			}
		}
		return fmt.Errorf("خطأ في حذف القسم: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من الصفوف المتأثرة: %v", err)
	}
	if rowsAffected == 0 {
		return ErrSectionNotFound
	}

	return nil
}

// ListSections lists all sections with pagination and filtering by name
func (s *SectionsDB) ListSections(queryParams url.Values) ([]Section, *utils.Meta, error) {
	var sections []Section

	// Columns to select from the sections table
	columns := []string{"id", "name"}

	// Columns available for searching (only name in this case)
	searchCols := []string{"name"}

	// Build the query using a utility function (assumed to exist in utils package)
	meta, err := utils.BuildQuery(
		&sections,
		"sections",
		nil, // No joins needed since sections is a standalone table
		columns,
		searchCols,
		queryParams,
		nil, // No additional filters
	)
	if err != nil {
		return nil, nil, fmt.Errorf("خطأ في جلب قائمة الأقسام: %v", err)
	}

	return sections, meta, nil
}
