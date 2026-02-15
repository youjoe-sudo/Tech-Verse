const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); 
});
// متغير بيعرفنا إحنا شغالين على Vercel ولا على الجهاز الشخصي
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

// دالة مساعدة للكتابة: بتكتب فقط لو مش على Vercel
const safeWriteSync = (file, data) => {
    if (!isProduction) {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    }
    console.warn(`⚠️ محاولة كتابة مرفوضة على Vercel لملف: ${file}`);
    return false;
};

// التأكد من وجود الملفات (فقط لو محلياً)
if (!isProduction) {
    const files = ['members.json', 'quizzes.json', 'forms.json', 'submissions.json'];
    files.forEach(file => {
        if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify([], null, 2));
    });
}

// ==============================
// أولاً: نظام الفورمات (Forms)
// ==============================

app.post('/create-form', (req, res) => {
    try {
        if (isProduction) return res.status(403).json({ error: 'التعديل متاح فقط من جهاز المطور' });
        
        const forms = JSON.parse(fs.readFileSync('forms.json', 'utf8'));
        forms.push(req.body);
        safeWriteSync('forms.json', forms);
        res.json({ message: 'تم إنشاء الاستمارة بنجاح!' });
    } catch (error) { res.status(500).json({ error: 'فشل إنشاء الفورم' }); }
});

app.get('/get-form-details', (req, res) => {
    try {
        const title = req.query.title;
        const forms = JSON.parse(fs.readFileSync('forms.json', 'utf8'));
        const form = forms.find(f => f.title === title);
        if (form) res.json(form);
        else res.status(404).json({ error: 'الفورم غير موجود' });
    } catch (error) { res.status(500).json({ error: 'خطأ في جلب البيانات' }); }
});

app.post('/submit-form', (req, res) => {
    try {
        if (isProduction) return res.status(403).json({ error: 'عفواً، Vercel لا يسمح بحفظ الردود في ملفات JSON. استخدم قاعدة بيانات.' });
        
        const subs = JSON.parse(fs.readFileSync('submissions.json', 'utf8'));
        subs.push({ ...req.body, date: new Date().toLocaleString('ar-EG') });
        safeWriteSync('submissions.json', subs);
        res.json({ message: 'تم استلام ردك بنجاح' });
    } catch (error) { res.status(500).json({ error: 'فشل حفظ الرد' }); }
});

// ==============================
// ثانياً: نظام الكويزات (Quizzes)
// ==============================

app.get('/list-quizzes', (req, res) => {
    try {
        const quizzes = JSON.parse(fs.readFileSync('quizzes.json', 'utf8'));
        res.json(quizzes.map(q => q.title));
    } catch (error) { res.status(500).json({ error: 'فشل تحميل الكويزات' }); }
});

app.post('/add-quiz', (req, res) => {
    try {
        if (isProduction) return res.status(403).json({ error: 'إضافة الكويزات متاحة من الجهاز الشخصي فقط' });
        
        const data = JSON.parse(fs.readFileSync('quizzes.json', 'utf8'));
        data.push(req.body);
        safeWriteSync('quizzes.json', data);
        res.status(200).json({ message: 'تم نشر الكويز!' });
    } catch (error) { res.status(500).json({ error: 'خطأ في الحفظ' }); }
});

app.get('/get-quiz/:title', (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync('quizzes.json', 'utf8'));
        const quiz = data.find(q => q.title === req.params.title);
        if (quiz) res.json(quiz);
        else res.status(404).json({ error: 'الكويز مش موجود' });
    } catch (error) { res.status(500).json({ error: 'خطأ في القراءة' }); }
});

// ==============================
// ثالثاً: نظام الأعضاء (Members)
// ==============================

app.post('/add-member', (req, res) => {
    try {
        if (isProduction) return res.status(403).json({ error: 'إضافة الأعضاء متاحة من الجهاز الشخصي فقط' });
        
        const members = JSON.parse(fs.readFileSync('members.json', 'utf8'));
        members.push(req.body);
        safeWriteSync('members.json', members);
        res.status(200).json({ message: 'تمت إضافة العضو!' });
    } catch (error) { res.status(500).json({ error: 'خطأ في ملف الأعضاء' }); }
});

app.get('/check-attempt/:memberId/:quizTitle', (req, res) => {
    try {
        const members = JSON.parse(fs.readFileSync('members.json', 'utf8'));
        const member = members.find(m => m.id === req.params.memberId);
        const hasAttempted = member && member.completedQuizzes && member.completedQuizzes.includes(req.params.quizTitle);
        res.json({ attempted: !!hasAttempted });
    } catch (error) { res.status(500).json({ error: 'خطأ في التشيك' }); }
});

app.post('/finish-quiz', (req, res) => {
    try {
        if (isProduction) return res.status(200).json({ message: 'تم العرض (لا يتم الحفظ على Vercel)' });

        const { memberId, quizTitle } = req.body;
        const members = JSON.parse(fs.readFileSync('members.json', 'utf8'));
        const index = members.findIndex(m => m.id === memberId);
        if (index !== -1) {
            if (!members[index].completedQuizzes) members[index].completedQuizzes = [];
            if (!members[index].completedQuizzes.includes(quizTitle)) {
                members[index].completedQuizzes.push(quizTitle);
                safeWriteSync('members.json', members);
            }
            res.json({ message: 'تم التسجيل!' });
        } else { res.status(404).json({ error: 'العضو غير موجود' }); }
    } catch (error) { res.status(500).json({ error: 'فشل التسجيل' }); }
});

// تشغيل السيرفر
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

module.exports = app; // مهم جداً لـ Vercel