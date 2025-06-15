// pages/api/batch-translate.js

import { db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Translator } from 'deepl-node';

async function getDeeplClient() {
    const siteRef = doc(db, 'sites', 'test-sitesi');
    const docSnap = await getDoc(siteRef);

    if (!docSnap.exists() || !docSnap.data().deepl_keys || docSnap.data().deepl_keys.length === 0) {
        throw new Error('Kayıtlı DeepL API anahtarı bulunamadı.');
    }
    
    // Şimdilik ilk anahtarı kullanıyoruz. 
    // Gelecekte burası da havuzdaki anahtarları sırayla deneyen bir yapıya dönüştürülebilir.
    const apiKey = docSnap.data().deepl_keys[0];
    return new Translator(apiKey);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Çevrilecek makale ID listesi eksik.' });
    }

    try {
        const translator = await getDeeplClient();
        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (const articleId of ids) {
            try {
                const articleRef = doc(db, 'articles', articleId);
                const articleSnap = await getDoc(articleRef);

                if (!articleSnap.exists() || articleSnap.data().durum !== 'ham') {
                    console.log(`Makale ${articleId} atlandı: bulunamadı veya durumu 'ham' değil.`);
                    continue; // Makale yoksa veya zaten çevrilmişse atla
                }

                const originalContent = articleSnap.data().content;
                const result = await translator.translateText(originalContent, 'en', 'tr');
                
                await updateDoc(articleRef, {
                    ceviri_icerik: result.text,
                    durum: 'çevrildi'
                });
                successCount++;
            } catch (error) {
                console.error(`Makale ${articleId} çevrilirken hata:`, error.message);
                failCount++;
                errors.push(error.message);
            }
        }

        res.status(200).json({ 
            message: `İşlem tamamlandı. ${successCount} makale çevrildi, ${failCount} makalede hata oluştu.`
        });

    } catch (error) {
        console.error('Toplu çeviri hatası:', error);
        res.status(500).json({ error: error.message });
    }
}
