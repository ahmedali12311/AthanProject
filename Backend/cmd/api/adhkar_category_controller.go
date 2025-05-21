package main

import (
	"errors"
	"net/http"
	"project/internal/data"
	"project/utils"
	"project/utils/validator"
	"strconv"
)

// CreateAdhkarCategoryHandler handles POST requests to create a new adhkar category
func (app *application) CreateAdhkarCategoryHandler(w http.ResponseWriter, r *http.Request) {
	v := validator.New()

	// Parse form data
	name := r.FormValue("name")
	description := r.FormValue("description")

	// Validate input
	v.Check(name != "", "name", "اسم التصنيف مطلوب")
	v.Check(len(name) <= 50, "name", "اسم التصنيف يجب ألا يتجاوز 50 حرفًا")

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	category := &data.AdhkarCategory{
		Name:        name,
		Description: description,
	}

	// Insert the category
	err := app.Model.AdhkarCategoryDB.InsertAdhkarCategory(category)
	if err != nil {
		if errors.Is(err, data.ErrAdhkarCategoryAlreadyExists) {
			app.errorResponse(w, r, http.StatusConflict, "تصنيف الأذكار موجود بالفعل")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	// Send response
	utils.SendJSONResponse(w, http.StatusCreated, utils.Envelope{
		"message":  "تم إضافة تصنيف الأذكار بنجاح",
		"category": category,
	})
}

// GetAdhkarCategoryHandler handles GET requests to retrieve an adhkar category by ID
func (app *application) GetAdhkarCategoryHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف التصنيف مطلوب")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		app.badRequestResponse(w, r, errors.New("معرف التصنيف يجب أن يكون رقمًا صحيحًا موجبًا"))
		return
	}

	category, err := app.Model.AdhkarCategoryDB.GetAdhkarCategoryByID(id)
	if err != nil {
		if errors.Is(err, data.ErrAdhkarCategoryNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "تصنيف الأذكار غير موجود")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"category": category,
	})
}

// UpdateAdhkarCategoryHandler handles PUT requests to update an adhkar category
func (app *application) UpdateAdhkarCategoryHandler(w http.ResponseWriter, r *http.Request) {
	v := validator.New()

	// Parse form data
	idStr := r.FormValue("id")
	name := r.FormValue("name")
	description := r.FormValue("description")

	// Validate ID
	if idStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف التصنيف مطلوب")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		app.badRequestResponse(w, r, errors.New("معرف التصنيف يجب أن يكون رقمًا صحيحًا موجبًا"))
		return
	}

	// Validate other fields
	v.Check(name != "", "name", "اسم التصنيف مطلوب")
	v.Check(len(name) <= 50, "name", "اسم التصنيف يجب ألا يتجاوز 50 حرفًا")

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	category := &data.AdhkarCategory{
		ID:          id,
		Name:        name,
		Description: description,
	}

	// Update the category
	err = app.Model.AdhkarCategoryDB.UpdateAdhkarCategory(category)
	if err != nil {
		if errors.Is(err, data.ErrAdhkarCategoryNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "تصنيف الأذكار غير موجود")
			return
		}
		if errors.Is(err, data.ErrAdhkarCategoryAlreadyExists) {
			app.errorResponse(w, r, http.StatusConflict, "تصنيف الأذكار موجود بالفعل")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"message":  "تم تحديث تصنيف الأذكار بنجاح",
		"category": category,
	})
}

// DeleteAdhkarCategoryHandler handles DELETE requests to delete an adhkar category
func (app *application) DeleteAdhkarCategoryHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف التصنيف مطلوب")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		app.badRequestResponse(w, r, errors.New("معرف التصنيف يجب أن يكون رقمًا صحيحًا موجبًا"))
		return
	}

	err = app.Model.AdhkarCategoryDB.DeleteAdhkarCategory(id)
	if err != nil {
		if errors.Is(err, data.ErrAdhkarCategoryNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "تصنيف الأذكار غير موجود")
			return
		}
		if errors.Is(err, data.ErrAdhkarCategoryInUse) {
			app.errorResponse(w, r, http.StatusBadRequest, "لا يمكن حذف التصنيف لأنه مستخدم في أذكار")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"message": "تم حذف تصنيف الأذكار بنجاح",
	})
}

// ListAdhkarCategoriesHandler handles GET requests to list adhkar categories with pagination and filtering
func (app *application) ListAdhkarCategoriesHandler(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()

	categories, meta, err := app.Model.AdhkarCategoryDB.ListAdhkarCategories(queryParams)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"categories": categories,
		"meta":       meta,
	})
}
