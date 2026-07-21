# Practice & Favorites — Mobile Checklist

## Requirements & Planning
- [x] Update root `requirement_all.txt` with Practice & Favorites spec
- [x] Create mobile checklist file
- [x] Create full-stack checklist (`PRACTICE_FAVORITES_FULLSTACK_CHECKLIST.md`)

## Types & Data Layer
- [x] Add Practice/Favorites types to `src/types/index.ts`
- [x] Add practice mock store (`src/api/practiceMockStore.ts`)
- [x] Add practice persistence service (`src/services/practiceStorage.ts`)
- [x] Add `src/api/practice.ts` API module
- [x] Add `src/api/favorites.ts` API module

## Hooks
- [x] Add `src/hooks/usePractice.ts`
- [x] Add `src/hooks/useFavorites.ts`
- [x] Add `src/hooks/useFavoriteQuestionToggle.ts`
- [x] Add `src/hooks/useFavoriteEventToggle.ts`

## Shared Components
- [x] Add `SegmentedControl` component
- [x] Add `FavoriteButton` component
- [x] Add `UnfavoriteConfirmBottomSheet` component
- [x] Add `PracticeQuestionCard` component

## Screens
- [x] Add `PracticeListScreen` (To Practice / Completed sub-tabs)
- [x] Add `QuestionTrainingScreen`
- [x] Add `AddQuestionScreen` (create + edit)
- [x] Add `FavoritesScreen` (Events / Questions sub-tabs)
- [x] Add `MyQuestionsScreen`

## Navigation
- [x] Add `PracticeNavigator`
- [x] Add `FavoritesNavigator`
- [x] Update `MainNavigator` (Events | Practice | Favorites | Profile)
- [x] Update `ProfileNavigator` (My Questions route)
- [x] Update `src/navigation/types.ts`

## Profile & Events Integration
- [x] Add My Questions entry on `ProfileScreen`
- [x] Add favorite toggle on `EventDetailsScreen`
- [x] Add optional favorite toggle on `EventCard` (used on Favorites tab)

## i18n (vi, en, zh, ja)
- [x] Add Practice tab translations
- [x] Add Favorites tab translations
- [x] Add My Questions translations
- [x] Add training / add-question / unfavorite translations

## Backend Integration
- [x] Mobile uses real API when `USE_MOCK_DATA=false`
- [x] Backend API + DB + Dashboard implemented (see full-stack checklist)

## Verification
- [x] TypeScript compiles for new Practice/Favorites mobile files
- [ ] Lint passes on changed files (run `yarn lint` locally)
