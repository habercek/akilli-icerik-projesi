// pages/api/manage-api-keys.js

import { db } from '../../firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { action, type, key } = req.body;

    if (!key || !type || !action) {
      return res.status(400).json({ error: 'Eksik parametre: action, type ve key gereklidir.' });
    }
    if (type !== 'deepl' && type !== 'gemini') {
      return res.status(400).json({ error: 'Geçersiz API tipi. Sadece "deepl" veya "gemini" kabul edilir.' });
    }
    if (action !== 'add' && action !== 'delete') {
      return res.status(400).json({ error: 'Geçersiz işlem. Sadece "add" veya "delete" kabul edilir.' });
    }

    const docRef = doc(db, 'sites', 'test-sitesi');
    const fieldName = type === 'deepl' ? 'deepl_keys' : 'gemini_keys';

    let updatePayload;
    if (action === 'add') {
      updatePayload = { [fieldName]: arrayUnion(key.trim()) };
    } else { // action === 'delete'
      updatePayload = { [fieldName]: arrayRemove(key.trim()) };
    }
    
    await updateDoc(docRef, updatePayload);

    const successMessage = `API anahtarı (${type}) başarıyla ${action === 'add' ? 'eklendi' : 'silindi'}.`;
    res.status(200).json({ message: successMessage });

  } catch (error) {
    console.error('API Anahtar Yönetimi Hatası:', error);
    res.status(500).json({ error: `Sunucuda bir hata oluştu: ${error.message}` });
  }
}
