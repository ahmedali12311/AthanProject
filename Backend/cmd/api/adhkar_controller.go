package main

import (
	"errors"
	"net/http"
	"project/internal/data"
	"project/utils"
	"project/utils/validator"
	"strconv"
)

// CreateAdhkarHandler handles POST requests to create a new dhikr
func (app *application) CreateAdhkarHandler(w http.ResponseWriter, r *http.Request) {
	v := validator.New()

	// Parse form data
	text := r.FormValue("text")
	source := r.FormValue("source")
	repeatStr := r.FormValue("repeat")
	categoryIDStr := r.FormValue("category_id")

	// Validate input
	v.Check(text != "", "text", "نص الذكر مطلوب")
	v.Check(source != "", "source", "مصدر الذكر مطلوب")
	v.Check(categoryIDStr != "", "category_id", "معرف تصنيف الذكر مطلوب")
	v.Check(len(source) <= 255, "source", "مصدر الذكر يجب ألا يتجاوز 255 حرفًا")

	// Parse repeat count (default to 1 if not specified)
	repeat := 1
	if repeatStr != "" {
		var err error
		repeat, err = strconv.Atoi(repeatStr)
		if err != nil || repeat <= 0 {
			v.AddError("repeat", "عدد المرات يجب أن يكون رقمًا موجبًا")
		}
	}

	// Parse category ID
	categoryID, err := strconv.Atoi(categoryIDStr)
	if err != nil || categoryID <= 0 {
		v.AddError("category_id", "معرف تصنيف الذكر يجب أن يكون رقمًا صحيحًا موجبًا")
	}

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	adhkar := &data.Adhkar{
		Text:       text,
		Source:     source,
		Repeat:     repeat,
		CategoryID: categoryID,
	}

	// Insert the dhikr
	err = app.Model.AdhkarDB.InsertAdhkar(adhkar)
	if err != nil {
		if errors.Is(err, data.ErrAdhkarAlreadyExists) {
			app.errorResponse(w, r, http.StatusConflict, "الذكر موجود بالفعل")
			return
		} else if errors.Is(err, data.ErrAdhkarCategoryNotFound) {
			app.errorResponse(w, r, http.StatusBadRequest, "تصنيف الذكر غير موجود")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	// Send response
	utils.SendJSONResponse(w, http.StatusCreated, utils.Envelope{
		"message": "تم إضافة الذكر بنجاح",
		"adhkar":  adhkar,
	})
}

// GetAdhkarHandler handles GET requests to retrieve a dhikr by ID
func (app *application) GetAdhkarHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف الذكر مطلوب")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		app.badRequestResponse(w, r, errors.New("معرف الذكر يجب أن يكون رقمًا صحيحًا موجبًا"))
		return
	}

	adhkar, err := app.Model.AdhkarDB.GetAdhkarByID(id)
	if err != nil {
		if errors.Is(err, data.ErrAdhkarNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "الذكر غير موجود")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"adhkar": adhkar,
	})
}

// UpdateAdhkarHandler handles PUT requests to update a dhikr
func (app *application) UpdateAdhkarHandler(w http.ResponseWriter, r *http.Request) {
	v := validator.New()

	// Parse form data
	idStr := r.FormValue("id")
	text := r.FormValue("text")
	source := r.FormValue("source")
	repeatStr := r.FormValue("repeat")
	categoryIDStr := r.FormValue("category_id")

	// Validate ID
	if idStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف الذكر مطلوب")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		app.badRequestResponse(w, r, errors.New("معرف الذكر يجب أن يكون رقمًا صحيحًا موجبًا"))
		return
	}

	// Parse repeat count
	repeat := 1
	if repeatStr != "" {
		var err error
		repeat, err = strconv.Atoi(repeatStr)
		if err != nil || repeat <= 0 {
			v.AddError("repeat", "عدد المرات يجب أن يكون رقمًا موجبًا")
		}
	}

	// Parse category ID
	categoryID := 0
	if categoryIDStr != "" {
		var err error
		categoryID, err = strconv.Atoi(categoryIDStr)
		if err != nil || categoryID <= 0 {
			v.AddError("category_id", "معرف تصنيف الذكر يجب أن يكون رقمًا صحيحًا موجبًا")
		}
	}

	// Validate other fields
	v.Check(text != "", "text", "نص الذكر مطلوب")
	v.Check(source != "", "source", "مصدر الذكر مطلوب")
	v.Check(categoryID > 0, "category_id", "معرف تصنيف الذكر مطلوب")
	v.Check(len(source) <= 255, "source", "مصدر الذكر يجب ألا يتجاوز 255 حرفًا")

	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	adhkar := &data.Adhkar{
		ID:         id,
		Text:       text,
		Source:     source,
		Repeat:     repeat,
		CategoryID: categoryID,
	}

	// Update the dhikr
	err = app.Model.AdhkarDB.UpdateAdhkar(adhkar)
	if err != nil {
		if errors.Is(err, data.ErrAdhkarNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "الذكر غير موجود")
			return
		} else if errors.Is(err, data.ErrAdhkarCategoryNotFound) {
			app.errorResponse(w, r, http.StatusBadRequest, "تصنيف الذكر غير موجود")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"message": "تم تحديث الذكر بنجاح",
		"adhkar":  adhkar,
	})
}

// DeleteAdhkarHandler handles DELETE requests to delete a dhikr
func (app *application) DeleteAdhkarHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف الذكر مطلوب")
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		app.badRequestResponse(w, r, errors.New("معرف الذكر يجب أن يكون رقمًا صحيحًا موجبًا"))
		return
	}

	err = app.Model.AdhkarDB.DeleteAdhkar(id)
	if err != nil {
		if errors.Is(err, data.ErrAdhkarNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "الذكر غير موجود")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"message": "تم حذف الذكر بنجاح",
	})
}

// ListAdhkarHandler handles GET requests to list adhkar with pagination and filtering
func (app *application) ListAdhkarHandler(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()

	adhkar, meta, err := app.Model.AdhkarDB.ListAdhkar(queryParams)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"adhkar": adhkar,
		"meta":   meta,
	})
}

// GetAdhkarByCategoryIDHandler handles GET requests to retrieve adhkar filtered by category_id
func (app *application) GetAdhkarByCategoryIDHandler(w http.ResponseWriter, r *http.Request) {
	categoryIDStr := r.URL.Query().Get("category_id")
	if categoryIDStr == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "معرف تصنيف الذكر مطلوب")
		return
	}

	categoryID, err := strconv.Atoi(categoryIDStr)
	if err != nil || categoryID <= 0 {
		app.badRequestResponse(w, r, errors.New("معرف تصنيف الذكر يجب أن يكون رقمًا صحيحًا موجبًا"))
		return
	}

	// Check if the category exists
	_, err = app.Model.AdhkarCategoryDB.GetAdhkarCategoryByID(categoryID)
	if err != nil {
		if errors.Is(err, data.ErrAdhkarCategoryNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "تصنيف الذكر غير موجود")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	queryParams := r.URL.Query()

	adhkar, meta, err := app.Model.AdhkarDB.GetAdhkarByCategoryID(categoryID, queryParams)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	if len(adhkar) == 0 {
		utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
			"message": "لا توجد أذكار لهذا التصنيف",
			"adhkar":  []data.Adhkar{},
			"meta":    meta,
		})
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"adhkar": adhkar,
		"meta":   meta,
	})
}
