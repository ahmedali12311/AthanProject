package data

import (
	"database/sql"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"project/utils"
	"project/utils/validator"

	"github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type PrayerTimes struct {
	ID             int       `db:"id" json:"id"`
	Day            int       `db:"day" json:"day"`
	Month          int       `db:"month" json:"month"`
	FajrFirstTime  time.Time `db:"fajr_first_time" json:"fajr_first_time"`
	FajrSecondTime time.Time `db:"fajr_second_time" json:"fajr_second_time"`
	SunriseTime    time.Time `db:"sunrise_time" json:"sunrise_time"`
	DhuhrTime      time.Time `db:"dhuhr_time" json:"dhuhr_time"`
	AsrTime        time.Time `db:"asr_time" json:"asr_time"`
	MaghribTime    time.Time `db:"maghrib_time" json:"maghrib_time"`
	IshaTime       time.Time `db:"isha_time" json:"isha_time"`

	SectionID int       `db:"section_id" json:"section_id"` // Changed from Section string
	Name      string    `db:"name" json:"name"`             // Add this field to map s.name
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}

type PrayerTimesResponse struct {
	ID             int    `db:"id" json:"id"`
	Day            int    `db:"day" json:"day"`
	Month          int    `db:"month" json:"month"`
	FajrFirstTime  string `db:"fajr_first_time" json:"fajr_first_time"`
	FajrSecondTime string `db:"fajr_second_time" json:"fajr_second_time"`
	SunriseTime    string `db:"sunrise_time" json:"sunrise_time"`
	DhuhrTime      string `db:"dhuhr_time" json:"dhuhr_time"`
	AsrTime        string `db:"asr_time" json:"asr_time"`
	MaghribTime    string `db:"maghrib_time" json:"maghrib_time"`
	IshaTime       string `db:"isha_time" json:"isha_time"`
	SectionID      int    `db:"section_id" json:"section_id"`
	Name           string `db:"name" json:"name"`
	CreatedAt      string `db:"created_at" json:"created_at"`
	UpdatedAt      string `db:"updated_at" json:"updated_at"`
}

func (pt *PrayerTimes) ToResponse() PrayerTimesResponse {
	return PrayerTimesResponse{
		ID:             pt.ID,
		Day:            pt.Day,
		Month:          pt.Month,
		FajrFirstTime:  pt.FajrFirstTime.Format("15:04"),
		FajrSecondTime: pt.FajrSecondTime.Format("15:04"),
		SunriseTime:    pt.SunriseTime.Format("15:04"),
		DhuhrTime:      pt.DhuhrTime.Format("15:04"),
		AsrTime:        pt.AsrTime.Format("15:04"),
		MaghribTime:    pt.MaghribTime.Format("15:04"),
		IshaTime:       pt.IshaTime.Format("15:04"),
		SectionID:      pt.SectionID,
		Name:           pt.Name,
		CreatedAt:      pt.CreatedAt.Format(time.RFC3339),
		UpdatedAt:      pt.UpdatedAt.Format(time.RFC3339),
	}
}

// PrayerTimesDB handles database operations related to prayer times.
type PrayerTimesDB struct {
	db *sqlx.DB
}

// ValidatePrayerTimes validates the prayer times data.
func ValidatePrayerTimes(v *validator.Validator, pt *PrayerTimes, fields ...string) {
	for _, field := range fields {
		switch field {
		case "day":
			v.Check(pt.Day >= 1 && pt.Day <= 31, "day", "اليوم يجب أن يكون بين 1 و31")
		case "month":
			v.Check(pt.Month >= 1 && pt.Month <= 12, "month", "الشهر يجب أن يكون بين 1 و12")
		case "fajr_first_time":
			v.Check(!pt.FajrFirstTime.IsZero(), "fajr_first_time", "وقت الفجر الأول مطلوب")
		case "fajr_second_time":
			v.Check(!pt.FajrSecondTime.IsZero(), "fajr_second_time", "وقت الفجر الثاني مطلوب")
		case "sunrise_time":
			v.Check(!pt.SunriseTime.IsZero(), "sunrise_time", "وقت الشروق مطلوب")
		case "dhuhr_time":
			v.Check(!pt.DhuhrTime.IsZero(), "dhuhr_time", "وقت الظهر مطلوب")
		case "asr_time":
			v.Check(!pt.AsrTime.IsZero(), "asr_time", "وقت العصر مطلوب")
		case "maghrib_time":
			v.Check(!pt.MaghribTime.IsZero(), "maghrib_time", "وقت المغرب مطلوب")
		case "isha_time":
			v.Check(!pt.IshaTime.IsZero(), "isha_time", "وقت العشاء مطلوب")
		case "section_id": // Changed from "section"
			v.Check(pt.SectionID > 0, "section_id", "معرف القسم مطلوب ويجب أن يكون أكبر من 0")
		}
	}
}

// GetSectionIDByName retrieves the section ID by its name.
func (pt *PrayerTimesDB) GetSectionIDByName(name string) (int, error) {
	var id int
	query := "SELECT id FROM sections WHERE name = $1"
	err := pt.db.QueryRow(query, name).Scan(&id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, errors.New("القسم غير موجود")
		}
		return 0, fmt.Errorf("خطأ في جلب معرف القسم: %v", err)
	}
	return id, nil
}

// InsertPrayerTimes inserts a new prayer times record.
// InsertPrayerTimes inserts a new prayer times record.
func (pt *PrayerTimesDB) InsertPrayerTimes(prayer *PrayerTimes) error {
	query, args, err := QB.Insert("prayer_times").
		Columns(
			"day", "month", "fajr_first_time", "fajr_second_time",
			"sunrise_time", "dhuhr_time", "asr_time", "maghrib_time",
			"isha_time", "section_id", // تم تغييره من "section" إلى "section_id"
		).
		Values(
			prayer.Day, prayer.Month, prayer.FajrFirstTime, prayer.FajrSecondTime,
			prayer.SunriseTime, prayer.DhuhrTime, prayer.AsrTime, prayer.MaghribTime,
			prayer.IshaTime, prayer.SectionID,
		).
		Suffix("RETURNING id, created_at, updated_at").
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = pt.db.QueryRowx(query, args...).StructScan(prayer)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Constraint == "prayer_times_day_month_section_id_key" {
				return ErrPrayerTimesAlreadyInserted
			}
		}
		return fmt.Errorf("خطأ في إضافة مواقيت الصلاة: %v", err)
	}

	return nil
}

// GetPrayerTimes retrieves a prayer times record by day, month, and section_id.
func (pt *PrayerTimesDB) GetPrayerTimes(day, month, sectionID int) (*PrayerTimes, error) {
	var prayer PrayerTimes
	query, args, err := QB.Select(
		"id", "day", "month", "fajr_first_time", "fajr_second_time", // "day_name" corrected to "day"
		"sunrise_time", "dhuhr_time", "asr_time", "maghrib_time",
		"isha_time", "section_id", "created_at", "updated_at", // Changed from "section"
	).
		From("prayer_times").
		Where(squirrel.Eq{"day": day, "month": month, "section_id": sectionID}). // Changed from "section"
		ToSql()
	if err != nil {
		return nil, fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	err = pt.db.Get(&prayer, query, args...)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrPrayerTimesNotFound
		}
		return nil, fmt.Errorf("خطأ في جلب بيانات مواقيت الصلاة: %v", err)
	}

	return &prayer, nil
}

// DeletePrayerTimes deletes a prayer times record by day, month, and section_id.
func (pt *PrayerTimesDB) DeletePrayerTimes(day, month, sectionID int) error {
	query, args, err := QB.Delete("prayer_times").
		Where(squirrel.Eq{"day": day, "month": month, "section_id": sectionID}). // Changed from "section"
		ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء استعلام الحذف: %v", err)
	}

	result, err := pt.db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("خطأ في حذف مواقيت الصلاة: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من الصفوف المتأثرة: %v", err)
	}
	if rowsAffected == 0 {
		return ErrPrayerTimesNotFound
	}

	return nil
}

// UpdatePrayerTimes updates an existing prayer times record.
func (pt *PrayerTimesDB) UpdatePrayerTimes(prayer *PrayerTimes) error {
	// First check if the record exists
	originalPrayer, err := pt.GetPrayerTimes(prayer.Day, prayer.Month, prayer.SectionID)
	if err != nil {
		if errors.Is(err, ErrPrayerTimesNotFound) {
			return ErrPrayerTimesNotFound
		}
		return fmt.Errorf("خطأ في التحقق من وجود مواقيت الصلاة: %v", err)
	}

	// First check if we're trying to update to a day/month/section combination that already exists
	// We'll do this via direct query to avoid affecting the original prayer times
	var count int
	checkQuery := "SELECT COUNT(*) FROM prayer_times WHERE id != $1 AND day = $2 AND month = $3 AND section_id = $4"
	err = pt.db.QueryRow(checkQuery, originalPrayer.ID, prayer.Day, prayer.Month, prayer.SectionID).Scan(&count)
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من تكرار البيانات: %v", err)
	}

	if count > 0 {
		return ErrPrayerTimesAlreadyInserted
	}

	// If we reach here, it's safe to update all fields
	updateQuery := QB.Update("prayer_times").
		Set("day", prayer.Day).
		Set("month", prayer.Month).
		Set("section_id", prayer.SectionID).
		Set("fajr_first_time", prayer.FajrFirstTime).
		Set("fajr_second_time", prayer.FajrSecondTime).
		Set("sunrise_time", prayer.SunriseTime).
		Set("dhuhr_time", prayer.DhuhrTime).
		Set("asr_time", prayer.AsrTime).
		Set("maghrib_time", prayer.MaghribTime).
		Set("isha_time", prayer.IshaTime).
		Set("updated_at", time.Now())

	// Use the original ID to ensure we update the correct record
	whereClause := squirrel.Eq{"id": originalPrayer.ID}

	query, args, err := updateQuery.Where(whereClause).ToSql()
	if err != nil {
		return fmt.Errorf("خطأ في إنشاء الاستعلام: %v", err)
	}

	result, err := pt.db.Exec(query, args...)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Constraint == "prayer_times_day_month_section_id_key" {
				return ErrPrayerTimesAlreadyInserted
			}
		}
		return fmt.Errorf("خطأ في تحديث مواقيت الصلاة: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("خطأ في التحقق من الصفوف المتأثرة: %v", err)
	}
	if rowsAffected == 0 {
		return ErrPrayerTimesNotFound
	}

	// Fetch the updated record to return the complete object with updated timestamps
	updatedPrayer, err := pt.GetPrayerTimes(prayer.Day, prayer.Month, prayer.SectionID)
	if err != nil {
		return fmt.Errorf("خطأ في جلب البيانات المحدثة: %v", err)
	}

	// Update the input object with the latest data
	*prayer = *updatedPrayer
	return nil
}

// SearchPrayerTimes searches for prayer times by day, month, and section name.
func (pt *PrayerTimesDB) SearchPrayerTimes(day, month int, sectionName string) ([]PrayerTimesResponse, error) {
	var prayers []PrayerTimes

	// Build the query with joins to get section name
	query := `
		SELECT pt.id, pt.day, pt.month, 
		       pt.fajr_first_time, pt.fajr_second_time, 
		       pt.sunrise_time, pt.dhuhr_time, pt.asr_time, 
		       pt.maghrib_time, pt.isha_time, 
		       pt.section_id, s.name, 
		       pt.created_at, pt.updated_at
		FROM prayer_times pt
		JOIN sections s ON pt.section_id = s.id
		WHERE 1=1
	`

	var args []interface{}
	var conditions []string

	// Add conditional filters
	paramIndex := 1

	if day > 0 {
		conditions = append(conditions, fmt.Sprintf("pt.day = $%d", paramIndex))
		args = append(args, day)
		paramIndex++
	}

	if month > 0 {
		conditions = append(conditions, fmt.Sprintf("pt.month = $%d", paramIndex))
		args = append(args, month)
		paramIndex++
	}

	if sectionName != "" {
		conditions = append(conditions, fmt.Sprintf("s.name ILIKE $%d", paramIndex))
		args = append(args, "%"+sectionName+"%")
		paramIndex++
	}

	// Add conditions to query
	if len(conditions) > 0 {
		query += " AND " + strings.Join(conditions, " AND ")
	}

	// Add order by
	query += " ORDER BY pt.month, pt.day"

	// Execute query
	err := pt.db.Select(&prayers, query, args...)
	if err != nil {
		return nil, fmt.Errorf("خطأ في البحث عن مواقيت الصلاة: %v", err)
	}

	// If no results found
	if len(prayers) == 0 {
		return nil, ErrPrayerTimesNotFound
	}

	// Convert to response format
	var response []PrayerTimesResponse
	for _, p := range prayers {
		response = append(response, p.ToResponse())
	}

	return response, nil
}

func (pt *PrayerTimesDB) ListPrayerTimes(queryParams url.Values) ([]PrayerTimesResponse, *utils.Meta, error) {
	var prayers []PrayerTimes

	// Define the columns to select
	columns := []string{
		"pt.id", "pt.day", "pt.month",
		"pt.fajr_first_time", "pt.fajr_second_time",
		"pt.sunrise_time", "pt.dhuhr_time",
		"pt.asr_time", "pt.maghrib_time", "pt.isha_time",
		"s.name",
		"pt.section_id", "pt.created_at", "pt.updated_at",
	}

	// Define search columns and joins
	searchCols := []string{"s.name"}
	joinClause := []string{"sections s ON pt.section_id = s.id"}

	// Get current date for ordering
	now := time.Now()
	currentDay := now.Day()
	currentMonth := int(now.Month())

	// Define custom ordering: prioritize dates from today onward
	orderBy := []string{
		fmt.Sprintf("CASE WHEN pt.month > %d OR (pt.month = %d AND pt.day >= %d) THEN 0 ELSE 1 END ASC", currentMonth, currentMonth, currentDay),
		"pt.month ASC",
		"pt.day ASC",
	}

	// Define filters to include all relevant data
	query1 := fmt.Sprintf("(pt.month > %d OR (pt.month = %d AND pt.day >= %d))", currentMonth, currentMonth, currentDay)
	query2 := fmt.Sprintf("(pt.month < %d OR (pt.month = %d AND pt.day < %d))", currentMonth, currentMonth, currentDay)
	additionalFilters := []string{fmt.Sprintf("(%s OR %s)", query1, query2)}

	// Execute the custom query
	meta, err := utils.BuildPrayerTimesQuery(
		&prayers,
		"prayer_times pt",
		joinClause,
		columns,
		searchCols,
		queryParams,
		additionalFilters,
		orderBy,
	)
	if err != nil {
		return nil, nil, fmt.Errorf("error fetching prayer times list: %v", err)
	}

	// Convert to response format
	var response []PrayerTimesResponse
	for _, p := range prayers {
		response = append(response, p.ToResponse())
	}

	return response, meta, nil
}
