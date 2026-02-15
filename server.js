const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());

// تشغيل الملفات الثابتة (CSS, JS, Images)
// دي بتخلي زرار الهامبورجر وأي ملف JS خارجي يشتغل
app.use(express.static(path.join(__dirname)));

// متغير بيعرف الكود هو شغال أونلاين ولا على جهازك
const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';

// دالة مساعدة للكتابة: بتكتب فقط لو مش على Vercel
const safeWrite = (fileName, data) => {
    if (!isVercel) {
        fs.writeFileSync(path.join(__dirname, fileName), JSON.stringify(data, null, 2));
        return true;
    }
    return false;
};

// دالة مساعدة للقراءة: بتبحث عن الملف في المسار الصحيح
const safeRead = (fileName) => {
    // path.resolve بيضمن إننا بنقرأ من الفولدر الرئيسي للمشروع
    const filePath = path.resolve(__dirname, fileName);
    
    if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    }
    console.log(`⚠️ الملف ${fileName} غير موجود في المسار: ${filePath}`);
    return [];
};

// ==============================
// راوتات الصفحات (Frontend)
// لضمان عدم ظهور Cannot GET
// ==============================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// أي صفحة HTML تطلبها (زي quiz-list.html) السيرفر هيلاقيها ويبعتها
app.get('/:page.html', (req, res) => {
    const filePath = path.join(__dirname, `${req.params.page}.html`);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('الصفحة غير موجودة');
    }
});

// ==============================
// أولاً: نظام الفورمات (Forms)
// ==============================

app.post('/create-form', (req, res) => {
    try {
        if (isVercel) return res.status(403).json({ error: 'التعديل متاح محلياً فقط' });
        const forms = safeRead('forms.json');
        forms.push(req.body);
        safeWrite('forms.json', forms);
        res.json({ message: 'تم إنشاء الاستمارة بنجاح!' });
    } catch (error) { res.status(500).json({ error: 'فشل إنشاء الفورم' }); }
});

app.get('/get-form-details', (req, res) => {
    try {
        const title = req.query.title;
        const forms = safeRead('forms.json');
        const form = forms.find(f => f.title === title);
        if (form) res.json(form);
        else res.status(404).json({ error: 'الفورم غير موجود' });
    } catch (error) { res.status(500).json({ error: 'خطأ في جلب البيانات' }); }
});

app.post('/submit-form', (req, res) => {
    try {
        if (isVercel) return res.status(200).json({ message: 'تم الاستلام (لن يحفظ أونلاين)' });
        const subs = safeRead('submissions.json');
        subs.push({ ...req.body, date: new Date().toLocaleString('ar-EG') });
        safeWrite('submissions.json', subs);
        res.json({ message: 'تم استلام ردك بنجاح' });
    } catch (error) { res.status(500).json({ error: 'فشل حفظ الرد' }); }
});

// ==============================
// ثانياً: نظام الكويزات (Quizzes)
// ==============================

app.get('/list-quizzes', (req, res) => {
    try {
        const quizzes = safeRead('quizzes.json');
        res.json(quizzes.map(q => q.title));
    } catch (error) { res.status(500).json({ error: 'فشل تحميل الكويزات' }); }
});

app.post('/add-quiz', (req, res) => {
    try {
        if (isVercel) return res.status(403).json({ error: 'ممنوع الحفظ أونلاين' });
        const data = safeRead('quizzes.json');
        data.push(req.body);
        safeWrite('quizzes.json', data);
        res.status(200).json({ message: 'تم نشر الكويز!' });
    } catch (error) { res.status(500).json({ error: 'خطأ في الحفظ' }); }
});

app.get('/get-quiz/:title', (req, res) => {
    try {
        const data = safeRead('quizzes.json');
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
        if (isVercel) return res.status(403).json({ error: 'ممنوع الحفظ أونلاين' });
        const members = safeRead('members.json');
        members.push(req.body);
        safeWrite('members.json', members);
        res.status(200).json({ message: 'تمت إضافة العضو!' });
    } catch (error) { res.status(500).json({ error: 'خطأ في ملف الأعضاء' }); }
});

app.get('/check-attempt/:memberId/:quizTitle', (req, res) => {
    try {
        const members = safeRead('members.json');
        const member = members.find(m => m.id === req.params.memberId);
        const hasAttempted = member && member.completedQuizzes && member.completedQuizzes.includes(req.params.quizTitle);
        res.json({ attempted: !!hasAttempted });
    } catch (error) { res.status(500).json({ error: 'خطأ في التشيك' }); }
});

app.post('/finish-quiz', (req, res) => {
    try {
        if (isVercel) return res.json({ message: 'تمت المحاكاة (لن يحفظ أونلاين)' });
        const { memberId, quizTitle } = req.body;
        const members = safeRead('members.json');
        const index = members.findIndex(m => m.id === memberId);
        if (index !== -1) {
            if (!members[index].completedQuizzes) members[index].completedQuizzes = [];
            if (!members[index].completedQuizzes.includes(quizTitle)) {
                members[index].completedQuizzes.push(quizTitle);
                safeWrite('members.json', members);
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

module.exports = app;