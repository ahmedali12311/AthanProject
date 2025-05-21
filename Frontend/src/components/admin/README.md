# Admin Management Components

This directory contains components for the admin management section of the Islamic application.

## Overview

The admin management section provides functionality to manage various aspects of the application:

1. **Prayer Times Management**: Configure and update prayer times for different locations
2. **Sections Management**: Manage different sections/pages of the application
3. **Adhkar Management**:
   - Manage individual Adhkar items
   - Manage Adhkar categories with a dropdown selection
   - Filter Adhkar by category
4. **Hadiths Management**: Add, edit, delete and search hadiths
5. **Special Topics Management**: Manage special Islamic topics for educational content
6. **Account Management**: Update admin account information

## Component Structure

- **ManagePage.tsx**: The main container that handles authentication and tab navigation
- **ManagePrayerTimes.tsx**: Interface for managing prayer times
- **ManageSections.tsx**: Interface for managing application sections
- **ManageAdhkar.tsx**: Container for Adhkar management with tab switching
  - **ManageAdhkarItems.tsx**: Interface for managing individual Adhkar
  - **ManageAdhkarCategories.tsx**: Interface for managing Adhkar categories
- **ManageHadiths.tsx**: Interface for managing hadiths
- **ManageSpecialTopics.tsx**: Interface for managing special topics
- **Login.tsx**: Authentication interface
- **UpdateAccount.tsx**: Interface for managing user account information
- **Pagination.tsx**: Reusable pagination component

## Features

- Full CRUD operations for all managed entities
- Search functionality for hadiths and special topics
- Category filtering for Adhkar
- Token-based authentication with automatic token refresh
- Responsive design for all screen sizes
- Arabic language support with RTL text direction
- Form validation for all inputs

## API Integration

All components connect to a backend API at `https://islambackend.fly.dev/` with endpoints for each entity type.
Authentication is handled via JWT tokens passed in Authorization headers. 