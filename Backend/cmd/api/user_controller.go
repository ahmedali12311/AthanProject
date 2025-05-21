package main

import (
	"errors"
	"net/http"
	"project/internal/data"
	"project/utils"
	"project/utils/validator"
	"strings"

	"github.com/google/uuid"
)

func (app *application) SigninHandler(w http.ResponseWriter, r *http.Request) {
	phoneNumber := strings.TrimSpace(r.FormValue("phone_number"))
	password := r.FormValue("password")

	if phoneNumber == "" || password == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "يجب إدخال رقم الهاتف وكلمة المرور")
		return
	}
	user, err := app.Model.UserDB.GetUserByPhoneNumber(phoneNumber)
	if err != nil {
		app.handleRetrievalError(w, r, err)
		return
	}

	// ── NEW: load roles ─────────────────────────────────────────────
	roles, err := app.Model.UserRoleDB.GetRolesByUserID(user.ID)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}
	user.Roles = roles
	// ────────────────────────────────────────────────────────────────

	if !utils.CheckPassword(user.Password, password) {
		app.errorResponse(w, r, http.StatusUnauthorized, "رقم الهاتف أو كلمة المرور غير صحيحة")
		return
	}

	// Get actual role names for the token
	roleNames := make([]string, len(user.Roles))
	for i, role := range user.Roles {
		roleNames[i] = role.Name
	}

	token, err := utils.GenerateToken(user.ID.String(), roleNames)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SetTokenCookie(w, token)

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"expires": "24 ساعة",
		"token":   token,
		"user":    user,
	})
}

func (app *application) GetUserHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("معرف المستخدم غير صالح"))
		return
	}

	user, err := app.Model.UserDB.GetUser(id)
	if err != nil {
		app.handleRetrievalError(w, r, err)
		return
	}
	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{"user": user})
}

func (app *application) ListUsersHandler(w http.ResponseWriter, r *http.Request) {
	queryParams := r.URL.Query()

	users, meta, err := app.Model.UserDB.ListUsers(queryParams)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"users": users,
		"meta":  meta,
	})
}

func (app *application) SignupHandler(w http.ResponseWriter, r *http.Request) {

	v := validator.New()
	user := &data.User{
		Name:        strings.TrimSpace(r.FormValue("name")),
		PhoneNumber: strings.TrimSpace(r.FormValue("phone_number")),
		Password:    r.FormValue("password"),
	}

	if user.Name == "" || user.PhoneNumber == "" || user.Password == "" {
		app.errorResponse(w, r, http.StatusBadRequest, "يجب ملء جميع الحقول المطلوبة")
		return
	}

	hashedPassword, err := utils.HashPassword(user.Password)
	if err != nil {
		app.errorResponse(w, r, http.StatusInternalServerError, "خطأ في تشفير كلمة المرور")
		return
	}
	user.Password = hashedPassword

	data.ValidateUser(v, user, "name", "phone_number", "password")
	if !v.Valid() {
		app.failedValidationResponse(w, r, v.Errors)
		return
	}

	// Store the user in the database
	if err := app.Model.UserDB.InsertUser(user); err != nil {
		if errors.Is(err, data.ErrPhoneAlreadyInserted) {
			app.errorResponse(w, r, http.StatusConflict, "رقم الهاتف مسجل مسبقاً")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}
	err = app.Model.UserRoleDB.GrantRole(user.ID, 1)
	if err != nil {
		app.handleRetrievalError(w, r, err)
		return
	}

	// Fetch roles and assign to user
	roles, err := app.Model.UserRoleDB.GetRolesByUserID(user.ID)
	if err != nil {
		app.handleRetrievalError(w, r, err)
		return
	}
	user.Roles = roles

	utils.SendJSONResponse(w, http.StatusCreated, utils.Envelope{
		"message": "تم التسجيل بنجاح",
		"user":    user,
	})
}

func (app *application) MeHandler(w http.ResponseWriter, r *http.Request) {
	idStr := r.Context().Value(UserIDKey).(string)
	userID, err := uuid.Parse(idStr)
	if err != nil {
		app.badRequestResponse(w, r, errors.New("معرف المستخدم غير صالح"))
		return
	}

	user, err := app.Model.UserDB.GetUser(userID)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"user": user,
	})
}

func (app *application) UpdateUserHandler(w http.ResponseWriter, r *http.Request) {
	var userID uuid.UUID
	var err error

	// Check if we have an ID in the path parameters
	idStr := r.PathValue("id")
	if idStr != "" {
		// Path param ID provided - check if user is admin
		authUserIDStr, ok := r.Context().Value(UserIDKey).(string)
		if !ok {
			app.errorResponse(w, r, http.StatusUnauthorized, "غير مصرح لك")
			return
		}

		// Get the roles of the authenticated user
		authUserID, err := uuid.Parse(authUserIDStr)
		if err != nil {
			app.badRequestResponse(w, r, errors.New("معرف المستخدم غير صالح"))
			return
		}

		// Check if the authenticated user is an admin (or updating their own account)
		targetID, err := uuid.Parse(idStr)
		if err != nil {
			app.badRequestResponse(w, r, errors.New("معرف المستخدم المستهدف غير صالح"))
			return
		}

		// If not updating their own account, check admin status
		if targetID != authUserID {
			isAdmin, err := app.Model.UserRoleDB.HasRole(authUserID, 1) // Assuming role ID 1 is admin
			if err != nil || !isAdmin {
				app.errorResponse(w, r, http.StatusForbidden, "غير مصرح لك بتعديل بيانات مستخدم آخر")
				return
			}
		}

		userID = targetID
	} else {
		// No path param ID provided - use authenticated user's ID
		idStr, ok := r.Context().Value(UserIDKey).(string)
		if !ok {
			app.errorResponse(w, r, http.StatusUnauthorized, "غير مصرح لك")
			return
		}

		userID, err = uuid.Parse(idStr)
		if err != nil {
			app.badRequestResponse(w, r, errors.New("معرف المستخدم غير صالح"))
			return
		}
	}

	// Get current user data
	currentUser, err := app.Model.UserDB.GetUser(userID)
	if err != nil {
		app.handleRetrievalError(w, r, err)
		return
	}

	// Initialize validator
	v := validator.New()

	// Create a user object with the updated values
	user := &data.User{
		ID:          userID,
		Name:        strings.TrimSpace(r.FormValue("name")),
		PhoneNumber: strings.TrimSpace(r.FormValue("phone_number")),
		Password:    r.FormValue("password"),
	}

	// If any field is empty, use existing values
	if user.Name == "" {
		user.Name = currentUser.Name
	}

	if user.PhoneNumber == "" {
		user.PhoneNumber = currentUser.PhoneNumber
	}

	// Only hash password if it was provided
	if user.Password != "" {
		hashedPassword, err := utils.HashPassword(user.Password)
		if err != nil {
			app.errorResponse(w, r, http.StatusInternalServerError, "خطأ في تشفير كلمة المرور")
			return
		}
		user.Password = hashedPassword
	} else {
		// Don't update password if not provided
		user.Password = ""
	}

	// Validate the fields that are being updated
	fieldsToValidate := []string{}
	if user.Name != currentUser.Name {
		fieldsToValidate = append(fieldsToValidate, "name")
	}
	if user.PhoneNumber != currentUser.PhoneNumber {
		fieldsToValidate = append(fieldsToValidate, "phone_number")
	}
	if r.FormValue("password") != "" {
		fieldsToValidate = append(fieldsToValidate, "password")
	}

	// Only validate if we have fields to validate
	if len(fieldsToValidate) > 0 {
		data.ValidateUser(v, user, fieldsToValidate...)
		if !v.Valid() {
			app.failedValidationResponse(w, r, v.Errors)
			return
		}
	}

	// Update the user in the database
	if err := app.Model.UserDB.UpdateUser(user); err != nil {
		if errors.Is(err, data.ErrUserNotFound) {
			app.errorResponse(w, r, http.StatusNotFound, "المستخدم غير موجود")
			return
		}
		if errors.Is(err, data.ErrPhoneAlreadyInserted) {
			app.errorResponse(w, r, http.StatusConflict, "رقم الهاتف مسجل مسبقاً")
			return
		}
		app.serverErrorResponse(w, r, err)
		return
	}

	// Generate a new token with updated user information
	roleNames := make([]string, len(user.Roles))
	for i, role := range user.Roles {
		roleNames[i] = role.Name
	}

	token, err := utils.GenerateToken(user.ID.String(), roleNames)
	if err != nil {
		app.serverErrorResponse(w, r, err)
		return
	}

	// Set the new token as a cookie
	utils.SetTokenCookie(w, token)

	utils.SendJSONResponse(w, http.StatusOK, utils.Envelope{
		"message": "تم تحديث بيانات المستخدم بنجاح",
		"user":    user,
		"token":   token,
		"expires": "24 ساعة",
	})
}
