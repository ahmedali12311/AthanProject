package main

import (
	"errors"
	"fmt"
	"net/http"
	"project/internal/data"
	"project/utils"
	"project/utils/validator"
	"strconv"
)

// CreateSpecialTopicHandler handles POST requests to create a new special topic
func (app *application) CreateSpecialTopicHandler(w http.ResponseWriter, r *http.Request) {
	v := validator.New()

	// Parse form data
	topic := r.FormValue("topic")
	content := r.FormValue("content")

	// Validate input
	v.Check(topic != "", "topic", "موضوع المادة مطلوب")
	v.Check(content != "", "content", "محتوى المادة مطلوب")

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	specialTopic := &data.SpecialTopic{
		Topic:   topic,
		Content: content,
	}

	// Insert the special topic
	err := app.Model.SpecialTopicDB.InsertSpecialTopic(specialTopic)
	if err != nil {
		if errors.Is(err, data.ErrSpecialTopicAlreadyExists) {
			app.errorResponse(w, r, http.StatusConflict, "الموضوع موجود بالفعل")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	// Send response
	utils.SendJSONResponse(w, http.StatusCreated, utils.Envelope{
		"message":      "تم إضافة الموضوع الخاص بنجاح",
		"specialTopic": specialTopic,
	})
}

// GetSpecialTopicHandler handles GET requests to retrieve a special topic by ID
func (app *application) GetSpecialTopicHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the ID from the URL query parameter
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف الموضوع مطلوب")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("معرف غير صالح"))
		return
	}

	// Get the special topic
	specialTopic, err := app.Model.SpecialTopicDB.GetSpecialTopicByID(id)
	if err != nil {
		if errors.Is(err, data.ErrSpecialTopicNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	// Send response
	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"specialTopic": specialTopic,
	})
}

// UpdateSpecialTopicHandler handles PUT requests to update an existing special topic
func (app *application) UpdateSpecialTopicHandler(w http.ResponseWriter, r *http.Request) {
	v := validator.New()

	// Parse form data
	idStr := r.FormValue("id")
	topic := r.FormValue("topic")
	content := r.FormValue("content")

	// Validate ID
	if idStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف الموضوع مطلوب")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		app.badRequestResponse(w, r, errors.New("معرف غير صالح"))
		return
	}

	// Validate other fields
	v.Check(topic != "", "topic", "موضوع المادة مطلوب")
	v.Check(content != "", "content", "محتوى المادة مطلوب")

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	specialTopic := &data.SpecialTopic{
		ID:      id,
		Topic:   topic,
		Content: content,
	}

	// Update the special topic
	err = app.Model.SpecialTopicDB.UpdateSpecialTopic(specialTopic)
	if err != nil {
		if errors.Is(err, data.ErrSpecialTopicNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	// Send response
	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"message":      "تم تحديث الموضوع الخاص بنجاح",
		"specialTopic": specialTopic,
	})
}

// ListSpecialTopicsHandler handles GET requests to list all special topics
func (app *application) ListSpecialTopicsHandler(w http.ResponseWriter, r *http.Request) {
	// Get the query parameters
	queryParams := r.URL.Query()

	// List the special topics
	specialTopics, meta, err := app.Model.SpecialTopicDB.ListSpecialTopics(queryParams)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	// Send response
	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"specialTopics": specialTopics,
		"metadata":      meta,
	})
}

// GetSpecialTopicsByTopicHandler handles GET requests to retrieve special topics by topic keyword
func (app *application) GetSpecialTopicsByTopicHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the topic keyword from the URL query parameter
	topicKeyword := r.URL.Query().Get("topic")
	if topicKeyword == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "كلمة البحث مطلوبة")
		return
	}

	// Get the query parameters
	queryParams := r.URL.Query()

	// Get the special topics by topic keyword
	specialTopics, meta, err := app.Model.SpecialTopicDB.GetSpecialTopicsByTopic(topicKeyword, queryParams)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	// Send response
	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"specialTopics": specialTopics,
		"metadata":      meta,
	})
}

// DeleteSpecialTopicHandler handles DELETE requests to delete a special topic
func (app *application) DeleteSpecialTopicHandler(w http.ResponseWriter, r *http.Request) {
	// Parse the ID from the URL query parameter
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف الموضوع مطلوب")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("معرف غير صالح"))
		return
	}

	// Delete the special topic
	err = app.Model.SpecialTopicDB.DeleteSpecialTopic(id)
	if err != nil {
		if errors.Is(err, data.ErrSpecialTopicNotFound) {
			app.notFoundResponse(w, r, err)
			return
		}
		app.serverErrorResponse(w, r, fmt.Errorf("حدث خطأ أثناء حذف الموضوع: %w", err))
		return
	}

	// Send response
	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"message": "تم حذف الموضوع الخاص بنجاح",
	})
}
