# Vercel Environment Variables

**Vercel Dashboard > Settings > Environment Variables** bölümüne bu değişkenleri ekleyin:

## Backend Environment Variables:
```
NODE_ENV = production
SUPABASE_URL = https://mcftvwpbxunfnxuqpysg.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZnR2d3BieHVuZm54dXFweXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzNjk5NCwiZXhwIjoyMDY4NDEyOTk0fQ.zX0gXluw785JXAREh8ff71ot62IQhF7SFxbJ3YFozF4
CORS_ORIGIN = https://chatingappsa1.vercel.app
FRONTEND_URL = https://chatingappsa1.vercel.app
```

## Frontend Environment Variables:
```
VITE_API_URL = https://chatingappsa1.vercel.app/api
VITE_SOCKET_URL = https://chatingappsa1.vercel.app
VITE_APP_NAME = SesliAsk.NeT
VITE_APP_VERSION = 1.0.0
VITE_SUPABASE_URL = https://mcftvwpbxunfnxuqpysg.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZnR2d3BieHVuZm54dXFweXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzY5OTQsImV4cCI6MjA2ODQxMjk5NH0.OFyrqEVoQBkUp3H8lKCv739qgbikwtwkHQvmS0TX4rI
```

## Deployment Steps:

1. **Vercel Dashboard'da bu değişkenleri ayarlayın**
2. **Projeyi deploy edin:**
   ```bash
   vercel --prod
   ```

3. **Deploy tamamlandıktan sonra test edin:**
   - Frontend: https://chatingappsa1.vercel.app
   - API Health Check: https://chatingappsa1.vercel.app/api/health

## Önemli Notlar:
- Environment variables'ı ayarladıktan sonra mutlaka yeniden deploy edin
- Her değişkeni tek tek ekleyin
- SERVICE_ROLE_KEY'i güvenli tutun (sadece backend'de kullanılır)
- ANON_KEY frontend'de güvenli kullanılabilir