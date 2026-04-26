```markdown
# damcuoithinhthu Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill introduces the core development patterns and conventions used in the `damcuoithinhthu` JavaScript repository. It covers file naming, import/export styles, commit patterns, and testing approaches. While no specific framework or automated workflows are detected, this guide ensures consistency and clarity for contributors.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names.
  - Example: `userProfile.js`, `orderManager.test.js`

### Imports
- Use **relative imports** for all modules.
  - Example:
    ```javascript
    import { fetchData } from './apiUtils';
    ```

### Exports
- Use **named exports** exclusively.
  - Example:
    ```javascript
    // In userProfile.js
    export function getUserProfile(id) { ... }
    export const USER_ROLE = 'admin';
    ```

### Commit Messages
- Follow **conventional commit** format.
- Use the `chore` prefix for maintenance and non-feature changes.
  - Example: `chore: update dependencies and fix lint errors`

## Workflows

### Commit Changes
**Trigger:** When making any code or maintenance update  
**Command:** `/commit-changes`

1. Make your code changes following the coding conventions.
2. Stage your changes:
   ```bash
   git add .
   ```
3. Commit using the conventional format:
   ```bash
   git commit -m "chore: <short description of change>"
   ```
4. Push your changes to the repository:
   ```bash
   git push
   ```

### Add a New Module
**Trigger:** When creating a new feature or utility module  
**Command:** `/add-module`

1. Create a new file using camelCase (e.g., `newFeature.js`).
2. Implement your logic using named exports.
   ```javascript
   // newFeature.js
   export function doSomething() { ... }
   ```
3. Import the module where needed using a relative path.
   ```javascript
   import { doSomething } from './newFeature';
   ```
4. Write a corresponding test file (see Testing Patterns).

## Testing Patterns

- Test files follow the `*.test.*` naming convention.
  - Example: `userProfile.test.js`
- The specific testing framework is not specified; ensure tests are colocated with or near the modules they test.
- Example test file structure:
  ```javascript
  import { getUserProfile } from './userProfile';

  test('should fetch user profile by ID', () => {
    // test implementation
  });
  ```

## Commands
| Command           | Purpose                                      |
|-------------------|----------------------------------------------|
| /commit-changes   | Guide for committing code changes            |
| /add-module       | Steps to add a new module to the codebase    |
```
