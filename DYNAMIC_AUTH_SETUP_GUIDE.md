# Dynamic Authentication Setup Guide

## ✅ What Has Been Implemented

Your authentication system now loads models **dynamically from the database** instead of hardcoded imports!

## 🚀 Quick Start

### 1. Start Your Server

The seeder will automatically run on startup and create the default configuration:

```bash
npm run dev
```

You should see:

```
Auth model configurations seeded successfully!
app is listening on port 5000
```

### 2. View Current Configurations

```bash
GET http://localhost:5000/api/auth-model-config
Authorization: Bearer YOUR_ADMIN_TOKEN
```

Response:

```json
[
  {
    "_id": "...",
    "modelName": "SystemUser",
    "importPath": "../modules/systemUser/systemUser.model",
    "exportName": "SystemUser",
    "selectFields": "isActive email role userId",
    "statusField": "isActive",
    "statusFieldInverted": true,
    "priority": 1,
    "isActive": true
  }
]
```

## 📝 Available API Endpoints

### Base URL: `/api/auth-model-config`

| Method | Endpoint       | Description                    | Role Required |
| ------ | -------------- | ------------------------------ | ------------- |
| GET    | `/`            | Get all configurations         | SUPER_ADMIN   |
| GET    | `/active`      | Get active configurations only | SUPER_ADMIN   |
| POST   | `/`            | Create new configuration       | SUPER_ADMIN   |
| PATCH  | `/:id`         | Update configuration           | SUPER_ADMIN   |
| DELETE | `/:id`         | Delete configuration           | SUPER_ADMIN   |
| PATCH  | `/:id/toggle`  | Toggle active status           | SUPER_ADMIN   |
| POST   | `/cache/clear` | Clear config cache             | SUPER_ADMIN   |

## 🎯 Example Use Cases

### Add a New User Type

Let's say you want to add an "Agent" user model:

```bash
POST http://localhost:5000/api/auth-model-config
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "modelName": "Agent",
  "importPath": "../modules/agent/agent.model",
  "exportName": "Agent",
  "selectFields": "isActive email agencyId agentCode",
  "statusField": "isActive",
  "statusFieldInverted": true,
  "priority": 2,
  "isActive": true
}
```

**That's it!** The auth middleware will now automatically check the Agent model.

### Temporarily Disable a Model

```bash
PATCH http://localhost:5000/api/auth-model-config/{config-id}/toggle
Authorization: Bearer YOUR_TOKEN
```

### Update Select Fields

```bash
PATCH http://localhost:5000/api/auth-model-config/{config-id}
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "selectFields": "isActive email role userId wholesalerId agencyId"
}
```

### Change Priority Order

Higher priority = checked first:

```bash
PATCH http://localhost:5000/api/auth-model-config/{config-id}
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "priority": 10
}
```

## 🏗️ Architecture

### Before (Hardcoded):

```typescript
// ❌ Old way - hardcoded imports
import { User } from "../modules/user/user.model";
import { Subuser } from "../modules/subuser/subuser.model";

// Had to modify code for each new user type
```

### After (Database-Driven):

```typescript
// ✅ New way - dynamic loading from database
const configs = await AuthModelConfig.find({ isActive: true });

for (const config of configs) {
  const Model = await import(config.importPath);
  const user = await Model.findById(userId);
  // ...
}
```

## 📊 Configuration Schema

```typescript
{
  modelName: string; // Display name
  importPath: string; // Path to model file
  exportName: string; // Export name (default or named)
  selectFields: string; // MongoDB select fields
  statusField: string; // Field to check (isActive, isLocked, etc.)
  statusFieldInverted: boolean; // true = should be true, false = should be false
  priority: number; // Higher = checked first
  isActive: boolean; // Enable/disable
}
```

## 🔧 Configuration Parameters Explained

### `statusField` & `statusFieldInverted`

**For `isActive` field:**

```json
{
  "statusField": "isActive",
  "statusFieldInverted": true // ← User must have isActive: true
}
```

**For `isLocked` field:**

```json
{
  "statusField": "isLocked",
  "statusFieldInverted": false // ← User must have isLocked: false
}
```

### `exportName`

**Named export:**

```typescript
export const SystemUser = model(...);
// Use: "exportName": "SystemUser"
```

**Default export:**

```typescript
export default model(...);
// Use: "exportName": "default"
```

### `selectFields`

MongoDB select syntax:

- Include fields: `"email role isActive"`
- Exclude fields: `"-password -__v"`
- Mix: `"email role -password"`

## ⚡ Performance

### Caching

- Configurations cached for **5 minutes**
- Prevents DB query on every request
- Auto-refresh after expiry

### Clear Cache

```bash
POST http://localhost:5000/api/auth-model-config/cache/clear
Authorization: Bearer YOUR_TOKEN
```

## 🛠️ Files Created

```
src/app/
├── middlewares/
│   └── auth.ts (updated)
├── modules/
│   └── auth/
│       ├── authModelConfig.model.ts        (new)
│       ├── authModelConfig.controller.ts   (new)
│       ├── authModelConfig.route.ts        (new)
│       ├── authModelConfig.seeder.ts       (new)
│       └── AUTH_MODEL_CONFIG_README.md     (new)
├── routes/
│   └── index.ts (updated)
└── server.ts (updated)
```

## 🎉 Benefits

1. **Zero Code Changes**: Add new user types via API
2. **Flexible**: Enable/disable models without deployment
3. **Performant**: Built-in caching reduces DB load
4. **Scalable**: Easily manage multiple user types
5. **Secure**: Only SUPER_ADMIN can modify configs

## 🔍 Testing

### Test Authentication Still Works

```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "userId": "your-user-id",
  "password": "your-password"
}
```

Then use the token in protected routes:

```bash
GET http://localhost:5000/api/some-protected-route
Authorization: Bearer YOUR_TOKEN
```

### Verify Config Loading

Check server logs on startup:

```
Auth model configurations seeded successfully!
```

### View Active Configs

```bash
GET http://localhost:5000/api/auth-model-config/active
Authorization: Bearer YOUR_ADMIN_TOKEN
```

## 🚨 Troubleshooting

### Auth fails after setup

1. Check if default config exists:

   ```bash
   GET /api/auth-model-config/active
   ```

2. Verify model path is correct in config

3. Check if config is active (`isActive: true`)

4. Wait 5 minutes or clear cache

### Model not loading

1. Ensure model file exists at `importPath`
2. Check `exportName` matches the actual export
3. Verify model is properly initialized

### Need to add existing user types

If you had commented User, Subuser, etc., add them via API:

```bash
POST /api/auth-model-config
{
  "modelName": "User",
  "importPath": "../modules/user/user.model",
  "exportName": "User",
  "selectFields": "isVerified isLocked wholesalerId",
  "statusField": "isLocked",
  "statusFieldInverted": false,
  "priority": 5,
  "isActive": true
}
```

## 📚 Next Steps

1. ✅ Server starts automatically with default config
2. ✅ Current authentication works with SystemUser
3. 🔄 Add more user types as needed via API
4. 🔄 Adjust priorities and fields as needed
5. 🔄 Monitor and optimize based on usage

## 💡 Pro Tips

- Set higher priority for most common user types
- Use cache clear sparingly (it auto-refreshes)
- Test each new config with actual login
- Keep selectFields minimal for performance
- Use toggle instead of delete for temporary disabling

---

**Your authentication system is now fully database-driven and ready to scale! 🎉**
