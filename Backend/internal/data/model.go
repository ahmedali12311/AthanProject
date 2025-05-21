package data

import (
	"errors"

	"github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	_ "github.com/joho/godotenv/autoload"
)

var (
	ErrDuplicateEntry              = errors.New("duplicate entry")
	ErrInvalidInput                = errors.New("invalid input")
	ErrStoreNotFound               = errors.New("store not found")
	ErrStoreTypeNotFound           = errors.New("store type not found")
	ErrProductNotFound             = errors.New("product not found")
	ErrProductUnavailable          = errors.New("product unavailable")
	ErrCartNotFound                = errors.New("cart not found")
	ErrCartItemNotFound            = errors.New("cart item not found")
	ErrOrderNotFound               = errors.New("order not found")
	ErrOrderItemNotFound           = errors.New("order item not found")
	ErrAdNotFound                  = errors.New("ad not found")
	ErrRecordNotFound              = errors.New("السجل غير موجود")
	ErrDuplicatedKey               = errors.New("المستخدم لديه القيمة بالفعل")
	ErrDuplicatedRole              = errors.New("المستخدم لديه الدور بالفعل")
	ErrHasRole                     = errors.New("المستخدم لديه دور بالفعل")
	ErrHasNoRoles                  = errors.New("المستخدم ليس لديه أدوار")
	ErrForeignKeyViolation         = errors.New("انتهاك قيد المفتاح الخارجي")
	ErrUserNotFound                = errors.New("المستخدم غير موجود")
	ErrUserAlreadyhaveatable       = errors.New("المستخدم لديه جدول بالفعل")
	ErrUserHasNoTable              = errors.New("المستخدم ليس لديه جدول")
	ErrEmailAlreadyInserted        = errors.New("البريد الإلكتروني موجود بالفعل")
	ErrInvalidQuantity             = errors.New("الكمية المطلوبة غير متاحة")
	ErrRecordNotFoundOrders        = errors.New("لا توجد طلبات متاحة")
	ErrDescriptionMissing          = errors.New("الوصف مطلوب")
	ErrDuplicatedPhone             = errors.New("رقم الهاتف موجود بالفعل")
	QB                             = squirrel.StatementBuilder.PlaceholderFormat(squirrel.Dollar)
	Domain                         = "http://localhost:8080"
	ErrInvalidAddressOrCoordinates = errors.New("either address or coordinates must be provided")
	ErrInvalidDiscount             = errors.New("discount must be between 0 and product price")
	ErrSubscriptionNotFound        = errors.New("نوع الاشتراك غير موجود")
	ErrPrayerTimesNotFound         = errors.New("مواقيت الصلاة غير موجودة")
	ErrPhoneAlreadyInserted        = errors.New("رقم الهاتف مسجل مسبقاً")
	ErrPrayerTimesAlreadyInserted  = errors.New("وقت الصلاة مدخل مسبقا")
	ErrSectionNotFound             = errors.New("القسم غير موجود")
	ErrSectionAlreadyExists        = errors.New("القسم موجود بالفعل")
)

type Model struct {
	db               *sqlx.DB
	UserDB           UserDB
	UserRoleDB       UserRoleDB
	PrayerTimesDB    PrayerTimesDB
	SectionsDB       SectionsDB
	HadithDB         HadithDB
	AdhkarDB         AdhkarDB
	AdhkarCategoryDB AdhkarCategoryDB
	SpecialTopicDB   SpecialTopicDB
}

func NewModels(db *sqlx.DB) Model {
	return Model{
		db:               db,
		UserDB:           UserDB{db},
		UserRoleDB:       UserRoleDB{db},
		PrayerTimesDB:    PrayerTimesDB{db},
		SectionsDB:       SectionsDB{db},
		HadithDB:         HadithDB{db},
		AdhkarDB:         AdhkarDB{db},
		AdhkarCategoryDB: AdhkarCategoryDB{db},
		SpecialTopicDB:   SpecialTopicDB{db},
	}
}
