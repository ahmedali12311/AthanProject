package main

import (
	"errors"
	"net/http"
	"project/internal/data"
	"project/utils"
	"project/utils/validator"
	"strconv"
)

// CreateSectionHandler handles POST requests to create a new section
func (app *application) CreateSectionHandler(w http.ResponseWriter, r *http.Request) {
	v := validator.New()

	// Parse form data
	name := r.FormValue("name")
	if name == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "اسم القسم مطلوب")
		return
	}

	// Validate input
	v.Check(len(name) <= 50, "name", "اسم القسم يجب ألا يتجاوز 50 حرفًا")
	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	section := &data.Section{
		Name: name,
	}

	// Insert the section
	err := app.Model.SectionsDB.InsertSection(section)
	if err != nil {
		if errors.Is(err, data.ErrSectionAlreadyExists) {
			app.errorResponse(w, r, http.StatusConflict, "القسم موجود بالفعل")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	// Send response
	utils.SendJSONResponse(w, http.StatusCreated, utils.Envelope{
		"message": "تم إنشاء القسم بنجاح",
		"section": section,
	})
}

// GetSectionHandler handles GET requests to retrieve a section by ID
func (app *application) GetSectionHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف القسم مطلوب")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		app.badRequestResponse(w, r, errors.New("معرف القسم يجب أن يكون رقمًا صحيحًا موجبًا"))
		return
	}

	section, err := app.Model.SectionsDB.GetSectionByID(id)
	if err != nil {
		if errors.Is(err, data.ErrSectionNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "القسم غير موجود")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"section": section,
	})
}

// UpdateSectionHandler handles PUT requests to update a section’s name
func (app *application) UpdateSectionHandler(w http.ResponseWriter, r *http.Request) {
	v := validator.New()

	// Parse form data
	idStr := r.FormValue("id")
	name := r.FormValue("name")

	if idStr == "" || name == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف القسم واسم القسم مطلوبان")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		app.badRequestResponse(w, r, errors.New("معرف القسم يجب أن يكون رقمًا صحيحًا موجبًا"))
		return
	}

	// Validate input
	v.Check(len(name) <= 50, "name", "اسم القسم يجب ألا يتجاوز 50 حرفًا")
	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	section := &data.Section{
		ID:   id,
		Name: name,
	}

	// Update the section
	err = app.Model.SectionsDB.UpdateSection(section)
	if err != nil {
		if errors.Is(err, data.ErrSectionAlreadyExists) {
			app.errorResponse(w, r, http.StatusConflict, "القسم موجود بالفعل")
			return
		}
		if errors.Is(err, data.ErrSectionNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "القسم غير موجود")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"message": "تم تحديث القسم بنجاح",
		"section": section,
	})
}

// DeleteSectionHandler handles DELETE requests to delete a section
func (app *application) DeleteSectionHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف القسم مطلوب")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		app.badRequestResponse(w, r, errors.New("معرف القسم يجب أن يكون رقمًا صحيحًا موجبًا"))
		return
	}

	err = app.Model.SectionsDB.DeleteSection(id)
	if err != nil {
		if errors.Is(err, data.ErrSectionNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "القسم غير موجود")
			return
		}
		if err.Error() == "لا يمكن حذف القسم لأنه يحتوي على مواقيت صلاة مرتبطة" {
			app.errorResponse(w, r, http.StatusBadRequest, err.Error())
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"message": "تم حذف القسم بنجاح",
	})
}

// ListSectionsHandler handles GET requests to list sections with pagination and filtering
func (app *application) ListSectionsHandler(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()

	sections, meta, err := app.Model.SectionsDB.ListSections(queryParams)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"sections": sections,
		"meta":     meta,
	})
}
