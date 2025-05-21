package main

import (
	"errors"
	"net/http"
	"project/internal/data"
	"project/utils"
	"project/utils/validator"
	"strconv"
)

// CreateHadithHandler handles POST requests to create a new hadith
func (app *application) CreateHadithHandler(w http.ResponseWriter, r *http.Request) {
	v := validator.New()

	// Parse form data
	text := r.FormValue("text")
	source := r.FormValue("source")
	topic := r.FormValue("topic")

	// Validate input
	v.Check(text != "", "text", "نص الحديث مطلوب")
	v.Check(source != "", "source", "مصدر الحديث مطلوب")
	v.Check(topic != "", "topic", "موضوع الحديث مطلوب")
	v.Check(len(source) <= 255, "source", "مصدر الحديث يجب ألا يتجاوز 255 حرفًا")
	v.Check(len(topic) <= 255, "topic", "موضوع الحديث يجب ألا يتجاوز 255 حرفًا")

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	hadith := &data.Hadith{
		Text:   text,
		Source: source,
		Topic:  topic,
	}

	// Insert the hadith
	err := app.Model.HadithDB.InsertHadith(hadith)
	if err != nil {
		if errors.Is(err, data.ErrHadithAlreadyExists) {
			app.errorResponse(w, r, http.StatusConflict, "الحديث موجود بالفعل")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	// Send response
	utils.SendJSONResponse(w, http.StatusCreated, utils.Envelope{
		"message": "تم إضافة الحديث بنجاح",
		"hadith":  hadith,
	})
}

// GetHadithHandler handles GET requests to retrieve a hadith by ID
func (app *application) GetHadithHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف الحديث مطلوب")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		app.badRequestResponse(w, r, errors.New("معرف الحديث يجب أن يكون رقمًا صحيحًا موجبًا"))
		return
	}

	hadith, err := app.Model.HadithDB.GetHadithByID(id)
	if err != nil {
		if errors.Is(err, data.ErrHadithNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "الحديث غير موجود")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"hadith": hadith,
	})
}

// UpdateHadithHandler handles PUT requests to update a hadith
func (app *application) UpdateHadithHandler(w http.ResponseWriter, r *http.Request) {
	v := validator.New()

	// Parse form data
	idStr := r.FormValue("id")
	text := r.FormValue("text")
	source := r.FormValue("source")
	topic := r.FormValue("topic")

	// Validate ID
	if idStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف الحديث مطلوب")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		app.badRequestResponse(w, r, errors.New("معرف الحديث يجب أن يكون رقمًا صحيحًا موجبًا"))
		return
	}

	// Validate other fields
	v.Check(text != "", "text", "نص الحديث مطلوب")
	v.Check(source != "", "source", "مصدر الحديث مطلوب")
	v.Check(topic != "", "topic", "موضوع الحديث مطلوب")
	v.Check(len(source) <= 255, "source", "مصدر الحديث يجب ألا يتجاوز 255 حرفًا")
	v.Check(len(topic) <= 255, "topic", "موضوع الحديث يجب ألا يتجاوز 255 حرفًا")

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	hadith := &data.Hadith{
		ID:     id,
		Text:   text,
		Source: source,
		Topic:  topic,
	}

	// Update the hadith
	err = app.Model.HadithDB.UpdateHadith(hadith)
	if err != nil {
		if errors.Is(err, data.ErrHadithNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "الحديث غير موجود")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"message": "تم تحديث الحديث بنجاح",
		"hadith":  hadith,
	})
}

// DeleteHadithHandler handles DELETE requests to delete a hadith
func (app *application) DeleteHadithHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف الحديث مطلوب")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		app.badRequestResponse(w, r, errors.New("معرف الحديث يجب أن يكون رقمًا صحيحًا موجبًا"))
		return
	}

	err = app.Model.HadithDB.DeleteHadith(id)
	if err != nil {
		if errors.Is(err, data.ErrHadithNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "الحديث غير موجود")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"message": "تم حذف الحديث بنجاح",
	})
}

// ListHadithsHandler handles GET requests to list hadiths with pagination and filtering
func (app *application) ListHadithsHandler(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()

	hadiths, meta, err := app.Model.HadithDB.ListHadiths(queryParams)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"hadiths": hadiths,
		"meta":    meta,
	})
}

// GetHadithsByTopicHandler handles GET requests to retrieve hadiths filtered by topic
func (app *application) GetHadithsByTopicHandler(w http.ResponseWriter, r *http.Request) {
	topic := r.URL.Query().Get("topic")
	if topic == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "موضوع الحديث مطلوب")
		return
	}

	queryParams := r.URL.Query()

	hadiths, meta, err := app.Model.HadithDB.GetHadithsByTopic(topic, queryParams)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	if len(hadiths) == 0 {
		utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
			"message": "لا توجد أحاديث لهذا الموضوع",
			"hadiths": []data.Hadith{},
			"meta":    meta,
		})
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"hadiths": hadiths,
		"meta":    meta,
	})
}
