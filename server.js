const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname)); 

// دالة مساعدة للتأكد من وجود الملفات عشان السيرفر ميضربش
const files = ['members.json', 'quizzes.json', 'forms.json', 'submissions.json'];
files.forEach(file => {
    if (!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify([], null, 2));
});

// ==============================
// أولاً: نظام الفورمات (Forms)
// ==============================

// 1. إنشاء فورم جديد (من الداشبورد)
app.post('/create-form', (req, res) => {
    try {
        const forms = JSON.parse(fs.readFileSync('forms.json', 'utf8'));
        forms.push(req.body);
        fs.writeFileSync('forms.json', JSON.stringify(forms, null, 2));
        res.json({ message: 'تم إنشاء الاستمارة بنجاح!' });
    } catch (error) { res.status(500).json({ error: 'فشل إنشاء الفورم' }); }
});
// 2. جلب تفاصيل فورم معين (ده اللي كان ناقصك ومسبب 404)
app.get('/get-form-details', (req, res) => {
    try {
        const title = req.query.title;
        const forms = JSON.parse(fs.readFileSync('forms.json', 'utf8'));
        const form = forms.find(f => f.title === title);
        if (form) res.json(form);
        else res.status(404).json({ error: 'الفورم غير موجود' });
    } catch (error) { res.status(500).json({ error: 'خطأ في جلب البيانات' }); }
});

// 3. حفظ ردود الناس في الفورم
app.post('/submit-form', (req, res) => {
    try {
        const subs = JSON.parse(fs.readFileSync('submissions.json', 'utf8'));
        subs.push({ ...req.body, date: new Date().toLocaleString('ar-EG') });
        fs.writeFileSync('submissions.json', JSON.stringify(subs, null, 2));
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
        const data = JSON.parse(fs.readFileSync('quizzes.json', 'utf8'));
        data.push(req.body);
        fs.writeFileSync('quizzes.json', JSON.stringify(data, null, 2));
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
        const members = JSON.parse(fs.readFileSync('members.json', 'utf8'));
        members.push(req.body);
        fs.writeFileSync('members.json', JSON.stringify(members, null, 2));
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
        const { memberId, quizTitle } = req.body;
        const members = JSON.parse(fs.readFileSync('members.json', 'utf8'));
        const index = members.findIndex(m => m.id === memberId);
        if (index !== -1) {
            if (!members[index].completedQuizzes) members[index].completedQuizzes = [];
            if (!members[index].completedQuizzes.includes(quizTitle)) {
                members[index].completedQuizzes.push(quizTitle);
                fs.writeFileSync('members.json', JSON.stringify(members, null, 2));
            }
            res.json({ message: 'تم التسجيل!' });
        } else { res.status(404).json({ error: 'العضو غير موجود' }); }
    } catch (error) { res.status(500).json({ error: 'فشل التسجيل' }); }
});

app.listen(3000, () => {
    console.log('🚀 Tech Verse Server is running on http://localhost:3000');
});