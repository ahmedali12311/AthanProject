package data

import (
	"database/sql"
	"errors"
	"fmt"
	"net/url"
	"time"

	"project/utils"
	"project/utils/validator"

	"github.com/Masterminds/squirrel"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

// Role represents a user role
type Role struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type User struct {
	ID          uuid.UUID `db:"id" json:"id"`
	Name        string    `db:"name" json:"name"`
	Password    string    `db:"password" json:"-"`
	PhoneNumber string    `db:"phone_number" json:"phone_number"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
	Roles       []Role    `db:"-" json:"roles"` // Use db:"-" to exclude from direct DB mapping
}

// UserDB handles database operations related to users.
type UserDB struct {
	db *sqlx.DB
}

func ValidateUser(v *validator.Validator, user *User, fields ...string) {
	for _, field := range fields {
		switch field {
		case "name":
			v.Check(len(user.Name) >= 3, "name", "يجب أن يتكون الاسم من 3 أحرف على الأقل")
			v.Check(user.Name != "", "name", "الاسم مطلوب")
			v.Check(len(user.Name) <= 100, "name", "يجب أن يكون الاسم أقل من 100 حرف")

		case "phone_number":
			v.Check(user.PhoneNumber != "", "phone_number", "رقم الهاتف مطلوب")
			v.Check(validator.Matches(user.PhoneNumber, validator.PhoneRX), "phone_number", "تنسيق رقم الهاتف غير صالح")

		case "password":
			if user.Password != "" {
				v.Check(len(user.Password) >= 8, "password", "كلمة المرور قصيرة جداً")
			}
		}
	}
}

func (u *UserDB) InsertUser(user *User) error {
	query, args, err := QB.Insert("users").
		Columns("name", "password", "phone_number").
		Values(user.Name, user.Password, user.PhoneNumber).
		Suffix("RETURNING id, created_at, updated_at").
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = u.db.QueryRowx(query, args...).StructScan(user)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Constraint == "users_phone_number_key" {
				return ErrPhoneAlreadyInserted
			}
		}
		return fmt.Errorf("خطأ في إضافة المستخدم: %v", err)
	}

	return nil
}

// GetUser retrieves a user by ID and includes their roles
func (u *UserDB) GetUser(userID uuid.UUID) (*User, error) {
	var user User
	query, args, err := QB.Select("id", "name", "password", "phone_number", "created_at", "updated_at").
		From("users").
		Where(squirrel.Eq{"id": userID}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = u.db.Get(&user, query, args...)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("خطأ في جلب بيانات المستخدم: %v", err)
	}

	// Get user roles
	rolesQuery, rolesArgs, err := QB.Select("roles.id", "roles.name").
		From("user_roles").
		Join("roles ON user_roles.role_id = roles.id").
		Where(squirrel.Eq{"user_roles.user_id": userID}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("خطأ في إنشاء استعلام الأدوار: %v", err)
	}

	var roles []struct {
		ID   int    `db:"id"`
		Name string `db:"name"`
	}

	err = u.db.Select(&roles, rolesQuery, rolesArgs...)
	if err != nil {
		return nil, fmt.Errorf("خطأ في جلب أدوار المستخدم: %v", err)
	}

	// Map roles to user
	user.Roles = make([]Role, len(roles))
	for i, role := range roles {
		user.Roles[i] = Role{
			ID:   role.ID,
			Name: role.Name,
		}
	}

	return &user, nil
}

func (u *UserDB) DeleteUser(userID uuid.UUID) error {
	query, args, err := QB.Delete("users").
		Where(squirrel.Eq{"id": userID}).
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء استعلام الحذف: %v", err)
	}

	result, err := u.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("خطأ في حذف المستخدم: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من الصفوف المتأثرة: %v", err)
	}
	if rowsAffected == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (u *UserDB) ListUsers(queryParams url.Values) ([]User, *utils.Meta, error) {
	var users []User

	columns := []string{
		"id", "name", "phone_number", "created_at", "updated_at",
	}

	searchCols := []string{"name", "phone_number"}

	meta, err := utils.BuildQuery(
		&users,
		"users",
		nil,
		columns,
		searchCols,
		queryParams,
		nil,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("خطأ في جلب قائمة المستخدمين: %v", err)
	}

	return users, meta, nil
}

func (u *UserDB) GetUserByPhoneNumber(phoneNumber string) (*User, error) {
	var user User
	query, args, err := QB.Select("id", "name", "password", "phone_number", "created_at", "updated_at").
		From("users").
		Where(squirrel.Eq{"phone_number": phoneNumber}).
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = u.db.Get(&user, query, args...)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("خطأ في جلب بيانات المستخدم: %v", err)
	}

	return &user, nil
}

// UpdateUser updates a user's information.
func (u *UserDB) UpdateUser(user *User) error {
	// First check if the user exists
	_, err := u.GetUser(user.ID)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return ErrUserNotFound
		}
		return fmt.Errorf("خطأ في التحقق من وجود المستخدم: %v", err)
	}

	// Start building the update query
	updateBuilder := QB.Update("users")

	// Only update non-empty fields
	if user.Name != "" {
		updateBuilder = updateBuilder.Set("name", user.Name)
	}

	if user.Password != "" {
		updateBuilder = updateBuilder.Set("password", user.Password)
	}

	if user.PhoneNumber != "" {
		updateBuilder = updateBuilder.Set("phone_number", user.PhoneNumber)
	}

	// Always update the timestamp
	updateBuilder = updateBuilder.Set("updated_at", time.Now())

	// Add the WHERE clause
	updateBuilder = updateBuilder.Where(squirrel.Eq{"id": user.ID})

	// Build the SQL query
	query, args, err := updateBuilder.ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	// Execute the query
	result, err := u.db.Exec(query, args...)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Constraint == "users_phone_number_key" {
				return ErrPhoneAlreadyInserted
			}
		}
		return fmt.Errorf("خطأ في تحديث بيانات المستخدم: %v", err)
	}

	// Check if any rows were affected
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من الصفوف المتأثرة: %v", err)
	}
	if rowsAffected == 0 {
		return ErrUserNotFound
	}

	// Get the updated user
	updatedUser, err := u.GetUser(user.ID)
	if err != nil {
		return fmt.Errorf("خطأ في جلب البيانات المحدثة: %v", err)
	}

	// Update the input object with the latest data
	*user = *updatedUser
	return nil
}
