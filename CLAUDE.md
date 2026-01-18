# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**@gamepark/react-game** is a production React component library (v7.2.0) that provides a complete UI framework for building board game interfaces for the Game Park platform. It's a game-agnostic library using generic types `<P, M, L>` (PlayerId, MaterialType, LocationType) to allow different games to reuse components.

## Build Commands

```bash
# Build the library (compiles TypeScript to dist/)
yarn build

# Build before publishing (runs automatically)
yarn prepack

# Link local dependencies for development
yarn linkgp

# Unlink local dependencies
yarn unlinkgp
```

**Build system:**
- TypeScript compiler (tsc) with strict mode enabled
- Output: ES modules to `dist/` with type declarations
- Source maps enabled for debugging
- JSX with Emotion (@emotion/react) for CSS-in-JS

## Core Architecture Patterns

### 1. Material Description Pattern

Games define how their items are displayed and interact by extending `MaterialDescription`:

```typescript
abstract class MaterialDescription<P, M, L, ItemId> {
  abstract content: (props: MaterialContentProps) => ReactNode
  help?: ComponentType<MaterialHelpProps>
  staticItems: MaterialItem[]
  // ... item transformation, drag/click handlers, animations
}
```

- **Purpose**: Declarative way to define game piece appearance and behavior
- **Key methods**: `content` (rendering), `getStaticItems` (board/static pieces), `canDrag`, `onClick`
- **Location**: `src/components/material/MaterialDescription.tsx`

### 2. Locator Pattern

Locators handle positioning and placement of items on the game table:

```
class Locator<P, M, L> {
  coordinates?: XYCoordinates  // Base position
  parentItemType?: M           // Place on top of another item
  getCoordinates(location): Coordinates  // Dynamic positioning
  // ... rotation, z-index, drop areas, visibility
}
```

- **Specialized locators**: `DeckLocator`, `PileLocator`, `HandLocator`, `ListLocator`, `FlexLocator`, `HexagonalGridLocator`
- **Purpose**: Reusable positioning logic across different game types
- **Location**: `src/locators/Locator.ts` and subclasses

### 3. Context-Based State Management

The library uses React Context extensively:

- **GameContext** (`src/components/GameProvider/GameContext.ts`): Provides game rules, material descriptions, locators, tutorials, animations, scoring, logs
- **MaterialContext/ItemContext**: Rich context passed through rendering for positioning and interactions
- **ThemeProvider**: Emotion theming for consistent styling

### 4. Hook-Based Logic

31+ custom hooks encapsulate game state and interactions:

**State management:**
- `useGame`, `usePlayers`, `usePlayerId`, `useActions`, `useLegalMoves`

**Game logic:**
- `useGiveUp`, `useUndo`, `usePlay`, `useRules`

**Material rendering:**
- `useMaterialContext`, `useMaterialDescription`, `useItemLocator`, `useItemLocations`

**UI interactions:**
- `useDraggedItem`, `useAnimations`, `useFullscreen`, `useZoomToElements`

**Location**: `src/hooks/`

## Key Components

### GameProvider

Entry point that wraps the entire game with:
- Apollo Client for GraphQL
- Emotion ThemeProvider
- Game context (rules, material descriptions, locators)
- Tutorial system integration
- Datadog logging (production)

**Usage**: Wrap your game app with `<GameProvider>` and provide game configuration

### Material System

- **GameTable**: Main playing area with drag & drop support
- **DraggableMaterial**: Interactive game pieces
- **Locations**: Drop areas and placement zones
- **Animations**: Visual effects for item movements (via animation context)
- **Material types**: Dices, FlatMaterial, Wheel, Writing, etc.

### UI Components

- **Dialogs**: ResultDialog, RulesDialog, MaterialHelpDialog
- **PlayerPanel**: Player information display
- **JournalTabs**: Game log with Chat and History
- **Menus**: Fullscreen, GiveUp, Sound, Undo buttons
- **Tutorial**: In-game tutorial system

## Important Implementation Details

### Generic Type Parameters

Almost everything uses `<P, M, L>` generics:
- `P`: Player ID type (number enum)
- `M`: Material type (number enum)
- `L`: Location type (number enum)

Always maintain these type parameters when extending classes or using hooks.

### Emotion Styling

- Uses `@emotion/react` for CSS-in-JS
- TypeScript config: `jsxImportSource: "@emotion/react"`
- Styling utilities in `src/css/`: `backgroundCss`, `buttonCss`, `cursorCss`, `shadowEffect`, `shineEffect`
- Theme interface: `GameTheme` with RootTheme, DialogTheme, DropAreaTheme, BackgroundTheme

### Internationalization

- i18next with ICU message format support
- `setupTranslation()` helper in `src/utilities/translation.util.ts`
- Material descriptions support `materialI18n` for localized content
- RTL support built-in
- Document language auto-updates from URL locale

### Drag & Drop

- Uses `@dnd-kit/core` for drag and drop
- Legal move validation during drag
- Multi-item selection support
- Drop area visualization via locators

### Static vs Dynamic Items

- **Static items**: Never move (boards, unlimited stockpiles) - defined in `getStaticItems()`
- **Dynamic items**: Part of game state, can move and change
- Static items don't trigger re-renders when game state changes

## Dependencies & Peer Dependencies

**Key dependencies:**
- React 19.1.1, React DOM 19.1.1
- @gamepark/react-client ~7.2.0 (state management)
- @gamepark/rules-api ^7.2.0 (game logic types)
- @emotion/react ^11.14.0 (styling)
- @apollo/client ^4.0.5 (GraphQL)
- i18next, react-i18next (internationalization)

**Important**: Emotion, React, and Game Park libraries are peer dependencies. Games using this library must provide them.

## Module Structure

```
src/
├── components/     # React components (GameProvider, Material, UI, Dialogs)
├── hooks/          # Custom React hooks (31+ hooks)
├── locators/       # Positioning system (Locator + specialized subclasses)
├── css/            # Theming and styling utilities
├── utilities/      # Shared utilities (translation, event handling)
└── index.ts        # Main exports
```

**Export pattern**: Main `index.ts` re-exports everything from subdirectories plus selected items from `@gamepark/react-client`

## Development Notes

### TypeScript Configuration

- Strict mode enabled (`strict: true`)
- Additional strict checks: `noImplicitThis`, `noUnusedLocals`, `noUnusedParameters`
- Composite project for faster builds
- Source maps for debugging
- Test files excluded: `**/*.test.ts`

### No Testing Framework

Currently no test files or testing framework configured. Focus is on TypeScript compilation and type safety.

### Yarn Berry

Uses Yarn v4.9.4 (modern Yarn with Plug'n'Play). Configuration in `.yarnrc.yml`.

### Common Patterns

**Extending MaterialDescription:**
1. Define your material types enum
2. Extend `MaterialDescription<P, M, L, ItemId>`
3. Implement `content` prop with React component
4. Optionally add `help`, `staticItems`, drag/click handlers

**Creating Custom Locators:**
1. Extend `Locator<P, M, L>`
2. Override `getCoordinates()` for dynamic positioning
3. Optionally override `getRotateZ()`, `getItemCoordinates()`, `getLocationBorderRadius()`

**Using Hooks:**
- Import from main package: `import { useGame, usePlayers } from '@gamepark/react-game'`
- Hooks are React hooks - follow React rules (top level, not in conditions)
- Many hooks use generic types matching your game's types
