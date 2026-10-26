// Whether a case category can be picked for a case. Categories cached before
// the is_active flag existed have no flag, so they count as active.
export const isCategoryActive = (category) => category?.is_active !== false

// The categories offered when picking one for a case: the active ones, plus the
// one the case already uses, so editing that case never drops its category.
export const selectableCategories = (categories, currentCategoryId = null) =>
  (categories || []).filter(c =>
    isCategoryActive(c) || (currentCategoryId != null && c.id === currentCategoryId)
  )
