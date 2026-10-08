# 🚀 NoteEditor Web - ការណែនាំអំពីការ Deploy ទៅកាន់ Vercel

ឯកសារនេះបង្ហាញពីរបៀបយកវេបសាយ **NoteEditor** ទៅបង្ហោះ (Deploy) លើ **Vercel (Fast Edge Network)** ជាមួយប្រព័ន្ធសុវត្ថិភាព Express, Helmet, Rate-Limiting, Turso Database, និងកញ្ចប់ទាញយកទាំង ១១។

---

## 🔑 ១. Environment Variables ដែលត្រូវកំណត់ក្នុង Vercel

នៅពេល Deploy លើ Vercel Dashboard សូមចូលទៅកាន់ផ្ទាំង **Settings** > **Environment Variables** ហើយបន្ថែម៖

| Variable Name | តម្លៃគំរូ | ការពិពណ៌នា |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | បើកដំណើរការ Production Mode |
| `TURSO_DATABASE_URL` | `libsql://your-db-org.turso.io` | URL នៃ Turso Cloud Database |
| `TURSO_AUTH_TOKEN` | `eyJhbGciOi...` | Auth Token សម្ងាត់សម្រាប់ Turso |

*(ចំណាំ៖ `.env` ក្នុងកុំព្យូទ័រត្រូវបានការពារដោយ `.gitignore` មិនឱ្យ Push ឡើង Git ឡើយ)*

---

## ⚡ ជម្រើសទី ១៖ Deploy តាមរយៈ Vercel Web Dashboard (ងាយស្រួលបំផុត)

1. **ដំណើរការ `deploy.bat`**:
   - ចុច Double-click លើ [deploy.bat](file:///c:/Users/Ty/Desktop/web%20for%20noteeditor/deploy.bat) ហើយចុច **Enter** ដើម្បី Push កូដ និងកញ្ចប់ទាំងអស់ទៅកាន់ GitHub (`https://github.com/LyTyty-6666/NoteEditor`)។
2. **ចូលទៅកាន់ Vercel**:
   - ចូលទៅកាន់ **[vercel.com/new](https://vercel.com/new)**។
3. **Import Git Repository**:
   - ជ្រើសរើស repository **`LyTyty-6666/NoteEditor`** រួចចុច **Import**។
4. **កំណត់ Environment Variables**:
   - បើកផ្ទាំង **Environment Variables**។
   - បញ្ចូល `TURSO_DATABASE_URL` និង `TURSO_AUTH_TOKEN`។
5. **ចុច Deploy**:
   - ចុចប៊ូតុង **Deploy**។
   - Vercel នឹងអាន [vercel.json](file:///c:/Users/Ty/Desktop/web%20for%20noteeditor/vercel.json) និង [api/index.js](file:///c:/Users/Ty/Desktop/web%20for%20noteeditor/api/index.js) ដោយស្វ័យប្រវត្តិ។
   - ក្នុងរយៈពេលមិនដល់ ១ នាទី វេបសាយរបស់អ្នកនឹងទទួលបាន Global Domain (ឧទាហរណ៍ `https://note-editor-xxx.vercel.app`) ជាមួយល្បឿនលឿនបំផុតនៅលើពិភពលោក!

---

## 💻 ជម្រើសទី ២៖ Deploy តាម Vercel CLI (Command Line)

អ្នកអាច Deploy ផ្ទាល់ពី Terminal ឬតាមរយៈជម្រើស `[2]` ក្នុង `deploy.bat`៖
```bash
npx vercel --prod
```
- ប្រព័ន្ធនឹងសួរកំណត់ Link ទៅកាន់គណនី Vercel របស់អ្នក។
- បន្ទាប់មកកូដនឹងត្រូវបាន Build និង Deploy ទៅកាន់ Production ភ្លាមៗ។

---

## 🛠️ ស្ថាបត្យកម្មដំណើរការលើ Vercel (`vercel.json` & `api/index.js`):
- **Static Assets (HTML/CSS/JS/Images)**: ត្រូវបានចែកចាយតាមរយៈ Vercel Edge CDN លឿនដូចផ្លេកបន្ទោរ។
- **Cross-Platform Downloads (`/Tools/*`)**: ត្រូវបានកំណត់ `Content-Disposition: attachment` ក្នុង `vercel.json` ឱ្យទាញយកដោយស្វ័យប្រវត្តិតាមរយៈ Edge CDN។
- **Express API & Turso DB (`/api/*`)**: ដំណើរការតាមរយៈ Vercel Serverless Function ក្នុង `api/index.js` ដោយមានប្រព័ន្ធការពារ XSS, Honeypot, និង Rate Limiting ពេញលេញ។
