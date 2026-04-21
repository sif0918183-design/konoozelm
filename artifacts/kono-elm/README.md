# موسوعة كنوز العلم الإلكترونية

تطبيق ويب متكامل للبحث عن الكتب الإسلامية وتحميلها مباشرة، يعتمد على مكتبة Archive.org.

## المميزات

- 🔍 بحث ذكي في مكتبة Archive.org
- 📚 عرض النتائج في بطاقات أنيقة مع غلاف الكتاب
- 📖 قراءة أونلاين مباشرة من Archive.org
- ⬇️ تحميل مباشر لملفات PDF
- 📱 تصميم متجاوب (Mobile-First)
- ⏳ تأثيرات Skeleton أثناء التحميل
- 📊 تسجيل عمليات البحث في Supabase

## المتطلبات

- Node.js 18+
- npm أو yarn

## التثبيت

```bash
# تثبيت المتطلبات
npm install

# تشغيل التطوير
npm run dev
```

## الإعداد

1. أنشئ ملف `.env.local` بناءً على `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

2. أنشئ جدول `search_logs` في Supabase باستخدام ملف `supabase-schema.sql`

## النشر على Vercel

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# نشر
vercel
```

أو اتبع الخطوات التالية:
1. ارفع المشروع إلى GitHub
2. اذهب إلى Vercel وسجل دخولك
3. اختر "Add New Project" واختر مستودعك
4. أضف المتغيرات البيئية:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. انقر "Deploy"

## هيكل المشروع

```
kono-elm/
├── src/
│   ├── app/
│   │   ├── globals.css     # أنماط CSS
│   │   ├── layout.tsx      # تخطيط الصفحة
│   │   └── page.tsx        # الصفحة الرئيسية
│   ├── components/
│   │   ├── BookCard.tsx    # بطاقة الكتاب
│   │   └── SearchSkeleton.tsx  # تأثير التحميل
│   └── lib/
│       ├── archive-api.ts  # API Archive.org
│       ├── supabase.ts     # إعدادات Supabase
│       └── utils.ts        # أدوات مساعدة
├── .env.example            # نموذج المتغيرات البيئية
├── .env.local              # المتغيرات المحلية
├── next.config.js          # إعدادات Next.js
├── tailwind.config.js      # إعدادات Tailwind
└── package.json            # المتطلبات
```

##许可证

MIT