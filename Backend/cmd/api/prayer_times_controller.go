package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"project/internal/data"
	"project/utils"
	"project/utils/validator"
	"strconv"
	"time"
)

func (app *application) GetPrayerTimesHandler(w http.ResponseWriter, r *http.Request) {
	dayStr := r.URL.Query().Get("day")
	monthStr := r.URL.Query().Get("month")
	sectionName := r.URL.Query().Get("section")

	if dayStr == "" || monthStr == "" || sectionName == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "اليوم، الشهر، والقسم مطلوبة")
		return
	}

	day, err := strconv.Atoi(dayStr)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("اليوم يجب أن يكون رقمًا صحيحًا"))
		return
	}

	month, err := strconv.Atoi(monthStr)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("الشهر يجب أن يكون رقمًا صحيحًا"))
		return
	}

	sectionID, err := app.Model.PrayerTimesDB.GetSectionIDByName(sectionName)
	if err != nil {
		app.errorResponse(w, r, http.StatusNotFound, err.Error())
		return
	}

	prayer, err := app.Model.PrayerTimesDB.GetPrayerTimes(day, month, sectionID)
	if err != nil {
		app.handleRetrievalError(w, r, err)
		return
	}

	// Include section name in response
	type Response struct {
		PrayerTimes *data.PrayerTimes `json:"prayer_times"`
		Section     string            `json:"section"`
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"prayer_times": Response{
			PrayerTimes: prayer,
			Section:     sectionName,
		},
	})
}

func (app *application) ListPrayerTimesHandler(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()

	prayers, meta, err := app.Model.PrayerTimesDB.ListPrayerTimes(queryParams)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	// Note: Section name filtering is handled in ListPrayerTimes via join,
	// but the response only includes section_id. For section names, additional logic is needed.

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"prayer_times": prayers,
		"meta":         meta,
	})
}

func (app *application) SearchPrayerTimesHandler(w http.ResponseWriter, r *http.Request) {
	// Get query parameters
	dayStr := r.URL.Query().Get("day")
	monthStr := r.URL.Query().Get("month")
	sectionName := r.URL.Query().Get("section")

	// Convert day and month to integers if provided
	var day, month int
	var err error

	if dayStr != "" {
		day, err = strconv.Atoi(dayStr)
		if err != nil {
			app.badRequestResponse(w, r, errors.New("اليوم يجب أن يكون رقمًا صحيحًا"))
			return
		}
	}

	if monthStr != "" {
		month, err = strconv.Atoi(monthStr)
		if err != nil {
			app.badRequestResponse(w, r, errors.New("الشهر يجب أن يكون رقمًا صحيحًا"))
			return
		}
	}

	// Search for prayer times
	prayers, err := app.Model.PrayerTimesDB.SearchPrayerTimes(day, month, sectionName)
	if err != nil {
		if errors.Is(err, data.ErrPrayerTimesNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "لم يتم العثور على مواقيت صلاة مطابقة")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"prayer_times": prayers,
	})
}

func (app *application) CreatePrayerTimesHandler(w http.ResponseWriter, r *http.Request) {
	v := validator.New()
	sectionName := r.FormValue("section")
	if sectionName == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "القسم مطلوب")
		return
	}

	sectionID, err := app.Model.PrayerTimesDB.GetSectionIDByName(sectionName)
	if err != nil {
		app.errorResponse(w, r, http.StatusNotFound, err.Error())
		return
	}

	prayer := &data.PrayerTimes{
		Day:       parseIntFormValue(r.FormValue("day")),
		Month:     parseIntFormValue(r.FormValue("month")),
		SectionID: sectionID,
	}

	// Parse time fields
	fajrFirstTime, err := parseTime(r.FormValue("fajr_first_time"))
	if err == nil {
		prayer.FajrFirstTime = fajrFirstTime
	}
	fajrSecondTime, err := parseTime(r.FormValue("fajr_second_time"))
	if err == nil {
		prayer.FajrSecondTime = fajrSecondTime
	}
	sunriseTime, err := parseTime(r.FormValue("sunrise_time"))
	if err == nil {
		prayer.SunriseTime = sunriseTime
	}
	dhuhrTime, err := parseTime(r.FormValue("dhuhr_time"))
	if err == nil {
		prayer.DhuhrTime = dhuhrTime
	}
	asrTime, err := parseTime(r.FormValue("asr_time"))
	if err == nil {
		prayer.AsrTime = asrTime
	}
	maghribTime, err := parseTime(r.FormValue("maghrib_time"))
	if err == nil {
		prayer.MaghribTime = maghribTime
	}
	ishaTime, err := parseTime(r.FormValue("isha_time"))
	if err == nil {
		prayer.IshaTime = ishaTime
	}

	if prayer.Day == 0 || prayer.Month == 0 || prayer.SectionID == 0 ||
		prayer.FajrFirstTime.IsZero() || prayer.FajrSecondTime.IsZero() ||
		prayer.SunriseTime.IsZero() || prayer.DhuhrTime.IsZero() ||
		prayer.AsrTime.IsZero() || prayer.MaghribTime.IsZero() || prayer.IshaTime.IsZero() {
		app.errorResponse(w, r, http.StatusBadRequest, "يجب ملء جميع الحقول المطلوبة")
		return
	}

	data.ValidatePrayerTimes(v, prayer, "day", "month", "fajr_first_time", "fajr_second_time",
		"sunrise_time", "dhuhr_time", "asr_time", "maghrib_time", "isha_time", "section_id")
	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	if err := app.Model.PrayerTimesDB.InsertPrayerTimes(prayer); err != nil {
		if errors.Is(err, data.ErrPrayerTimesAlreadyInserted) {
			app.errorResponse(w, r, http.StatusConflict, "مواقيت الصلاة لهذا اليوم والشهر والقسم موجودة مسبقاً")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusCreated, utils.Envelope{
		"message":      "تم إنشاء مواقيت الصلاة بنجاح",
		"prayer_times": prayer,
		"section":      sectionName, // Include section name in response
	})
}

func (app *application) DeletePrayerTimesHandler(w http.ResponseWriter, r *http.Request) {
	dayStr := r.URL.Query().Get("day")
	monthStr := r.URL.Query().Get("month")
	sectionName := r.URL.Query().Get("section")

	if dayStr == "" || monthStr == "" || sectionName == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "اليوم، الشهر، والقسم مطلوبة")
		return
	}

	day, err := strconv.Atoi(dayStr)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("اليوم يجب أن يكون رقمًا صحيحًا"))
		return
	}

	month, err := strconv.Atoi(monthStr)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("الشهر يجب أن يكون رقمًا صحيحًا"))
		return
	}

	sectionID, err := app.Model.PrayerTimesDB.GetSectionIDByName(sectionName)
	if err != nil {
		app.errorResponse(w, r, http.StatusNotFound, err.Error())
		return
	}

	err = app.Model.PrayerTimesDB.DeletePrayerTimes(day, month, sectionID)
	if err != nil {
		app.handleRetrievalError(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"message": "تم حذف مواقيت الصلاة بنجاح",
	})
}

func (app *application) UpdatePrayerTimesHandler(w http.ResponseWriter, r *http.Request) {
	v := validator.New()

	// Get the original values to identify the prayer times entry
	dayStr := r.FormValue("day")
	monthStr := r.FormValue("month")
	sectionName := r.FormValue("section")

	if dayStr == "" || monthStr == "" || sectionName == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "اليوم، الشهر، والقسم مطلوبة")
		return
	}

	day, err := strconv.Atoi(dayStr)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("اليوم يجب أن يكون رقمًا صحيحًا"))
		return
	}

	month, err := strconv.Atoi(monthStr)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("الشهر يجب أن يكون رقمًا صحيحًا"))
		return
	}

	sectionID, err := app.Model.PrayerTimesDB.GetSectionIDByName(sectionName)
	if err != nil {
		app.errorResponse(w, r, http.StatusNotFound, err.Error())
		return
	}

	// Create prayer times object with the updated values
	prayer := &data.PrayerTimes{
		Day:       day,
		Month:     month,
		SectionID: sectionID,
	}

	// Parse time fields
	fajrFirstTime, err := parseTime(r.FormValue("fajr_first_time"))
	if err == nil {
		prayer.FajrFirstTime = fajrFirstTime
	}
	fajrSecondTime, err := parseTime(r.FormValue("fajr_second_time"))
	if err == nil {
		prayer.FajrSecondTime = fajrSecondTime
	}
	sunriseTime, err := parseTime(r.FormValue("sunrise_time"))
	if err == nil {
		prayer.SunriseTime = sunriseTime
	}
	dhuhrTime, err := parseTime(r.FormValue("dhuhr_time"))
	if err == nil {
		prayer.DhuhrTime = dhuhrTime
	}
	asrTime, err := parseTime(r.FormValue("asr_time"))
	if err == nil {
		prayer.AsrTime = asrTime
	}
	maghribTime, err := parseTime(r.FormValue("maghrib_time"))
	if err == nil {
		prayer.MaghribTime = maghribTime
	}
	ishaTime, err := parseTime(r.FormValue("isha_time"))
	if err == nil {
		prayer.IshaTime = ishaTime
	}

	if prayer.FajrFirstTime.IsZero() || prayer.FajrSecondTime.IsZero() ||
		prayer.SunriseTime.IsZero() || prayer.DhuhrTime.IsZero() ||
		prayer.AsrTime.IsZero() || prayer.MaghribTime.IsZero() || prayer.IshaTime.IsZero() {
		app.errorResponse(w, r, http.StatusBadRequest, "يجب ملء جميع الحقول المطلوبة للوقت")
		return
	}

	data.ValidatePrayerTimes(v, prayer, "fajr_first_time", "fajr_second_time",
		"sunrise_time", "dhuhr_time", "asr_time", "maghrib_time", "isha_time")
	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	if err := app.Model.PrayerTimesDB.UpdatePrayerTimes(prayer); err != nil {
		if errors.Is(err, data.ErrPrayerTimesNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "مواقيت الصلاة المطلوبة غير موجودة")
			return
		}
		if errors.Is(err, data.ErrPrayerTimesAlreadyInserted) {
			app.errorResponse(w, r, http.StatusConflict, "البيانات مضافة بالفعل مسبقا")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"message":      "تم تحديث مواقيت الصلاة بنجاح",
		"prayer_times": prayer.ToResponse(),
		"section":      sectionName, // Include section name in response
	})
}

// Helper function to parse integer form values
func parseIntFormValue(value string) int {
	if value == "" {
		return 0
	}
	result, err := strconv.Atoi(value)
	if err != nil {
		return 0
	}
	return result
}

// Helper function to parse time in HH:MM format
func parseTime(value string) (time.Time, error) {
	if value == "" {
		return time.Time{}, errors.New("empty time value")
	}
	t, err := time.Parse("15:04", value)
	if err != nil {
		return time.Time{}, err
	}
	return time.Date(0, 1, 1, t.Hour(), t.Minute(), 0, 0, time.UTC), nil
}
func (app *application) checkPrayerTimes(ctx context.Context) {
	currentTime := time.Now()
	currentDay := currentTime.Day()
	currentMonth := int(currentTime.Month())

	// Query prayer times for today
	prayers, _, err := app.Model.PrayerTimesDB.ListPrayerTimes(url.Values{
		"day":   []string{fmt.Sprintf("%d", currentDay)},
		"month": []string{fmt.Sprintf("%d", currentMonth)},
	})
	if err != nil {
		app.log.Printf("Failed to fetch prayer times: %v", err)
		return
	}

	// Check each prayer time
	for _, prayer := range prayers {
		pt := data.PrayerTimes{
			FajrFirstTime:  parseTimeForDate(prayer.FajrFirstTime, currentTime, app.log),
			FajrSecondTime: parseTimeForDate(prayer.FajrSecondTime, currentTime, app.log),
			SunriseTime:    parseTimeForDate(prayer.SunriseTime, currentTime, app.log),
			DhuhrTime:      parseTimeForDate(prayer.DhuhrTime, currentTime, app.log),
			AsrTime:        parseTimeForDate(prayer.AsrTime, currentTime, app.log),
			MaghribTime:    parseTimeForDate(prayer.MaghribTime, currentTime, app.log),
			IshaTime:       parseTimeForDate(prayer.IshaTime, currentTime, app.log),
			SectionID:      prayer.SectionID,
			Name:           prayer.Name,
		}
		app.notifyIfPrayerTime(ctx, pt, currentTime)
	}
}

func parseTimeForDate(timeStr string, currentTime time.Time) time.Time {
	t, err := time.Parse("15:04", timeStr)
	if err != nil {
		return time.Time{}
	}
	return time.Date(currentTime.Year(), currentTime.Month(), currentTime.Day(),
		t.Hour(), t.Minute(), 0, 0, currentTime.Location())
}
func (app *application) notifyIfPrayerTime(ctx context.Context, pt data.PrayerTimes, currentTime time.Time) {
	timeWindow := time.Minute // 1-minute window to avoid duplicate notifications
	prayerTimes := []struct {
		name string
		time time.Time
	}{
		{"الفجر الأول", pt.FajrFirstTime},
		{"الفجر الثاني", pt.FajrSecondTime},
		{"الظهر", pt.DhuhrTime},
		{"العصر", pt.AsrTime},
		{"المغرب", pt.MaghribTime},
		{"العشاء", pt.IshaTime},
	}

	topic := fmt.Sprintf("prayer_notifications_%d", pt.SectionID) // Section-specific topic

	for _, prayer := range prayerTimes {
		if isWithinTimeWindow(currentTime, prayer.time, timeWindow) {
			message := &messaging.Message{
				Notification: &messaging.Notification{
					Title: fmt.Sprintf("وقت صلاة %s في %s", prayer.name, pt.Name),
					Body:  fmt.Sprintf("حان وقت صلاة %s في %s الساعة %s", prayer.name, pt.Name, prayer.time.Format("15:04")),
				},
				Data: map[string]string{
					"prayer":       prayer.name,
					"section":      pt.Name,
					"click_action": "http://localhost:8080", // Updated to local web page
				},
				Topic: topic, // Use section-specific topic
			}
			// Retry up to 3 times
			for retries := 3; retries > 0; retries-- {
				_, err := app.fcm.Send(ctx, message)
				if err == nil {
					app.infoLog.Printf("Sent notification for %s in %s at %s", prayer.name, pt.Name, prayer.time.Format("15:04"))
					break
				}
				app.log.Printf("Retrying notification for %s in %s (%d retries left): %v", prayer.name, pt.Name, retries-1, err)
				time.Sleep(time.Second)
			}
		}
	}
}

func isWithinTimeWindow(currentTime, prayerTime time.Time, window time.Duration) bool {
	return currentTime.After(prayerTime) && currentTime.Sub(prayerTime) <= window
}

func (app *application) SubscribeToNotificationsHandler(w http.ResponseWriter, r *http.Request) {
	token := r.FormValue("token")
	sectionID := r.FormValue("section_id") // New parameter for section ID
	if token == "" || sectionID == "" {
		utils.SendJSONResponse(w, http.StatusBadRequest, utils.Envelope{
			"error": "FCM token and section_id are required",
		})
		return
	}

	ctx := r.Context()
	topic := fmt.Sprintf("prayer_notifications_%s", sectionID) // Section-specific topic
	_, err := app.fcm.SubscribeToTopic(ctx, []string{token}, topic)
	if err != nil {
		app.log.Printf("Failed to subscribe to topic %s: %v", topic, err)
		utils.SendJSONResponse(w, http.StatusInternalServerError, utils.Envelope{
			"error": "Failed to subscribe to notifications",
		})
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"message": fmt.Sprintf("Successfully subscribed to notifications for section %s", sectionID),
	})
}
